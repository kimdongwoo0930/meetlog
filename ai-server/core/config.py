import os

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "medium")
OLLAMA_MODEL  = os.getenv("OLLAMA_MODEL", "qwen2.5:14b")
OLLAMA_URL    = os.getenv("OLLAMA_URL", "http://localhost:11434")

LOGPROB_THRESHOLD   = float(os.getenv("LOGPROB_THRESHOLD", "-1.2"))
NO_SPEECH_THRESHOLD = float(os.getenv("NO_SPEECH_THRESHOLD", "0.7"))