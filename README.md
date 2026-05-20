<div align="center">

<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />

<br /><br />

# 🎙️ MeetLog

**실시간 음성 회의를 기록하고, AI가 회의록·결정사항·할 일을 자동 생성하는 협업 플랫폼**

</div>


## 📁 프로젝트 구조

```
meetlog/
├── frontend/       # Next.js 14 앱 (포트 3000)
├── backend/        # Spring Boot 3 앱 (포트 8080)
└── ai-server/      # FastAPI + faster-whisper (포트 8000)
```


## 가상회의 구현
 
- WebRTC — 브라우저 내장 API, 참가자 간 영상/음성 P2P 직접 전송
- STOMP over SockJS — 시그널링 채널 

| 구분 | Spring Boot | 브라우저 ↔ 브라우저 |
|------|-------------|------------------|
| 역할 | 시그널링 릴레이만 담당 | WebRTC P2P로 영상/음성 직접 전송 |
| 영상 데이터 | 안 거침 | 참가자 간 직접 전송 |
| 서버 부하 | 최소 (시그널 메시지만) | 없음 |

```
A 입장
  → join 신호 브로드캐스트
      ↓
기존 참가자 B가 수신
  → RTCPeerConnection 생성
  → offer 생성 → A에게 전송
      ↓
A가 offer 수신
  → RTCPeerConnection 생성
  → answer 생성 → B에게 전송
      ↓
양측 ICE candidate 교환
  → P2P 연결 수립
  → 영상/음성 직접 스트리밍 시작
```

## 🔄 실시간 STT 파이프라인

```
브라우저 마이크 
    │  말하면 녹음 시작, 1초 침묵하면 자동 전송
    ▼
POST /transcribe  →  ai-server (faster-whisper)
    │  한국어 STT 변환
    ▼
POST /api/meetings/{id}/segments  →  Spring Boot
    │  Redis에 저장 + STOMP 브로드캐스트
    ▼
모든 참여자 화면에 실시간 자막 표시
    | 회의종료 버튼 클릭
    ▼
지금까지 STT변환 데이터 정리 표시 -> 수정 및 삭제
    | 데이터가 클경우 분활 정리 부탁
    ▼
Qwen2.5-14B 로 회의록 정리
```