"""
AI Hub KconfSpeech(한국어 회의 음성) 라벨 → 회의록 추출 테스트

발화 단위 .txt 라벨을 세션별로 모아 STT 전사 규약 마커를 정리한 뒤,
analyze_minutes()를 직접 호출해 회의록 추출 품질을 검증한다.
(HTTP 서버/Whisper 로딩 불필요 — Ollama만 떠 있으면 됨)

사용법:
    cd ai-server
    python test/kconf_extract_test.py <세션디렉터리> [--max-chars N] [--dump]

    예) python test/kconf_extract_test.py /tmp/kconf/D20/G02/S000255
"""

import argparse
import asyncio
import json
import os
import re
import sys

# ai-server 루트를 import 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.llm import analyze_minutes  # noqa: E402


def normalize_utterance(text: str) -> str:
    """KsponSpeech/KconfSpeech 전사 마커 → 깨끗한 구어체 텍스트"""
    # 1. (철자)/(발음) → 철자형 유지
    text = re.sub(r"\(([^)]*)\)/\([^)]*\)", r"\1", text)
    # 2. 비음성 단일문자 마커 제거: n/ o/ l/ b/ u/ 등
    text = re.sub(r"\b[a-zA-Z]/", "", text)
    # 3. 간투어 마커: 한글토큰/ → 한글토큰 (실제 추임새로 남겨 LLM이 제거하도록)
    text = re.sub(r"([가-힣]+)/", r"\1", text)
    # 4. 기타 특수기호 정리
    text = text.replace("*", "").replace("+", "")
    # 5. 공백 정리
    return re.sub(r"\s+", " ", text).strip()


def build_transcript(session_dir: str, max_chars: int | None) -> str:
    paths = sorted(
        os.path.join(session_dir, f)
        for f in os.listdir(session_dir)
        if f.endswith(".txt")
    )
    parts = []
    for p in paths:
        with open(p, encoding="utf-8") as f:
            line = normalize_utterance(f.read())
        if line:
            parts.append(line)
    transcript = " ".join(parts)
    if max_chars and len(transcript) > max_chars:
        transcript = transcript[:max_chars]
    return transcript


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("session_dir", help="발화 .txt들이 든 세션 디렉터리")
    ap.add_argument("--goal", default=None)
    ap.add_argument("--agenda", default=None)
    ap.add_argument("--max-chars", type=int, default=None,
                    help="전사문 최대 글자 수 (긴 세션 자르기)")
    ap.add_argument("--dump", action="store_true",
                    help="정규화된 전사문 전체 출력")
    args = ap.parse_args()

    if not os.path.isdir(args.session_dir):
        print(f"디렉터리 없음: {args.session_dir}")
        sys.exit(1)

    transcript = build_transcript(args.session_dir, args.max_chars)
    print(f"세션: {args.session_dir}")
    print(f"정규화 전사문: {len(transcript):,}자\n")
    if args.dump:
        print(transcript, "\n")
    else:
        print(f"앞부분 미리보기:\n{transcript[:400]}...\n")

    print("─" * 60)
    print("analyze_minutes() 호출 중 ...")
    minutes = await analyze_minutes(transcript, goal=args.goal, agenda=args.agenda)
    print("\n=== 추출된 회의록 ===")
    print(json.dumps(minutes.model_dump(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
