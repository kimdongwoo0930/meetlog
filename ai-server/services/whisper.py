import asyncio
import os
import subprocess
import tempfile

from fastapi import HTTPException
from faster_whisper import WhisperModel

from core.config import WHISPER_MODEL, LOGPROB_THRESHOLD, NO_SPEECH_THRESHOLD

# 모델 초기화 (앱 시작 시 1회)
model = WhisperModel(WHISPER_MODEL, device="auto", compute_type="int8")
print(f"[ai-server] Whisper model '{WHISPER_MODEL}' loaded")

# WhisperModel은 thread-safe하지 않으므로 한 번에 하나씩 처리
_transcribe_lock = asyncio.Lock()


async def transcribe_audio(content: bytes, filename: str) -> str:
    """
    오디오 바이트 → STT 텍스트 변환
    1. ffmpeg으로 WAV 변환 (loudnorm 볼륨 정규화)
    2. Whisper STT
    3. 오인식 구간 필터링
    """
    suffix = os.path.splitext(filename or ".webm")[1] or ".webm"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_in:
        tmp_in.write(content)
        tmp_in_path = tmp_in.name

    tmp_wav_path = tmp_in_path + ".wav"

    try:
        # 1. ffmpeg 변환
        result = subprocess.run(
            [
                "ffmpeg", "-y", "-i", tmp_in_path,
                "-ar", "16000", "-ac", "1",
                "-af", "loudnorm",
                "-f", "wav", tmp_wav_path,
            ],
            capture_output=True,
            timeout=30,
        )
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"ffmpeg 변환 실패: {result.stderr.decode()}"
            )

        # 2. Whisper STT (Lock으로 직렬화)
        async with _transcribe_lock:
            loop = asyncio.get_event_loop()
            segments, info = await loop.run_in_executor(
                None,
                lambda: model.transcribe(
                    tmp_wav_path,
                    language="ko",
                    beam_size=5,
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500),
                    condition_on_previous_text=False,
                ),
            )

        print(
            f"[whisper] 언어={info.language}"
            f"({info.language_probability:.2f})"
        )

        # 3. 오인식 구간 필터링
        all_segments = list(segments)
        filtered = []
        for seg in all_segments:
            passed = (
                seg.avg_logprob > LOGPROB_THRESHOLD
                and seg.no_speech_prob < NO_SPEECH_THRESHOLD
            )
            status = "✓" if passed else "✗"
            print(
                f"  [{status}] [{seg.start:.1f}s→{seg.end:.1f}s]"
                f" logprob={seg.avg_logprob:.2f}"
                f" no_speech={seg.no_speech_prob:.2f}"
                f" | {seg.text.strip()}"
            )
            if passed:
                filtered.append(seg)

        text = " ".join(seg.text.strip() for seg in filtered).strip()
        print(f"[whisper] 최종 텍스트: {repr(text)}")
        return text

    finally:
        for path in (tmp_in_path, tmp_wav_path):
            try:
                os.unlink(path)
            except OSError:
                pass