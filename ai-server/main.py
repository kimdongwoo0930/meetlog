import asyncio
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

MODEL_SIZE = os.getenv("WHISPER_MODEL", "medium")
model = WhisperModel(MODEL_SIZE, device="auto", compute_type="int8")
print(f"[ai-server] Whisper model '{MODEL_SIZE}' loaded")

# WhisperModel은 thread-safe하지 않으므로 한 번에 하나씩 처리
_transcribe_lock = asyncio.Lock()


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
            [
                "ffmpeg", "-y", "-i", tmp_in_path,
                "-ar", "16000", "-ac", "1",
                "-af", "loudnorm",   # 볼륨 자동 정규화 추가
                "-f", "wav", tmp_wav_path
            ],
            capture_output=True,
            timeout=30,
        )
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"ffmpeg 변환 실패: {result.stderr.decode()}")

        # WhisperModel은 thread-safe하지 않으므로 Lock으로 직렬화
        async with _transcribe_lock:
            loop = asyncio.get_event_loop()
            segments, info = await loop.run_in_executor(
                None,
                lambda: model.transcribe(
                    tmp_wav_path,
                    language="ko",
                    beam_size=5,
                    vad_filter=True,
                    condition_on_previous_text=False,
                )
            )

        print(f"[transcribe] 파일={audio.filename} 크기={len(content)}bytes 언어={info.language}({info.language_probability:.2f})")

        LOGPROB_THRESHOLD = -1.2  # 이 값 이하 → 오인식 가능성 높음
        NO_SPEECH_THRESHOLD = 0.7  # 이 값 이상 → 말 없는데 환각한 것

        all_segments = list(segments)
        filtered = []
        for seg in all_segments:
            passed = seg.avg_logprob > LOGPROB_THRESHOLD and seg.no_speech_prob < NO_SPEECH_THRESHOLD
            status = "✓" if passed else "✗"
            print(f"  [{status}] [{seg.start:.1f}s→{seg.end:.1f}s] logprob={seg.avg_logprob:.2f} no_speech={seg.no_speech_prob:.2f} | {seg.text.strip()}")
            if passed:
                filtered.append(seg)

        text = " ".join(seg.text.strip() for seg in filtered).strip()
        print(f"[transcribe] 최종 텍스트: {repr(text)}")
        return TranscribeResponse(text=text)

    finally:
        for path in (tmp_in_path, tmp_wav_path):
            try:
                os.unlink(path)
            except OSError:
                pass
