from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import WHISPER_MODEL, OLLAMA_MODEL
from routers import transcribe, analyze

app = FastAPI(title="MeetLog AI Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcribe.router)
app.include_router(analyze.router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "whisper_model": WHISPER_MODEL,
        "ollama_model": OLLAMA_MODEL,
    }