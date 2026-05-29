"""
Whisper 백엔드/모델 속도·품질 벤치마크 (단일 오디오)

환경변수 WHISPER_BACKEND/WHISPER_MODEL로 구성을 바꿔 invoke 한다.
RTF(real-time factor) = 처리시간 / 오디오길이. 1보다 작을수록 실시간 여유.

사용:
    WHISPER_BACKEND=mlx    python test/whisper_bench.py <audio>
    WHISPER_BACKEND=faster WHISPER_MODEL=medium python test/whisper_bench.py <audio>
"""
import asyncio
import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.whisper import transcribe_audio  # noqa: E402
from core.config import WHISPER_BACKEND, WHISPER_MODEL  # noqa: E402


def audio_duration(path: str) -> float:
    out = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", path,
    ])
    return float(out.strip())


async def main():
    path = sys.argv[1]
    dur = audio_duration(path)
    data = open(path, "rb").read()

    print(f"\n{'#' * 60}")
    print(f"# backend={WHISPER_BACKEND}  model={WHISPER_MODEL}")
    print(f"# audio={path}  길이={dur:.1f}s")
    print(f"{'#' * 60}")

    t0 = time.time()
    text = await transcribe_audio(data, os.path.basename(path))
    dt = time.time() - t0

    print(f"\n>>> 결과 [{WHISPER_BACKEND}/{WHISPER_MODEL}]")
    print(f"    처리시간: {dt:.2f}s   RTF: {dt / dur:.2f}x   (오디오 {dur:.1f}s)")
    print(f"    전사: {text}")


if __name__ == "__main__":
    asyncio.run(main())
