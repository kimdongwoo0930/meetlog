# MeetLog AI Server

faster-whisper 기반 실시간 STT 서버. 회의실에서 녹음된 오디오 청크를 받아 한국어 텍스트로 변환합니다.

## 요구사항

- Python 3.11
- ffmpeg (`brew install ffmpeg`)


정상 실행 확인: `http://localhost:8000/health`

```json
{"status": "ok", "model": "small"}
```

## API

### `POST /transcribe`

오디오 파일을 받아 한국어 텍스트를 반환합니다.

**Request:** `multipart/form-data`
| 필드 | 타입 | 설명 |
|------|------|------|
| `audio` | File | WebM, WAV, MP3 등 ffmpeg 지원 포맷 |

**Response:**
```json
{"text": "안녕하세요 오늘 회의를 시작하겠습니다"}
```

텍스트가 없으면 (무음, 잡음 등):
```json
{"text": ""}
```

### `GET /health`

서버 상태 확인.

## 설정

| 환경변수 | 기본값 | 설명 |
|----------|--------|------|
| `WHISPER_MODEL` | `small` | Whisper 모델 크기 (`tiny` / `small` / `medium` / `large-v3`) |

모델 크기별 특성:

| 모델 | 정확도 | 속도 | 메모리 |
|------|--------|------|--------|
| `tiny` | 낮음 | 매우 빠름 | ~400MB |
| `small` | 보통 | 빠름 | ~1GB |
| `medium` | 높음 | 보통 | ~3GB |
| `large-v3` | 최고 | 느림 | ~6GB |


## 처리 흐름

```
오디오 업로드 (WebM)
    │
    ▼
ffmpeg → WAV 16kHz mono 변환
    │
    ▼
faster-whisper STT
  - language: ko
  - vad_filter: True  (무음 제거)
  - condition_on_previous_text: False  (반복 환각 방지)
    │
    ▼
텍스트 반환
```


# 실행

> uvicorn main:app --host 0.0.0.0 --port 8101 --reload 