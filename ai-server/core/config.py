import os

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "medium")
OLLAMA_MODEL  = os.getenv("OLLAMA_MODEL", "qwen2.5:14b")
OLLAMA_URL    = os.getenv("OLLAMA_URL", "http://localhost:11434")

# map(구간별 요약) 전용 모델. 긴 회의에서 청크 수만큼 호출되므로 더 작고 빠른 모델을
# 쓰면 속도가 크게 개선된다. 미지정 시 OLLAMA_MODEL(reduce와 동일)을 그대로 사용.
OLLAMA_MAP_MODEL = os.getenv("OLLAMA_MAP_MODEL", OLLAMA_MODEL)

# Ollama 컨텍스트 길이: 기본값(2048)은 긴 회의 STT를 조용히 잘라버리므로 명시적으로 키운다.
OLLAMA_NUM_CTX  = int(os.getenv("OLLAMA_NUM_CTX", "8192"))
OLLAMA_TIMEOUT  = float(os.getenv("OLLAMA_TIMEOUT", "300"))

# 긴 회의(30~40분)는 전사문이 num_ctx를 초과하므로 map-reduce 요약을 쓴다.
# 전사문이 이 글자 수를 넘으면 청크로 나눠 구간별 요약 후 최종 통합한다.
OLLAMA_CHUNK_CHARS = int(os.getenv("OLLAMA_CHUNK_CHARS", "3500"))

# reduce 단계 입력(합쳐진 구간 정리) 최대 글자 수. 이를 넘으면 정리들을 그룹으로
# 다시 통합(계층적 reduce)해 num_ctx 안에 들어오게 접는다. num_ctx보다 작아야 한다.
OLLAMA_REDUCE_CHARS = int(os.getenv("OLLAMA_REDUCE_CHARS", "7000"))

LOGPROB_THRESHOLD   = float(os.getenv("LOGPROB_THRESHOLD", "-1.2"))
NO_SPEECH_THRESHOLD = float(os.getenv("NO_SPEECH_THRESHOLD", "0.7"))