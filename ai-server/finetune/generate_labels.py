#!/usr/bin/env python3
"""
train_dummy.json 의 output을 Claude API(claude-opus-4-8)로 생성해 학습 데이터를 만든다.
(distillation: Claude 출력을 타깃으로 7B 모델을 학습시키기 위한 label 확보)

Usage:
    cd ai-server
    ANTHROPIC_API_KEY=sk-... python finetune/generate_labels.py

결과: finetune/data/train_with_labels.json
중간 저장 지원 — 중단해도 다음 실행 시 이어서 진행한다.
"""
import json
import sys
import time
from pathlib import Path

import anthropic
from pydantic import BaseModel

# ai-server 루트를 sys.path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.schemas import MeetingMinutes, TodoItem  # noqa: F401

INPUT_FILE  = Path(__file__).parent / "data" / "train_dummy.json"
OUTPUT_FILE = Path(__file__).parent / "data" / "train_with_labels.json"

MODEL = "claude-opus-4-8"

SYSTEM_PROMPT = """당신은 한국어 회의록 작성 전문 AI입니다.
회의 STT(음성 인식) 원문을 분석해 핵심만 추려 구조화된 회의록을 작성합니다.

## 전처리 규칙
- 추임새 제거: "아", "어", "음", "그니까", "그러니까", "뭐", "저기", "있잖아", "막", "이제" 등
- 말 더듬·반복 제거: 같은 단어/문장의 반복은 한 번만
- STT 오인식으로 의미가 불분명한 조각은 무시
- 주제와 무관한 잡담·사담은 제외
- 회의 목표와 사전 안건을 기준으로 관련 없는 내용을 걸러낸다
- 화자 표기([이름] 형식)가 있으면 담당자 추출에 활용한다

## 항목별 작성 규칙
- summary: 회의 전체를 2~3문장으로. 무엇을 논의했고 어떤 결론이 났는지 포함
- decisions: 확정된 사항만. "~하기로 했다", "~로 확정" 등 명시적 결정만 추출
- todos: 실행해야 할 작업. text는 "~하기/~구현/~작성" 동사형, member는 담당자(불명확하면 "미정")
- questions: 결론 없이 끝났거나 보류된 질문·쟁점
- next_agenda: 다음 회의에서 다루기로 명시한 안건

## 주의사항
- decisions와 todos는 내용이 겹치지 않게 구분한다 (결정=합의된 방침, todo=실행 작업)
- 추측·과장 금지. 원문에 근거가 있는 내용만 작성한다
- 해당 내용이 없으면 빈 배열 [] 로 둔다
- 반드시 한국어로 작성한다"""


def _build_user_message(item: dict) -> str:
    parts = []
    if item.get("goal"):
        parts.append(f"[회의 목표]\n{item['goal']}")
    if item.get("agenda"):
        parts.append(f"[사전 안건]\n{item['agenda']}")
    parts.append(f"[STT 원문]\n{item['input']}")
    return "\n\n".join(parts)


def generate_label(client: anthropic.Anthropic, item: dict) -> dict:
    """Claude API로 회의록 생성. MeetingMinutes dict 반환."""
    response = client.messages.parse(
        model=MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": _build_user_message(item)}],
        output_format=MeetingMinutes,
    )
    minutes: MeetingMinutes = response.parsed_output
    return minutes.model_dump()


def main() -> None:
    client = anthropic.Anthropic()  # ANTHROPIC_API_KEY 환경변수 사용

    data: list[dict] = json.loads(INPUT_FILE.read_text(encoding="utf-8"))
    total = len(data)
    print(f"[generate_labels] 모델: {MODEL}")
    print(f"[generate_labels] 총 {total}개 샘플 처리 예정")

    # 이미 완료된 항목 로드 (이어서 실행 가능)
    if OUTPUT_FILE.exists():
        done: list[dict] = json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
        done_idx = {item["_meta"]["idx"] for item in done}
        print(f"[generate_labels] 이미 완료된 항목: {len(done)}개 — 나머지부터 이어서 시작")
    else:
        done = []
        done_idx = set()

    errors = 0
    for i, item in enumerate(data, 1):
        idx = item["_meta"]["idx"]
        topic = item["_meta"].get("topic", "?")

        if idx in done_idx:
            print(f"  [{i:02d}/{total}] idx={idx} 건너뜀 (완료)")
            continue

        print(f"  [{i:02d}/{total}] idx={idx} | {topic}")
        t0 = time.time()

        try:
            output = generate_label(client, item)
            elapsed = time.time() - t0

            new_item = dict(item)
            new_item["output"] = output
            done.append(new_item)

            # 매 샘플마다 중간 저장
            OUTPUT_FILE.write_text(
                json.dumps(done, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            print(f"    ✓ {elapsed:.1f}s | summary: {output['summary'][:60]}...")

        except anthropic.RateLimitError:
            print("    ⏳ Rate limit — 60초 대기 후 재시도...")
            time.sleep(60)
            try:
                output = generate_label(client, item)
                new_item = dict(item)
                new_item["output"] = output
                done.append(new_item)
                OUTPUT_FILE.write_text(
                    json.dumps(done, ensure_ascii=False, indent=2), encoding="utf-8"
                )
            except Exception as e:
                errors += 1
                print(f"    ✗ 재시도 실패 (idx={idx}): {e}")

        except Exception as e:
            errors += 1
            print(f"    ✗ 오류 (idx={idx}): {e}")

    print(f"\n[generate_labels] 완료: {len(done)}개 저장, 오류 {errors}개")
    print(f"  → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
