import asyncio
import os
import re
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

# 한국어 Whisper가 무음/노이즈 구간에서 흔히 토해내는 환각 문구.
# (학습 데이터의 유튜브 자막에서 유래) 정확히 이 문장만 나온 구간은 버린다.
_HALLUCINATION_PHRASES = {
    "시청해주셔서 감사합니다",
    "시청해 주셔서 감사합니다",
    "구독과 좋아요 부탁드립니다",
    "구독 좋아요 부탁드립니다",
    "감사합니다",
    "다음 영상에서 만나요",
    "한글자막 by",
    "mbc 뉴스",
    "kbs 뉴스",
}


def _normalize(s: str) -> str:
    """환각/반복 비교용: 공백·문장부호 제거 후 소문자화"""
    return re.sub(r"[\s.,!?~…]+", "", s).lower()


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
                # highpass: 80Hz 이하 저주파 노이즈(에어컨/팬 등) 제거 후 볼륨 정규화
                "-af", "highpass=f=80,loudnorm",
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
                    initial_prompt="다음은 한국어 업무 회의 녹취입니다. 존댓말과 구어체가 섞여 있습니다.",
                    condition_on_previous_text=False,
                    # 무음 구간에서 환각 문장 생성 억제
                    hallucination_silence_threshold=2.0,
                    # 비정상적으로 반복된(압축률 높은) 구간은 재디코딩 유도
                    compression_ratio_threshold=2.4,
                ),
            )

        print(
            f"[whisper] 언어={info.language}"
            f"({info.language_probability:.2f})"
        )

        # 3. 오인식 구간 필터링
        all_segments = list(segments)
        filtered = []
        prev_norm = None
        for seg in all_segments:
            seg_text = seg.text.strip()
            norm = _normalize(seg_text)

            # 신뢰도 기준
            confident = (
                seg.avg_logprob > LOGPROB_THRESHOLD
                and seg.no_speech_prob < NO_SPEECH_THRESHOLD
            )
            # 알려진 환각 문구 / 직전 구간과 동일한 반복은 제외
            is_hallucination = norm in {_normalize(p) for p in _HALLUCINATION_PHRASES}
            is_repeat = norm and norm == prev_norm
            passed = confident and not is_hallucination and not is_repeat and bool(norm)

            if passed:
                reason = ""
            elif not confident:
                reason = "low-confidence"
            elif is_hallucination:
                reason = "hallucination"
            elif is_repeat:
                reason = "repeat"
            else:
                reason = "empty"

            status = "✓" if passed else f"✗({reason})"
            print(
                f"  [{status}] [{seg.start:.1f}s→{seg.end:.1f}s]"
                f" logprob={seg.avg_logprob:.2f}"
                f" no_speech={seg.no_speech_prob:.2f}"
                f" | {seg_text}"
            )
            if passed:
                filtered.append(seg)
                prev_norm = norm

        text = " ".join(seg.text.strip() for seg in filtered).strip()
        print(f"[whisper] 최종 텍스트: {repr(text)}")
        return text

    finally:
        for path in (tmp_in_path, tmp_wav_path):
            try:
                os.unlink(path)
            except OSError:
                pass