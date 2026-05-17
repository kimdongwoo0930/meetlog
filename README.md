<div align="center">

<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />

<br /><br />

# 🎙️ MeetLog

**실시간 음성 회의를 기록하고, AI가 회의록·결정사항·할 일을 자동 생성하는 협업 플랫폼**

</div>

---

## 📁 프로젝트 구조

```
meetlog/
├── frontend/       # Next.js 14 앱 (포트 3000)
├── backend/        # Spring Boot 3 앱 (포트 8080)
└── ai-server/      # FastAPI + faster-whisper (포트 8000)
```

---

## ✅ 구현 현황

### Frontend
| 페이지 | 경로 | 상태 |
|--------|------|------|
| 랜딩 + 로그인/회원가입 | `/` | ✅ 완료 |
| 회의 목록 | `/meetings` | ✅ 완료 |
| 새 회의 생성 | `/meetings/new` | ✅ 완료 |
| 실시간 회의실 | `/meetings/[id]/room` | ✅ 완료 |
| 회의록 상세 | `/meetings/[id]` | 🚧 Mock 데이터 |
| 대시보드 | `/dashboard` | 🚧 미구현 |

### Backend
| 기능 | 상태 |
|------|------|
| 회원가입 / 로그인 (JWT) | ✅ 완료 |
| 회의 CRUD | ✅ 완료 |
| 참여자 관리 | ✅ 완료 |
| WebRTC 시그널링 (STOMP) | ✅ 완료 |
| 실시간 자막 저장 · 브로드캐스트 | ✅ 완료 |
| AI 분석 결과 저장 | 🚧 미구현 |

### AI Server
| 기능 | 상태 |
|------|------|
| 음성 → 텍스트 (faster-whisper) | ✅ 완료 |
| VAD 필터링 (무음 제거) | ✅ 완료 |
| 회의 요약 / 결정사항 분석 (LLM) | 🚧 미구현 |

---

## 🔄 실시간 STT 파이프라인

```
브라우저 마이크 (VAD 감지)
    │  말하면 녹음 시작, 1초 침묵하면 자동 전송
    ▼
POST /transcribe  →  ai-server (faster-whisper)
    │  한국어 STT 변환
    ▼
POST /api/meetings/{id}/segments  →  Spring Boot
    │  DB 저장 + STOMP 브로드캐스트
    ▼
모든 참여자 화면에 실시간 자막 표시
```

---

## 🚀 로컬 개발 환경 세팅

### 사전 요구사항
- Java 17+
- Node.js 18+
- MySQL 8
- Python 3.11 (conda 권장)
- ffmpeg (`brew install ffmpeg`)

### 1. Backend

```bash
cd backend
# application.properties에 MySQL 접속 정보 설정 후
./gradlew bootRun
```

`http://localhost:8080` 에서 실행됨

### 2. Frontend

```bash
cd frontend
npm install
# .env.local 설정 (아래 참고)
npm run dev
```

**`.env.local` 예시:**
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_AI_URL=http://localhost:8000
```

`http://localhost:3000` 에서 실행됨

### 3. AI Server

```bash
cd ai-server

# conda 환경 (최초 1회)
conda create -n meetlog python=3.11 -y
conda activate meetlog
pip install -r requirements.txt

# 서버 실행
conda activate meetlog
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

`http://localhost:8000/health` → `{"status":"ok","model":"small"}` 확인

> Whisper 모델(`small`)은 첫 `/transcribe` 호출 시 자동 다운로드됩니다.  
> 미리 받으려면: `python3 -c "from faster_whisper import WhisperModel; WhisperModel('small', device='cpu', compute_type='int8')"`

---

## 🌐 LAN 환경 (다른 기기에서 테스트)

MacBook에서 서버를 실행하고 Mac Mini 등 다른 기기에서 접속하는 경우:

```bash
# frontend 실행 시 (이미 package.json에 적용됨)
npm run dev   # 내부적으로 next dev -H 0.0.0.0

# .env.local에 실제 IP 입력
NEXT_PUBLIC_API_URL=http://192.168.x.x:8080
NEXT_PUBLIC_AI_URL=http://192.168.x.x:8000
```

> ⚠️ HTTP 환경에서는 카메라/마이크 접근이 `localhost`에서만 허용됩니다.  
> 다른 기기에서 STT를 사용하려면 Chrome 플래그에서 해당 IP를 안전한 출처로 등록하거나 ngrok으로 HTTPS 터널을 사용하세요.

---

## 🛠 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 14, TypeScript, WebRTC, STOMP |
| Backend | Spring Boot 3, Spring Security, JPA, MySQL |
| AI Server | FastAPI, faster-whisper, ffmpeg |
| 실시간 통신 | WebRTC (P2P 영상/음성), STOMP over SockJS (시그널링, 자막) |

---

## 📌 환경 변수 정리

### frontend/.env.local
| 변수 | 설명 | 기본값 |
|------|------|--------|
| `NEXT_PUBLIC_API_URL` | 백엔드 주소 | `http://localhost:8080` |
| `NEXT_PUBLIC_AI_URL` | AI 서버 주소 | `http://localhost:8000` |

### backend/src/main/resources/application.properties
| 속성 | 설명 |
|------|------|
| `spring.datasource.url` | MySQL 접속 URL |
| `spring.datasource.username` | DB 사용자명 |
| `spring.datasource.password` | DB 비밀번호 |
| `jwt.secret` | JWT 서명 키 |
