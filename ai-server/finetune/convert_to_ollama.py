#!/usr/bin/env python3
"""
Colab에서 학습한 LoRA adapter를 Ollama 모델로 등록한다.

▶ 전제 조건
  - lora_adapter/ 폴더가 ai-server/finetune/ 아래 있어야 한다
  - llama.cpp 가 설치되어 있어야 한다
    brew install llama.cpp   (macOS)
  - Ollama가 실행 중이어야 한다

▶ 흐름
  1. adapter + base 가중치 병합 (merge_and_unload)
  2. 병합된 모델 → GGUF 변환 (llama.cpp convert)
  3. Ollama Modelfile 생성
  4. ollama create 명령으로 등록

Usage:
    cd ai-server
    python finetune/convert_to_ollama.py
"""
import subprocess
import sys
from pathlib import Path

import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

BASE_MODEL   = "Qwen/Qwen2.5-7B-Instruct"
ADAPTER_DIR  = Path(__file__).parent / "lora_adapter"
MERGED_DIR   = Path(__file__).parent / "merged_model"
GGUF_FILE    = Path(__file__).parent / "meetlog_7b.gguf"
OLLAMA_NAME  = "meetlog-7b"

MODELFILE_TEMPLATE = """\
FROM {gguf_path}
PARAMETER temperature 0.1
PARAMETER top_p 0.9
PARAMETER num_ctx 8192
SYSTEM \"\"\"당신은 한국어 회의록 작성 전문 AI입니다.
회의 STT(음성 인식) 원문을 분석해 핵심만 추려 구조화된 회의록을 작성합니다.
반드시 한국어로, 지정된 JSON 스키마에 맞춰서만 출력한다.\"\"\"
"""


def step1_merge() -> None:
    print("[1/4] adapter 병합 중...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    base = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float16,
        device_map="cpu",
        trust_remote_code=True,
    )
    model = PeftModel.from_pretrained(base, str(ADAPTER_DIR))
    merged = model.merge_and_unload()

    MERGED_DIR.mkdir(exist_ok=True)
    merged.save_pretrained(str(MERGED_DIR))
    tokenizer.save_pretrained(str(MERGED_DIR))
    print(f"    병합 완료 → {MERGED_DIR}")


def step2_convert_gguf() -> None:
    print("[2/4] GGUF 변환 중 (llama.cpp)...")
    result = subprocess.run(
        [
            "llama-quantize",          # 또는 "python llama.cpp/convert_hf_to_gguf.py"
            str(MERGED_DIR),
            str(GGUF_FILE),
            "q4_k_m",                  # 4-bit 양자화
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        # llama-quantize가 없으면 convert_hf_to_gguf.py 사용 안내
        print("  ✗ llama-quantize 실패. convert_hf_to_gguf.py 방식으로 재시도...")
        result2 = subprocess.run(
            [
                sys.executable,
                "convert_hf_to_gguf.py",
                str(MERGED_DIR),
                "--outfile", str(GGUF_FILE),
                "--outtype", "q4_k_m",
            ],
            capture_output=True,
            text=True,
        )
        if result2.returncode != 0:
            print(f"  ✗ GGUF 변환 실패: {result2.stderr[:500]}")
            print("  llama.cpp 설치 필요: brew install llama.cpp")
            sys.exit(1)

    print(f"    변환 완료 → {GGUF_FILE}")


def step3_create_modelfile() -> None:
    print("[3/4] Modelfile 생성 중...")
    modelfile_path = Path(__file__).parent / "Modelfile"
    modelfile_path.write_text(
        MODELFILE_TEMPLATE.format(gguf_path=str(GGUF_FILE.resolve())),
        encoding="utf-8",
    )
    print(f"    생성 완료 → {modelfile_path}")


def step4_ollama_create() -> None:
    print(f"[4/4] Ollama 모델 등록: {OLLAMA_NAME}")
    modelfile_path = Path(__file__).parent / "Modelfile"
    result = subprocess.run(
        ["ollama", "create", OLLAMA_NAME, "-f", str(modelfile_path)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"  ✗ ollama create 실패: {result.stderr[:500]}")
        sys.exit(1)
    print(f"    등록 완료: {OLLAMA_NAME}")
    print(f"\n이제 .env 또는 start.sh 에서 다음을 설정하면 map 단계에 사용된다:")
    print(f"  OLLAMA_MAP_MODEL={OLLAMA_NAME}")


if __name__ == "__main__":
    if not ADAPTER_DIR.exists():
        print(f"✗ {ADAPTER_DIR} 가 없습니다.")
        print("  Colab에서 학습 후 lora_adapter/ 폴더를 이 위치에 복사하세요.")
        sys.exit(1)

    step1_merge()
    step2_convert_gguf()
    step3_create_modelfile()
    step4_ollama_create()

    print("\n=== 완료 ===")
    print("ollama list 로 등록된 모델 확인 가능")
