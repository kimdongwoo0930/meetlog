"""
STT → LLM end-to-end 테스트 스크립트

실제 오디오 파일을 /transcribe(Whisper) → /analyze(LLM) 순서로 통과시켜
환각 필터링과 회의록 생성 품질을 한 번에 확인한다.

사용법:
    # 서버 먼저 실행 (별도 터미널): bash start.sh
    python test/stt_e2e_test.py <오디오파일> [--goal "회의 목표"] [--agenda "사전 안건"]

    # AI Hub 라벨(JSON)이 있으면 정답 대조까지:
    python test/stt_e2e_test.py meeting.wav --label meeting_label.json

환경변수:
    AI_SERVER_URL  기본값 http://localhost:8000  (도커는 :8101)
"""

import argparse
import json
import os
import sys
import time

import httpx

BASE_URL = os.getenv("AI_SERVER_URL", "http://localhost:8000")


def transcribe(path: str) -> str:
    filename = os.path.basename(path)
    with open(path, "rb") as f:
        files = {"audio": (filename, f, "application/octet-stream")}
        with httpx.Client(timeout=600.0) as client:
            resp = client.post(f"{BASE_URL}/transcribe", files=files)
    resp.raise_for_status()
    return resp.json()["text"]


def analyze(text: str, goal: str | None, agenda: str | None) -> dict:
    payload = {"text": text, "goal": goal, "agenda": agenda}
    with httpx.Client(timeout=300.0) as client:
        resp = client.post(f"{BASE_URL}/analyze", json=payload)
    resp.raise_for_status()
    return resp.json()


def load_aihub_reference(label_path: str) -> str | None:
    """
    AI Hub 라벨 JSON에서 정답 전사문을 최대한 뽑아본다.
    데이터셋마다 스키마가 달라 흔한 키들을 순서대로 시도한다.
    """
    try:
        with open(label_path, encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        print(f"[label] 읽기 실패: {e}")
        return None

    # 흔한 형태 1: {"transcription": {"text": "..."}} 또는 {"text": "..."}
    for key in ("transcription", "Transcription"):
        node = data.get(key) if isinstance(data, dict) else None
        if isinstance(node, dict) and node.get("text"):
            return node["text"]
        if isinstance(node, str):
            return node
    if isinstance(data, dict) and isinstance(data.get("text"), str):
        return data["text"]

    # 흔한 형태 2: 발화 리스트 [{"speaker":..., "form"/"text": "..."}]
    for key in ("utterance", "utterances", "dialogs", "data", "sentences"):
        items = data.get(key) if isinstance(data, dict) else None
        if isinstance(items, list):
            parts = [
                (it.get("form") or it.get("text") or it.get("sentence") or "")
                for it in items if isinstance(it, dict)
            ]
            joined = " ".join(p.strip() for p in parts if p).strip()
            if joined:
                return joined

    print("[label] 알 수 없는 라벨 스키마 — 정답 대조 생략")
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio", help="오디오 파일 경로 (wav/mp3/m4a/webm 등)")
    ap.add_argument("--goal", default=None)
    ap.add_argument("--agenda", default=None)
    ap.add_argument("--label", default=None, help="AI Hub 정답 라벨 JSON 경로")
    args = ap.parse_args()

    if not os.path.isfile(args.audio):
        print(f"파일 없음: {args.audio}")
        sys.exit(1)

    print(f"서버: {BASE_URL}")
    print(f"오디오: {args.audio} ({os.path.getsize(args.audio):,} bytes)\n")

    # 1. STT
    t0 = time.time()
    print("─" * 60)
    print("[1/2] /transcribe (Whisper STT) ...")
    try:
        text = transcribe(args.audio)
    except httpx.HTTPStatusError as e:
        print(f"STT 실패: {e.response.status_code} {e.response.text[:300]}")
        sys.exit(1)
    stt_sec = time.time() - t0
    print(f"  소요: {stt_sec:.1f}s, 글자 수: {len(text)}")
    print(f"  결과:\n{text}\n")

    if args.label:
        ref = load_aihub_reference(args.label)
        if ref:
            print(f"[정답 라벨] {len(ref)}자")
            print(f"  {ref[:300]}{'...' if len(ref) > 300 else ''}\n")

    if not text.strip():
        print("STT 결과가 비어 분석을 건너뜁니다.")
        sys.exit(0)

    # 2. LLM
    t1 = time.time()
    print("─" * 60)
    print("[2/2] /analyze (LLM 회의록 생성) ...")
    try:
        minutes = analyze(text, args.goal, args.agenda)
    except httpx.HTTPStatusError as e:
        print(f"분석 실패: {e.response.status_code} {e.response.text[:300]}")
        sys.exit(1)
    llm_sec = time.time() - t1
    print(f"  소요: {llm_sec:.1f}s\n")
    print(json.dumps(minutes, ensure_ascii=False, indent=2))

    print("\n" + "─" * 60)
    print(f"총 소요: {stt_sec + llm_sec:.1f}s (STT {stt_sec:.1f}s + LLM {llm_sec:.1f}s)")


if __name__ == "__main__":
    main()
