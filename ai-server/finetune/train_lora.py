#!/usr/bin/env python3
"""
MeetLog LoRA 파인튜닝 스크립트 (Google Colab T4 — Unsloth 버전)
베이스 모델 : Qwen/Qwen2.5-7B-Instruct
전략      : 4-bit QLoRA + Unsloth (T4 최적화, triton 충돌 없음)

▶ Colab 실행 순서
  1. 런타임 → GPU (T4) 선택
  2. 셀 [1] 실행 후 반드시 런타임 재시작
  3. train_with_labels.json 업로드 (왼쪽 파일 패널 ↑)
  4. 셀 [2]부터 순서대로 실행
  5. 완료 후 lora_adapter.zip 다운로드
"""

# %% [1] 의존성 설치 — 실행 후 런타임 재시작 필수
# ============================================================
# !pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
# !pip install --no-deps trl peft accelerate bitsandbytes datasets sentencepiece

# %% [2] 임포트
# ============================================================
import json
import os
import shutil
from pathlib import Path

import torch

os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
from datasets import Dataset
from transformers import Trainer, TrainingArguments, DataCollatorForLanguageModeling
from unsloth import FastLanguageModel

# %% [3] 설정
# ============================================================
BASE_MODEL  = "Qwen/Qwen2.5-7B-Instruct"
DATA_FILE   = "train_with_labels.json"
OUTPUT_DIR  = "lora_adapter"

LORA_RANK    = 16
LORA_ALPHA   = 32
LORA_DROPOUT = 0.05
TARGET_MODULES = ["q_proj", "k_proj", "v_proj", "o_proj",
                  "gate_proj", "up_proj", "down_proj"]

MAX_SEQ_LEN  = 1024   # 2048→1024: attention 메모리 4배 절감
BATCH_SIZE   = 1
GRAD_ACCUM   = 8    # 유효 배치 = 8 유지
LR           = 2e-4
NUM_EPOCHS   = 3
WARMUP_RATIO = 0.05

SYSTEM_PROMPT = """당신은 한국어 회의록 작성 전문 AI입니다.
회의 STT(음성 인식) 원문을 분석해 핵심만 추려 구조화된 회의록을 작성합니다.

## 전처리 규칙
- 추임새 제거: "아", "어", "음", "그니까", "그러니까", "뭐", "저기", "있잖아", "막", "이제" 등
- 말 더듬·반복 제거: 같은 단어/문장의 반복은 한 번만
- STT 오인식으로 의미가 불분명한 조각은 무시
- 주제와 무관한 잡담·사담은 제외

## 항목별 작성 규칙
- summary: 회의 전체를 2~3문장으로 요약
- decisions: 확정된 사항만 (명시적 결정)
- todos: 실행 작업. text는 동사형, member는 담당자(불명확하면 "미정")
- questions: 결론 없이 끝난 질문·쟁점
- next_agenda: 다음 회의에서 다루기로 한 안건

반드시 한국어로, 지정된 JSON 스키마에 맞춰서만 출력한다."""


# %% [4] 데이터 준비
# ============================================================
def build_chat_text(item: dict) -> str:
    parts = []
    if item.get("goal"):
        parts.append(f"[회의 목표]\n{item['goal']}")
    if item.get("agenda"):
        parts.append(f"[사전 안건]\n{item['agenda']}")
    parts.append(f"[STT 원문]\n{item['input']}")
    user_content = "\n\n".join(parts)

    # apply_chat_template 대신 Qwen2.5 포맷 직접 구성
    return (
        f"<|im_start|>system\n{SYSTEM_PROMPT}<|im_end|>\n"
        f"<|im_start|>user\n{user_content}<|im_end|>\n"
        f"<|im_start|>assistant\n{json.dumps(item['output'], ensure_ascii=False)}<|im_end|>"
    )


def load_dataset(data_file: str) -> Dataset:
    raw = json.loads(Path(data_file).read_text(encoding="utf-8"))
    texts = [build_chat_text(item) for item in raw]
    print(f"[dataset] {len(texts)}개 샘플 로드")
    print(f"[dataset] 예시:\n{texts[0][:300]}\n")
    return Dataset.from_dict({"text": texts})


# %% [5] 모델 로드 (Unsloth)
# ============================================================
def load_model_and_tokenizer(base_model: str):
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=base_model,
        max_seq_length=MAX_SEQ_LEN,
        dtype=None,         # 자동 감지 (T4=float16)
        load_in_4bit=True,
    )
    tokenizer.eos_token = "<|im_end|>"
    tokenizer.pad_token = tokenizer.eos_token
    print(f"[model] 로드 완료: {base_model}")
    return model, tokenizer


# %% [6] LoRA 설정 (Unsloth)
# ============================================================
def apply_lora(model):
    model = FastLanguageModel.get_peft_model(
        model,
        r=LORA_RANK,
        target_modules=TARGET_MODULES,
        lora_alpha=LORA_ALPHA,
        lora_dropout=LORA_DROPOUT,
        bias="none",
        use_gradient_checkpointing="unsloth",  # VRAM 절약
        random_state=42,
    )
    model.print_trainable_parameters()
    return model


# %% [7] 학습
# ============================================================
def train(model, tokenizer, dataset: Dataset, output_dir: str) -> None:
    # 직접 토크나이즈 — SFTTrainer API 변화 우회
    def tokenize(examples):
        out = tokenizer(examples["text"], truncation=True, max_length=MAX_SEQ_LEN)
        out["labels"] = out["input_ids"].copy()
        return out

    tokenized = dataset.map(tokenize, batched=True, remove_columns=["text"])
    print(f"[train] 토크나이즈 완료: {len(tokenized)}개")

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=NUM_EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRAD_ACCUM,
        learning_rate=LR,
        warmup_ratio=WARMUP_RATIO,
        lr_scheduler_type="cosine",
        optim="adamw_8bit",
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=5,
        save_steps=50,
        save_total_limit=1,
        report_to="none",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized,
        data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
    )

    print("[train] 학습 시작...")
    trainer.train()
    print("[train] 학습 완료")

    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"[train] adapter 저장 완료: {output_dir}/")


# %% [8] 메인 실행
# ============================================================
if __name__ == "__main__":
    print(f"GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}")

    model, tokenizer = load_model_and_tokenizer(BASE_MODEL)
    model = apply_lora(model)
    dataset = load_dataset(DATA_FILE)
    train(model, tokenizer, dataset, OUTPUT_DIR)

    shutil.make_archive("lora_adapter", "zip", OUTPUT_DIR)
    print("\n=== 완료 ===")
    print("왼쪽 파일 패널에서 lora_adapter.zip 다운로드")
    print("로컬: unzip lora_adapter.zip -d ai-server/finetune/lora_adapter/")
