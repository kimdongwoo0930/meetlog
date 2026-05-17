<div align="center">

<img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />

<br /><br />


# 🎙️ MeetLog

**실시간 회의 내용을 기록하고, AI를 통해 회의록과 할 일을 자동 생성하는 협업 플랫폼**

<br />

> 긴 회의 내용을 직접 정리하는 번거로움을 줄이고,  
> 팀이 중요한 의사결정과 협업에 더 집중할 수 있도록 설계되었습니다.

</div>

<br />


## ✨ 주요 기능

### 🎙 실시간 회의
- 회의방 생성 및 참여
- 실시간 음성 통신 (WebRTC)
- 화면 공유 기능
- 회의 참여자 관리

### 🤖 AI 회의 분석

회의 종료 후 AI가 자동으로:

- 회의 요약 생성
- 결정사항 추출
- 할 일(Action Item) 정리
- 질문 및 논의 내용 분석
- 다음 회의 안건 정리

### 📝 자동 회의록 생성

MeetLog는 긴 회의 내용을 구조화된 회의록 형태로 자동 정리합니다.

**예시 출력:**

```
회의 요약
  - 로그인 기능 구현 방향 논의

결정사항
  - JWT 인증 방식 사용
  - Frontend는 Next.js 사용
  - Backend는 Spring Boot 사용

할 일
  - 동우: 로그인 API 구현
  - 민수: 로그인 UI 제작

질문
  - 이메일 인증 기능 추가 여부

다음 회의 안건
  - API 명세 확정
```

---

## 🏗 시스템 구조

```
Client (Next.js)
    │
    │  WebRTC 실시간 음성 통신
    ▼
회의 음성 녹음
    │
    ▼
Spring Boot Backend
    │
    ▼
AI Processing Server (FastAPI)
    │
    ├── Whisper STT
    │
    └── LLM 요약 및 분석 (Qwen / Llama)
            │
            ▼
    구조화된 회의록 생성
```

---

## 🛠 기술 스택

### Frontend
| 기술 | 설명 |
|------|------|
| Next.js | React 기반 풀스택 프레임워크 |
| TypeScript | 정적 타입 언어 |
| Tailwind CSS | 유틸리티 기반 CSS 프레임워크 |
| WebRTC | 실시간 P2P 음성 통신 |

### Backend
| 기술 | 설명 |
|------|------|
| Spring Boot | Java 기반 백엔드 프레임워크 |
| Spring Security | 인증 및 보안 처리 |
| JPA | ORM 데이터 접근 계층 |
| MySQL | 관계형 데이터베이스 |

### AI Server
| 기술 | 설명 |
|------|------|
| FastAPI | Python 기반 AI 서버 프레임워크 |
| faster-whisper | 고성능 음성 인식(STT) |
| Ollama | 로컬 LLM 실행 환경 |
| Qwen2.5 / Llama 3 | 회의 분석 및 요약 LLM |

### Infrastructure
| 기술 | 설명 |
|------|------|
| Docker | 컨테이너 기반 환경 |
| Docker Compose | 멀티 컨테이너 오케스트레이션 |
| Nginx | 리버스 프록시 서버 |

---

## 🧠 AI 처리 과정

MeetLog는 단순 API 호출 방식이 아니라,  
회의 데이터를 여러 단계로 처리하여 회의록을 생성합니다.

```
회의 음성
    │
    ▼
음성 분할
    │
    ▼
STT 변환 (faster-whisper)
    │
    ▼
구간별 요약
    │
    ▼
전체 회의 분석 (LLM)
    │
    ▼
구조화된 회의록 생성
```

## 🧬 LoRA 기반 모델 파인튜닝
 
MeetLog는 범용 LLM의 한계를 넘어, **회의록 생성에 특화된 모델**을 직접 파인튜닝하여 정확도와 품질을 높이는 것을 목표로 합니다.
 
### 왜 LoRA인가?
 
| 항목 | 설명 |
|------|------|
| 효율적인 학습 | 전체 모델 가중치가 아닌 소수의 어댑터 파라미터만 학습 |
| 낮은 GPU 요구 | 일반 Full Fine-tuning 대비 VRAM 사용량 대폭 절감 |
| 빠른 실험 | 다양한 설정을 빠르게 실험하고 비교 가능 |
| 원본 모델 보존 | Base 모델은 그대로 유지하며 어댑터만 교체 가능 |
 
### 파인튜닝 파이프라인
 
```
회의 STT 텍스트 (원본 데이터)
    │
    ▼
데이터 전처리 및 포맷 변환
(instruction / input / output 형식)
    │
    ▼
LoRA 어댑터 학습
(Base 모델: Qwen2.5 / Llama 3)
    │
    ▼
검증 및 평가 (ROUGE, BERTScore)
    │
    ▼
어댑터 병합 및 배포
    │
    ▼
회의록 특화 모델 서빙 (Ollama)
```
 
### 학습 데이터 구조
 
파인튜닝에 사용되는 데이터는 아래 형식으로 구성됩니다.
 
```json
{
  "instruction": "다음 회의 내용을 분석하여 요약, 결정사항, 할 일, 질문, 다음 안건을 정리해주세요.",
  "input": "오늘 회의에서는 로그인 기능 구현 방향을 논의했습니다. JWT 방식을 사용하기로 결정했고...",
  "output": "## 회의 요약\n- 로그인 기능 구현 방향 논의\n\n## 결정사항\n- JWT 인증 방식 사용\n..."
}
```
 
### 사용 기술
 
| 기술 | 설명 |
|------|------|
| [PEFT](https://github.com/huggingface/peft) | HuggingFace LoRA 학습 라이브러리 |
| [TRL](https://github.com/huggingface/trl) | SFT (Supervised Fine-Tuning) 트레이너 |
| [bitsandbytes](https://github.com/TimDettmers/bitsandbytes) | 4-bit / 8-bit 양자화로 메모리 절감 |
| Qwen2.5 / Llama 3 | 파인튜닝 베이스 모델 |
| Ollama | 파인튜닝된 모델 로컬 서빙 |
 
