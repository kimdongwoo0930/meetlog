import json
import httpx
from fastapi import HTTPException

from core.config import OLLAMA_MODEL, OLLAMA_URL
from models.schemas import MeetingMinutes


SYSTEM_PROMPT = """당신은 회의록 작성 전문 AI입니다.
STT 원문에서 불필요한 추임새(아, 어, 음, 그니까 등)와 반복 표현을 제거하고
핵심 내용만 추출하여 아래 JSON 형식으로 회의록을 작성합니다.

반드시 아래 JSON 형식만 출력하고 다른 텍스트는 출력하지 마세요:
{
  "summary": "회의 전체 요약 (2~3문장)",
  "decisions": ["결정사항1", "결정사항2"],
  "todos": [{"text": "할 일 내용", "member": "담당자 이름"}],
  "questions": ["미결 질문1", "미결 질문2"],
  "next_agenda": ["다음 안건1", "다음 안건2"]
}"""


async def analyze_minutes(
    text: str,
    goal: str | None = None,
    agenda: str | None = None,
) -> MeetingMinutes:
    """
    STT 텍스트 → Ollama LLM → 구조화된 회의록
    """
    context_parts = []
    if goal:
        context_parts.append(f"[회의 목표]\n{goal}")
    if agenda:
        context_parts.append(f"[사전 안건]\n{agenda}")
    context_parts.append(f"[STT 원문]\n{text}")

    user_content = "\n\n".join(context_parts)

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_content},
        ],
        "stream": False,
        "options": {"temperature": 0.1},
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json=payload,
            )
            resp.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="LLM 응답 시간 초과")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Ollama 연결 실패: {e}")

    raw = resp.json()["message"]["content"].strip()
    print(f"[llm] 원본 응답: {raw[:200]}...")

    # JSON 파싱
    try:
        # 코드블록 제거
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw.strip())
        return MeetingMinutes(**data)
    except (json.JSONDecodeError, KeyError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLM 응답 파싱 실패: {e}\n원본: {raw}"
        )