#!/usr/bin/env python3
"""
LoRA 병합 모델(merged_model/)을 직접 로드해 map-reduce를 실행하고
demo_results_lora.json 을 생성한다.
GGUF/Ollama 등록 없이 transformers로 직접 추론.

Usage:
    cd ai-server
    python finetune/precompute_lora.py
"""
import asyncio
import json
import sys
import time
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.config import OLLAMA_CHUNK_CHARS, OLLAMA_REDUCE_CHARS, OLLAMA_MODEL, OLLAMA_URL
from services.llm import (
    _split_into_chunks, _batch_notes, _ollama_chat,
    _build_context, _parse_minutes,
    MAP_PROMPT, MERGE_PROMPT, SYSTEM_PROMPT, MINUTES_SCHEMA,
)

MERGED_MODEL_DIR = Path(__file__).parent / "merged_model"
DEMO_FILE        = Path(__file__).parent / "data" / "demo_meeting.txt"
OUTPUT_FILE      = Path(__file__).parent / "data" / "demo_results_lora.json"

# Metal GPU (M2) 사용
DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"
MAX_NEW_TOKENS = 600


def _parse_header(lines):
    goal, agenda, body = None, None, []
    for line in lines:
        if line.startswith("# 회의 목표:"):
            goal = line.removeprefix("# 회의 목표:").strip()
        elif line.startswith("# 사전 안건:"):
            agenda = line.removeprefix("# 사전 안건:").replace("\\n", "\n").strip()
        else:
            body.append(line)
    return goal, agenda, body


def load_lora_model():
    print(f"[lora] 모델 로드 중: {MERGED_MODEL_DIR}")
    print(f"[lora] 디바이스: {DEVICE}")
    tokenizer = AutoTokenizer.from_pretrained(str(MERGED_MODEL_DIR), trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        str(MERGED_MODEL_DIR),
        torch_dtype=torch.float16,
        device_map=DEVICE,
        trust_remote_code=True,
    )
    model.eval()
    print("[lora] 모델 로드 완료")
    return model, tokenizer


def lora_generate(model, tokenizer, system: str, user: str) -> str:
    """LoRA 병합 모델로 텍스트 생성."""
    messages = [
        {"role": "system", "content": system},
        {"role": "user",   "content": user},
    ]
    text = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    inputs = tokenizer(text, return_tensors="pt").to(DEVICE)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=MAX_NEW_TOKENS,
            temperature=0.1,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
        )

    new_tokens = outputs[0][inputs["input_ids"].shape[1]:]
    return tokenizer.decode(new_tokens, skip_special_tokens=True).strip()


async def run(demo_file: Path = DEMO_FILE, tag: str = "lora", output_file: Path | None = None):
    output_file = output_file or (Path(__file__).parent / "data" / f"demo_results_{tag}.json")
    # 데모 원고 로드
    raw_lines = demo_file.read_text(encoding="utf-8").splitlines()
    goal, agenda, body_lines = _parse_header(raw_lines)
    transcript = "\n".join(body_lines).strip()

    print(f"[lora] 원고 길이  : {len(transcript):,}자")
    print(f"[lora] map 모델   : merged_model (LoRA 적용)")
    print(f"[lora] reduce 모델: {OLLAMA_MODEL} (Ollama)")

    chunks = _split_into_chunks(transcript, OLLAMA_CHUNK_CHARS)
    print(f"[lora] 청크 수    : {len(chunks)}개\n")

    # LoRA 모델 로드
    model, tokenizer = load_lora_model()

    result = {
        "tag": tag,
        "meta": {
            "transcript_chars": len(transcript),
            "chunk_size": OLLAMA_CHUNK_CHARS,
            "chunk_count": len(chunks),
            "map_model": "meetlog-7b-lora (merged)",
            "reduce_model": OLLAMA_MODEL,
            "map_elapsed_total": 0.0,
            "reduce_elapsed": 0.0,
        },
        "goal": goal,
        "agenda": agenda,
        "transcript": transcript,
        "chunks": [{"index": i, "text": c, "chars": len(c)} for i, c in enumerate(chunks, 1)],
        "map_notes": [],
        "fold_rounds": [],
        "final_minutes": None,
    }

    # ── MAP (LoRA 모델) ──────────────────────────────────────────────────────
    print("=" * 60)
    print("[MAP]  meetlog-7b-lora")
    print("=" * 60)
    notes = []
    map_total = 0.0

    for i, chunk in enumerate(chunks, 1):
        print(f"\n▶ 구간 {i}/{len(chunks)} ({len(chunk)}자) ...")
        t0 = time.time()
        user_msg = f"(구간 {i}/{len(chunks)})\n\n{chunk}"
        note = lora_generate(model, tokenizer, MAP_PROMPT, user_msg)
        elapsed = time.time() - t0
        map_total += elapsed
        notes.append(note)
        result["map_notes"].append({"index": i, "note": note, "elapsed": round(elapsed, 1)})
        print(f"  완료 ({elapsed:.1f}s)")
        print(f"  ─── 구간 정리 ───\n{note}\n")

    result["meta"]["map_elapsed_total"] = round(map_total, 1)

    # ── FOLD (필요 시) ──────────────────────────────────────────────────────
    fold_round = 0
    while sum(len(n) for n in notes) > OLLAMA_REDUCE_CHARS and len(notes) > 1:
        fold_round += 1
        batches = _batch_notes(notes, OLLAMA_REDUCE_CHARS)
        if len(batches) == len(notes):
            break
        print(f"\n[FOLD 라운드 {fold_round}]")
        fold_results, new_notes = [], []
        for batch in batches:
            if len(batch) == 1:
                new_notes.append(batch[0])
                fold_results.append({"merged": False, "note": batch[0]})
            else:
                user = "\n\n".join(f"--- 정리 ---\n{n}" for n in batch)
                merged = lora_generate(model, tokenizer, MERGE_PROMPT, user)
                new_notes.append(merged)
                fold_results.append({"merged": True, "note": merged})
        notes = new_notes
        result["fold_rounds"].append({"round": fold_round, "results": fold_results})

    # ── REDUCE (Ollama 14B) ──────────────────────────────────────────────────
    print("=" * 60)
    print(f"[REDUCE]  {OLLAMA_MODEL} (Ollama)")
    print("=" * 60)
    combined = "\n\n".join(f"=== 정리 {i} ===\n{n}" for i, n in enumerate(notes, 1))
    user_msg = _build_context("구간별 핵심 정리 (시간순)", combined, goal, agenda)

    t0 = time.time()
    raw = await _ollama_chat(SYSTEM_PROMPT, user_msg, fmt=MINUTES_SCHEMA)
    elapsed = time.time() - t0
    result["meta"]["reduce_elapsed"] = round(elapsed, 1)

    minutes = _parse_minutes(raw)
    result["final_minutes"] = minutes.model_dump()

    print(f"\n완료 ({elapsed:.1f}s)")
    print("\n=== 최종 회의록 ===")
    print(json.dumps(result["final_minutes"], ensure_ascii=False, indent=2))

    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    total = map_total + elapsed
    print(f"\n[lora] 저장 완료: {output_file}")
    print(f"[lora] 총 소요  : {total:.1f}s")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", default=None, help="회의 원고 경로 (기본: demo_meeting.txt)")
    parser.add_argument("--tag", default="lora", help="결과 파일 접미사 (예: lora, marketing-lora)")
    parser.add_argument("--out", default=None, help="출력 JSON 경로 (기본: data/demo_results_{tag}.json)")
    args = parser.parse_args()
    demo_file = Path(args.file) if args.file else DEMO_FILE
    out_file = Path(args.out) if args.out else None
    asyncio.run(run(demo_file, args.tag, out_file))
