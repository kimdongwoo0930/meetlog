import os
import tempfile
import subprocess
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_SIZE = os.getenv("WHISPER_MODEL", "small")
model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
print(f"[ai-server] Whisper model '{MODEL_SIZE}' loaded")


class TranscribeResponse(BaseModel):
    text: str


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_SIZE}


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(audio: UploadFile = File(...)):
    content = await audio.read()
    if not content:
        raise HTTPException(status_code=400, detail="빈 오디오 파일")

    suffix = os.path.splitext(audio.filename or ".webm")[1] or ".webm"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_in:
        tmp_in.write(content)
        tmp_in_path = tmp_in.name

    tmp_wav_path = tmp_in_path + ".wav"

    try:
        # ffmpeg으로 WAV 변환 (faster-whisper가 가장 안정적으로 처리)
        result = subprocess.run(
            ["ffmpeg", "-y", "-i", tmp_in_path, "-ar", "16000", "-ac", "1", "-f", "wav", tmp_wav_path],
            capture_output=True,
            timeout=30,
        )
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"ffmpeg 변환 실패: {result.stderr.decode()}")

        segments, _ = model.transcribe(
            tmp_wav_path,
            language="ko",
            beam_size=5,
            vad_filter=True,
            condition_on_previous_text=False,
        )

        LOGPROB_THRESHOLD = -0.8   # 이 값 이하 → 오인식 가능성 높음
        NO_SPEECH_THRESHOLD = 0.5  # 이 값 이상 → 말 없는데 환각한 것

        filtered = [
            seg for seg in segments
            if seg.avg_logprob > LOGPROB_THRESHOLD and seg.no_speech_prob < NO_SPEECH_THRESHOLD
        ]
        text = " ".join(seg.text.strip() for seg in filtered).strip()
        return TranscribeResponse(text=text)

    finally:
        for path in (tmp_in_path, tmp_wav_path):
            try:
                os.unlink(path)
            except OSError:
                pass
