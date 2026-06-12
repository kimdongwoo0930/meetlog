#!/usr/bin/env python3
"""
발표용 데모 원고(demo_meeting.txt)를 map-reduce 파이프라인으로 실행하고
모든 중간 결과를 JSON에 저장한다.

Usage:
    cd ai-server

    # LoRA 전 (7B map + 14B reduce)
    OLLAMA_MAP_MODEL=qwen2.5:7b python finetune/precompute_demo.py --tag base

    # LoRA 후 (LoRA 7B map + 14B reduce)
    OLLAMA_MAP_MODEL=meetlog-7b python finetune/precompute_demo.py --tag lora

결과: finetune/data/demo_results_{tag}.json
"""
import argparse
import asyncio
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.config import (
    OLLAMA_CHUNK_CHARS,
    OLLAMA_REDUCE_CHARS,
    OLLAMA_MODEL,
    OLLAMA_MAP_MODEL,
)
from services.llm import (
    _split_into_chunks,
    _batch_notes,
    _ollama_chat,
    _build_context,
    _parse_minutes,
    MAP_PROMPT,
    MERGE_PROMPT,
    SYSTEM_PROMPT,
    MINUTES_SCHEMA,
)

DEMO_FILE = Path(__file__).parent / "data" / "demo_meeting.txt"
DATA_DIR  = Path(__file__).parent / "data"


def _parse_header(lines: list[str]) -> tuple[str | None, str | None, list[str]]:
    goal, agenda, body = None, None, []
    for line in lines:
        if line.startswith("# 회의 목표:"):
            goal = line.removeprefix("# 회의 목표:").strip()
        elif line.startswith("# 사전 안건:"):
            agenda = line.removeprefix("# 사전 안건:").replace("\\n", "\n").strip()
        else:
            body.append(line)
    return goal, agenda, body


async def run(tag: str) -> None:
    out_path = DATA_DIR / f"demo_results_{tag}.json"

    raw_lines = DEMO_FILE.read_text(encoding="utf-8").splitlines()
    goal, agenda, body_lines = _parse_header(raw_lines)
    transcript = "\n".join(body_lines).strip()

    print(f"[precompute:{tag}] 원고 길이  : {len(transcript):,}자")
    print(f"[precompute:{tag}] 청크 기준  : {OLLAMA_CHUNK_CHARS}자")
    print(f"[precompute:{tag}] map 모델   : {OLLAMA_MAP_MODEL}")
    print(f"[precompute:{tag}] reduce 모델: {OLLAMA_MODEL}")

    chunks = _split_into_chunks(transcript, OLLAMA_CHUNK_CHARS)
    print(f"[precompute:{tag}] 청크 수    : {len(chunks)}개\n")

    result: dict = {
        "tag": tag,
        "meta": {
            "transcript_chars": len(transcript),
            "chunk_size": OLLAMA_CHUNK_CHARS,
            "chunk_count": len(chunks),
            "map_model": OLLAMA_MAP_MODEL,
            "reduce_model": OLLAMA_MODEL,
            "map_elapsed_total": 0.0,
            "reduce_elapsed": 0.0,
        },
        "goal": goal,
        "agenda": agenda,
        "transcript": transcript,
        "chunks": [
            {"index": i, "text": c, "chars": len(c)}
            for i, c in enumerate(chunks, 1)
        ],
        "map_notes": [],
        "fold_rounds": [],
        "final_minutes": None,
    }

    # ── MAP ──────────────────────────────────────────────────────────────────
    print("=" * 60)
    print(f"[MAP]  {OLLAMA_MAP_MODEL}")
    print("=" * 60)
    notes: list[str] = []
    map_total = 0.0

    for i, chunk in enumerate(chunks, 1):
        print(f"\n▶ 구간 {i}/{len(chunks)} ({len(chunk)}자) ...")
        t0 = time.time()
        note = await _ollama_chat(
            MAP_PROMPT, f"(구간 {i}/{len(chunks)})\n\n{chunk}", model=OLLAMA_MAP_MODEL
        )
        elapsed = time.time() - t0
        map_total += elapsed
        notes.append(note)
        result["map_notes"].append({"index": i, "note": note, "elapsed": round(elapsed, 1)})
        print(f"  완료 ({elapsed:.1f}s)")
        print(f"  ─── 구간 정리 ───\n{note}\n")

    result["meta"]["map_elapsed_total"] = round(map_total, 1)

    # ── FOLD (필요 시) ────────────────────────────────────────────────────────
    fold_round = 0
    while sum(len(n) for n in notes) > OLLAMA_REDUCE_CHARS and len(notes) > 1:
        fold_round += 1
        batches = _batch_notes(notes, OLLAMA_REDUCE_CHARS)
        if len(batches) == len(notes):
            break
        print(f"\n[FOLD 라운드 {fold_round}]  {len(notes)}→{len(batches)}개")
        fold_results, new_notes = [], []
        for batch in batches:
            if len(batch) == 1:
                new_notes.append(batch[0])
                fold_results.append({"merged": False, "note": batch[0]})
            else:
                user = "\n\n".join(f"--- 정리 ---\n{n}" for n in batch)
                merged = await _ollama_chat(MERGE_PROMPT, user, model=OLLAMA_MAP_MODEL)
                new_notes.append(merged)
                fold_results.append({"merged": True, "note": merged, "from_count": len(batch)})
        notes = new_notes
        result["fold_rounds"].append({"round": fold_round, "results": fold_results})

    # ── REDUCE ───────────────────────────────────────────────────────────────
    print("=" * 60)
    print(f"[REDUCE]  {OLLAMA_MODEL}")
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

    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    total = map_total + elapsed
    print(f"\n[precompute:{tag}] 저장 완료: {out_path}")
    print(f"[precompute:{tag}] 총 소요  : {total:.1f}s  (map {map_total:.1f}s / reduce {elapsed:.1f}s)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--tag", default="base", help="결과 파일 접미사 (base | lora)")
    args = parser.parse_args()
    asyncio.run(run(args.tag))
