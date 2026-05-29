"""
map 모델 비교: 7B-map+14B-reduce vs 전부-14B

같은 세션을 두 구성으로 돌려 회의록 품질과 소요 시간을 비교한다.
환경변수 OLLAMA_MAP_MODEL을 런타임에 바꿔가며 analyze_minutes를 호출한다.
(Ollama만 떠 있으면 됨)

사용법:
    cd ai-server
    python test/compare_map_model.py <세션디렉터리> [--goal "..."]
"""

import argparse
import asyncio
import importlib
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import importlib.util  # noqa: E402
_spec = importlib.util.spec_from_file_location(
    "kconf", os.path.join(os.path.dirname(__file__), "kconf_extract_test.py")
)
kconf = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(kconf)


async def run_with_map_model(map_model: str, transcript: str, goal):
    # config는 import 시점에 env를 읽으므로, env 변경 후 모듈을 새로 로드한다.
    os.environ["OLLAMA_MAP_MODEL"] = map_model
    import core.config as config
    importlib.reload(config)
    import services.llm as llm
    importlib.reload(llm)

    t0 = time.time()
    minutes = await llm.analyze_minutes(transcript, goal=goal)
    elapsed = time.time() - t0
    return minutes.model_dump(), elapsed


def summarize(label: str, data: dict, elapsed: float):
    print(f"\n{'=' * 60}\n[{label}]  소요 {elapsed:.1f}s")
    print(f"  decisions: {len(data['decisions'])}개")
    print(f"  todos: {len(data['todos'])}개")
    print(f"  questions: {len(data['questions'])}개")
    print(f"  next_agenda: {len(data['next_agenda'])}개")
    print(json.dumps(data, ensure_ascii=False, indent=2))


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("session_dir")
    ap.add_argument("--goal", default=None)
    ap.add_argument("--reduce-model", default="qwen2.5:14b")
    ap.add_argument("--map-model", default="qwen2.5:7b")
    args = ap.parse_args()

    os.environ["OLLAMA_MODEL"] = args.reduce_model

    transcript = kconf.build_transcript(args.session_dir, None)
    print(f"세션: {args.session_dir}\n전사문: {len(transcript):,}자")

    # A: 전부 reduce_model (baseline)
    print(f"\n>>> A 실행: map={args.reduce_model}, reduce={args.reduce_model}")
    data_a, sec_a = await run_with_map_model(args.reduce_model, transcript, args.goal)

    # B: map=map_model, reduce=reduce_model
    print(f"\n>>> B 실행: map={args.map_model}, reduce={args.reduce_model}")
    data_b, sec_b = await run_with_map_model(args.map_model, transcript, args.goal)

    summarize(f"A 전부-{args.reduce_model}", data_a, sec_a)
    summarize(f"B {args.map_model}-map + {args.reduce_model}-reduce", data_b, sec_b)

    print(f"\n{'=' * 60}\n[속도] A {sec_a:.1f}s → B {sec_b:.1f}s "
          f"({(1 - sec_b / sec_a) * 100:+.0f}%)")


if __name__ == "__main__":
    asyncio.run(main())
