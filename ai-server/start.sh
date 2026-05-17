#!/bin/bash
# ai-server 실행 스크립트

# 가상환경 없으면 생성
if [ ! -d ".venv" ]; then
  echo "[ai-server] 가상환경 생성 중..."
  python3 -m venv .venv
fi

source .venv/bin/activate

# 의존성 설치
echo "[ai-server] 패키지 설치 중..."
pip install -r requirements.txt -q

# ffmpeg 확인
if ! command -v ffmpeg &> /dev/null; then
  echo "[ai-server] ⚠ ffmpeg가 없습니다. brew install ffmpeg 로 설치하세요."
  exit 1
fi

echo "[ai-server] 서버 시작 (port 8000)..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
