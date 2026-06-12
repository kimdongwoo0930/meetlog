import asyncio
import os
import re
import subprocess
import tempfile
from types import SimpleNamespace

from fastapi import HTTPException

from core.config import (
    WHISPER_BACKEND,
    WHISPER_MODEL,
    LOGPROB_THRESHOLD,
    NO_SPEECH_THRESHOLD,
)

# initial_prompt는 지시문이 아니라 "직전 문맥 예시"다. Whisper는 이 스타일을 흉내내므로,
# 특정 도메인 용어 대신 회의에서 공통으로 쓰는 어휘·말투를 자연스러운 한국어 문장으로 심어
# 도메인 편향 없이 "회의체 한국어"(존댓말+구어체, 안건/일정/담당자 등)로 받아적게 유도한다.
_INITIAL_PROMPT = (
    "네, 그럼 회의를 시작하겠습니다. 오늘 안건과 일정, 담당자를 정리하고 "
    "지난 회의 내용을 검토하겠습니다. 음, 그러면 하나씩 논의해 보겠습니다."
)

# ── 백엔드별 모델 초기화 (앱 시작 시 1회) ───────────────────────────
# mlx: Apple Silicon Metal GPU 사용. faster: CTranslate2(맥에선 CPU).
_fw_model = None  # faster-whisper WhisperModel 인스턴스

if WHISPER_BACKEND == "mlx":
    import mlx_whisper  # noqa: F401  (transcribe 시 사용)
    print(f"[ai-server] STT backend=mlx (Metal GPU), model='{WHISPER_MODEL}'")
elif WHISPER_BACKEND == "faster":
    from faster_whisper import WhisperModel
    _fw_model = WhisperModel(WHISPER_MODEL, device="auto", compute_type="int8")
    print(f"[ai-server] STT backend=faster-whisper (CPU), model='{WHISPER_MODEL}'")
else:
    raise RuntimeError(f"알 수 없는 WHISPER_BACKEND: {WHISPER_BACKEND} (mlx|faster)")

# Whisper 추론은 thread-safe하지 않으므로 한 번에 하나씩 처리
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
    "먹자",
    "아마 아마 아마",
    "아주 아주 아주" ,

    # 영문 환각
    "Thank you for watching",
    "Please subscribe",
    "www.",
    "Kansas",
}


def _normalize(s: str) -> str:
    """환각/반복 비교용: 공백·문장부호 제거 후 소문자화"""
    return re.sub(r"[\s.,!?~…]+", "", s).lower()


def remove_hallucinations(text: str) -> str:
    # 1. 블랙리스트 문구 제거 (normalize 기준으로 비교)
    normalized_text = _normalize(text)
    for phrase in _HALLUCINATION_PHRASES:
        if _normalize(phrase) in normalized_text:
            text = re.sub(re.escape(phrase), "", text, flags=re.IGNORECASE)

    # 2. 반복 단어 패턴 제거 (먹자 먹자 먹자 / 아마 아마 아마)
    text = re.sub(r'(\b\S+\b)(\s+\1){2,}', '', text)

    # 3. 중복 공백 정리
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def _transcribe_mlx(wav_path: str):
    """mlx-whisper로 STT. (segments, language) 반환 — segments는 공통 형태로 정규화."""
    result = mlx_whisper.transcribe(
        wav_path,
        path_or_hf_repo=WHISPER_MODEL,
        language="ko",
        initial_prompt=_INITIAL_PROMPT,
        condition_on_previous_text=False,
        compression_ratio_threshold=2.4,
        hallucination_silence_threshold=2.0,
        verbose=None,
    )
    # mlx는 segment를 dict로 반환 → faster-whisper와 같은 속성 접근이 되도록 정규화
    segments = [
        SimpleNamespace(
            start=s.get("start", 0.0),
            end=s.get("end", 0.0),
            text=s.get("text", ""),
            avg_logprob=s.get("avg_logprob", 0.0),
            no_speech_prob=s.get("no_speech_prob", 0.0),
        )
        for s in result.get("segments", [])
    ]
    return segments, result.get("language", "ko")


def _transcribe_faster(wav_path: str):
    """faster-whisper로 STT. (segments, language) 반환."""
    segments, info = _fw_model.transcribe(
        wav_path,
        language="ko",
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
        initial_prompt=_INITIAL_PROMPT,
        condition_on_previous_text=False,
        hallucination_silence_threshold=2.0,
        compression_ratio_threshold=2.4,
    )
    return list(segments), info.language


def _run_backend(wav_path: str):
    if WHISPER_BACKEND == "mlx":
        return _transcribe_mlx(wav_path)
    return _transcribe_faster(wav_path)


async def transcribe_audio(content: bytes, filename: str) -> str:
    """
    오디오 바이트 → STT 텍스트 변환
    1. ffmpeg으로 WAV 변환 (highpass 노이즈 제거 + loudnorm 볼륨 정규화)
    2. Whisper STT (백엔드: mlx | faster)
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

        # 2. Whisper STT (Lock으로 직렬화 — 추론은 thread-safe하지 않음)
        async with _transcribe_lock:
            loop = asyncio.get_event_loop()
            segments, language = await loop.run_in_executor(
                None, lambda: _run_backend(tmp_wav_path)
            )

        print(f"[whisper] backend={WHISPER_BACKEND} 언어={language}")

        # 3. 오인식 구간 필터링
        filtered = []
        prev_norm = None
        hallucinations = {_normalize(p) for p in _HALLUCINATION_PHRASES}
        for seg in segments:
            seg_text = seg.text.strip()
            norm = _normalize(seg_text)

            # 신뢰도 기준
            confident = (
                seg.avg_logprob > LOGPROB_THRESHOLD
                and seg.no_speech_prob < NO_SPEECH_THRESHOLD
            )
            # 알려진 환각 문구 / 직전 구간과 동일한 반복은 제외
            is_hallucination = norm in hallucinations
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

        # 연속 반복 패턴 제거 (세그먼트 단위로 못 잡은 것)
        text = re.sub(r'(\b\S+\b)(\s+\1){2,}', '', text)
        text = re.sub(r'\s+', ' ', text).strip()

        print(f"[whisper] 최종 텍스트: {repr(text)}")
        return text

    finally:
        for path in (tmp_in_path, tmp_wav_path):
            try:
                os.unlink(path)
            except OSError:
                pass
