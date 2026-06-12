# MeetLog AI 파이프라인 — 성능 최적화 기록

실시간 음성 회의를 STT(Whisper) → LLM(Qwen2.5)으로 자동 회의록화하는 파이프라인의
성능·정확도 최적화 내역과 측정 결과를 정리한다.

- 환경: Apple Silicon Mac (Metal), Ollama, faster-whisper 1.2.1
- 모델: STT `faster-whisper medium (int8)`, LLM `qwen2.5:14b` / `qwen2.5:7b` (Ollama)
- 관련 코드: [ai-server/services/llm.py](ai-server/services/llm.py), [ai-server/services/whisper.py](ai-server/services/whisper.py)


## 1. LLM 회의록 생성

### 1-1. 컨텍스트 잘림 버그 수정 (정확도)

**문제.** Ollama의 기본 컨텍스트 길이(`num_ctx`)는 **2048 토큰**이다. 회의 STT 원문은
이를 쉽게 초과하는데, Ollama는 초과분을 **에러 없이 조용히 잘라버린다**. 즉 긴 회의일수록
뒷부분이 통째로 분석에서 누락되지만 겉보기엔 정상 동작처럼 보인다.

**해결.** `num_ctx`를 명시적으로 8192로 상향(`OLLAMA_NUM_CTX`).

### 1-2. Structured Output (정확도·안정성)

**문제.** 프롬프트로 "JSON만 출력하라"고 지시해도 모델이 코드블록(```json)이나 설명 문장을
덧붙여 파싱이 깨지는 경우가 있었다. 기존 코드는 문자열을 잘라내는 임시방편에 의존했다.

**해결.** Ollama `format`에 **JSON 스키마**를 직접 전달(structured output)해 스키마에 맞는
JSON을 강제. 키 누락·형식 오류가 구조적으로 방지된다. 파싱 실패 시 정규식 폴백도 유지.

### 1-3. map-reduce + 계층적 fold (긴 회의 대응)

**문제.** 30~40분 회의는 전사문이 수만 자다. `num_ctx`를 키우는 것만으로는
① 더 긴 회의에서 또 터지고 ② 컨텍스트가 길수록 모델 품질이 떨어지며 ③ 메모리가 급증한다.

**해결.** 회의 길이와 무관하게 동작하는 2단계(+재귀) 요약 구조:

```
긴 전사문
  → 문장 경계로 청크 분할 (OLLAMA_CHUNK_CHARS, 기본 3500자)
  → [map]    청크별 핵심 추출 (논의/결정/할일/질문/안건) — 요약이 아닌 "손실 최소 추출"
  → [fold]   정리들의 합이 한도(OLLAMA_REDUCE_CHARS, 기본 7000자) 초과 시
             그룹으로 다시 통합 — 한도 이내로 줄 때까지 반복 (계층적 reduce)
  → [reduce] 최종 구조화 JSON 회의록 생성
```

- **핵심 설계.** map은 "요약"이 아니라 "추출"로 설계했다. 단순 요약을 반복하면 결정사항·담당자가
  중간 단계에서 증발한다. 그래서 map은 카테고리별 사실을 빠짐없이 보존하도록 했다.
- **무한 길이 보장.** fold 루프 덕분에 회의가 아무리 길어도 reduce 입력이 `num_ctx`를
  넘지 않는다. 단일 단계 map-reduce의 "정리 합이 또 한도를 넘으면?" 문제를 해소.
- 짧은 회의(임계값 이하)는 오버헤드 없이 단일 호출.

### 1-4. map/reduce 모델 분리 (레이턴시·비용 최적화)

**아이디어.** map은 청크 수만큼(긴 회의면 10~40회) 호출되는 반면 reduce는 1회뿐이다.
그런데 어려운 추론(통합·판단·구조화)은 reduce에 몰려 있고, map(사실 추출)은 비교적 쉬운 작업이다.

**해결.** `OLLAMA_MAP_MODEL`로 **map은 경량 모델(`qwen2.5:7b`), reduce만 `14b`** 로 분리.
다수의 map 호출을 빠른 모델로 처리해 전체 레이턴시를 단축하면서 최종 품질은 14B로 유지.

#### 측정 (A/B 벤치마크)

- 데이터: AI Hub KconfSpeech `D20/S000371` (교육정책 토론, 28,846자 → 9청크)
- 스크립트: [ai-server/test/compare_map_model.py](ai-server/test/compare_map_model.py)

| 구성 | map 모델 | reduce 모델 | 총 소요 | decisions | todos | questions | next_agenda |
|---|---|---|---|---|---|---|---|
| A (baseline) | qwen2.5:14b | qwen2.5:14b | **389.6s** | 2 | 9 | 10 | 7 |
| B (최적화)    | qwen2.5:7b  | qwen2.5:14b | **181.9s** | 0 | 3 | 6 | 3 |

**레이턴시: 389.6s → 181.9s, −53% (약 2.1배 단축).** map 9회 호출을 7B로 처리한 효과.

**품질(트레이드오프): recall 손실 분명.** B는 더 빠르지만 추출 항목 수가 절반 이하로 줄었다.
특히 A의 todos는 담당자가 실명(의장·김교수·황교수)으로 잡힌 반면, B는 전부 "미정"이었다.
원인은 7B map이 더 짧고 성긴 정리를 내놓아(일부 구간 160~229자, 14B는 287~556자) 세부 정보가
map 단계에서 누락됐고, **reduce(14B)는 map이 흘린 정보를 복구할 수 없기** 때문이다.
요약(summary)·전체 구조는 reduce가 14B라 양쪽 모두 양호했다.

> 결론: "공짜 점심"은 아니다. **속도는 2배, 그러나 항목 recall은 희생**된다. → 이 격차가
> 바로 §3 LoRA distillation의 동기다. 7B map을 14B 출력으로 파인튜닝하면 속도를 유지하면서
> recall을 회복하는 것이 목표. (※ 단일 측정값으로, 세션·실행에 따라 편차 있을 수 있음)

---

## 2. Whisper STT

[ai-server/services/whisper.py](ai-server/services/whisper.py) 에 적용한 한국어 회의 음성 대응 개선.

| 개선 | 목적 | 내용 |
|---|---|---|
| 환각 문구 필터 | 정확도 | "시청해주셔서 감사합니다", "구독과 좋아요" 등 무음 구간 환각 제거 |
| 반복 구간 제거 | 정확도 | 직전과 동일한 구간 중복 제거 |
| highpass 필터 | 정확도 | ffmpeg `highpass=f=80` 로 저주파 노이즈(팬/에어컨) 제거 |
| 환각 억제 파라미터 | 정확도 | `hallucination_silence_threshold=2.0`, `compression_ratio_threshold=2.4` |
| 신뢰도 필터 | 정확도 | `avg_logprob`/`no_speech_prob` 기준 오인식 구간 제외 |

### 2-1. 백엔드 전환: faster-whisper → mlx-whisper (속도·품질)

**문제.** faster-whisper의 CTranslate2 백엔드는 **Apple GPU(Metal)를 지원하지 않아** 맥 서버에서
CPU로만 동작한다. 즉 M2/M3의 GPU가 놀고, 실시간 자막을 보여주기엔 STT가 느리다.

**해결.** STT 백엔드를 설정으로 추상화(`WHISPER_BACKEND`)하고, 맥 서버는 **mlx-whisper(Metal GPU)
+ `large-v3-turbo`** 로 전환. 도커/리눅스 등 비 Apple 환경은 `WHISPER_BACKEND=faster`로 폴백.
모델도 medium → large-v3-turbo로 올려 한국어 정확도를 높이면서 속도까지 잡았다.

#### 측정 (27.3초 한국어 회의 샘플, **M3 Pro 개발기** — 서버 M2는 절대값 다름, 상대 비교용)

| 구성 | 백엔드 | 모델 | 처리시간 | RTF | 품질 |
|---|---|---|---|---|---|
| 기존 | faster-whisper (CPU) | medium | 12.80s | 0.47x | 띄어쓰기 어색, 끝 구간 "하겠습니다" 누락 |
| **신규** | **mlx-whisper (Metal)** | **large-v3-turbo** | **2.11s** | **0.08x** | 띄어쓰기 정확, 끝까지 전사 |

- **속도 약 6배↑** (RTF 0.47 → 0.08). RTF≪1 이라 실시간 자막에 충분.
- **품질도 동시 개선**: turbo가 medium보다 한국어 전사가 깔끔하고 누락이 적었다.
- 한계: 영어 약어(PG/QA)는 음차("피지"/"카")로 적힘 — Whisper 공통 한계, `initial_prompt` 보강으로 완화 가능.

> 핵심: "GPU를 못 쓰는 백엔드(CTranslate2)" 라는 하드웨어 제약을 진단하고, Apple Silicon에
> 맞는 mlx로 전환해 **속도와 품질을 동시에** 개선. 백엔드는 설정으로 스위칭 가능하게 추상화.

---

## 3. LoRA 파인튜닝 — 7B map 품질 개선 (distillation)

§1-4에서 확인한 **7B map의 recall 손실 문제**를 해결하기 위해, Claude가 생성한
고품질 회의록을 타깃으로 삼아 Qwen2.5-7B를 파인튜닝했다.

### 3-1. 학습 설정

| 항목 | 값 |
|---|---|
| 베이스 모델 | `Qwen/Qwen2.5-7B-Instruct` |
| 기법 | QLoRA (4-bit) + LoRA rank 16, alpha 32 |
| 학습 데이터 | 한국어 회의 51개 (Claude opus-4-8 생성 라벨) |
| 플랫폼 | Google Colab T4 (15GB VRAM) |
| 라이브러리 | Unsloth + HuggingFace Trainer |
| Epochs | 3 (총 21 스텝) |
| 학습 파라미터 | 40,370,176개 / 전체의 0.53% |
| 관련 코드 | [ai-server/finetune/](ai-server/finetune/) |

### 3-2. 전/후 비교 — 발표용 데모 원고 기준

- 데이터: `ai-server/finetune/data/demo_meeting.txt` (10,504자 · 3청크)
- 파이프라인: **7B map** + 14B reduce
- 상세 비교 보고서: [ai-server/finetune/data/comparison_report.html](ai-server/finetune/data/comparison_report.html)

#### MAP 단계 — 구간별 정리 스타일 변화

| | Before LoRA (Base 7B) | After LoRA (Fine-tuned 7B) |
|---|---|---|
| 구간 1 | 할일 3개 (카테고리 없이 나열) | 스프린트 리뷰·API v2 설계·할일 섹션 분리 |
| 구간 2 | 카테고리별 그룹 (PR/결제/DB) | 담당자별 할일 개별 나열 (10개) |
| 구간 3 | 결정사항 + 핵심 할일 위주 | 세부 할일 전수 나열 (22개+) |

LoRA 후 **섹션 구조화와 담당자 분리**가 개선됐으나, 구간 3에서 세부 항목 과다 추출 경향 확인.

#### 최종 회의록 (REDUCE 14B 결과)

| 항목 | Before LoRA | After LoRA |
|---|---|---|
| decisions | **6개** | 2개 |
| todos | 8개 | **18개** |
| questions | 1개 | 0개 |
| next_agenda | 4개 | 3개 |

- LoRA 후 todos 추출량이 대폭 증가(8→18)하고 decisions가 감소(6→2).
- LoRA 모델이 map 단계에서 "할일" 형식으로 더 많이 추출하는 경향이 reduce 결과에 반영됨.
- decisions/todos 구분이 다소 흐려지는 것은 학습 데이터(51개) 부족과 에폭 수(3)의 한계.

### 3-3. 결론 및 개선 방향

**성과:** 7B 모델이 한국어 회의 맥락을 더 잘 인식하고 구조화된 정리를 출력하게 됨.

**한계:** 학습 데이터 51개는 distillation에 부족. 이상적으로는 300개 이상 필요하며,
decisions/todos 구분 기준을 명확히 한 데이터 큐레이션이 필요하다.

**서빙 관련:** 위 측정은 Ollama GGUF 서빙이 아닌 transformers float16으로 실행한 결과임.
GGUF 변환 후 Ollama로 서빙하면 Base 7B와 **동일한 속도**로 운영 가능 (§1-4 참고).

---

## 재현 방법

```bash
cd ai-server

# Ollama + 모델 준비
ollama pull qwen2.5:14b && ollama pull qwen2.5:7b

# map 모델 A/B 비교 (§1-4)
python test/compare_map_model.py /tmp/kconf/D20/G02/S000371 \
    --goal "국가교육위원회 교육정책 토론"

# 발표용 데모 사전 계산 (§3, LoRA 전)
OLLAMA_MAP_MODEL=qwen2.5:7b python finetune/precompute_demo.py --tag base

# 발표용 데모 사전 계산 (§3, LoRA 후 — merged_model/ 필요)
python finetune/precompute_lora.py

# 전/후 비교 HTML 보고서 생성
python finetune/compare_results.py --open

# 실제 오디오 e2e (서버 실행 필요)
bash start.sh   # 별도 터미널
python test/stt_e2e_test.py <오디오> --label <라벨.json>
```
