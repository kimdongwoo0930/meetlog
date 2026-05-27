from fastapi import APIRouter, File, HTTPException, UploadFile

from models.schemas import TranscribeResponse
from services.whisper import transcribe_audio

router = APIRouter(prefix="/transcribe", tags=["STT"])


@router.post("", response_model=TranscribeResponse)
async def transcribe(audio: UploadFile = File(...)):
    content = await audio.read()
    if not content:
        raise HTTPException(status_code=400, detail="빈 오디오 파일")

    print(f"[transcribe] 파일={audio.filename} 크기={len(content)}bytes")

    text = await transcribe_audio(content, audio.filename or "")
    return TranscribeResponse(text=text)