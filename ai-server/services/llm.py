import json
import re

import httpx
from fastapi import HTTPException

from core.config import (
    OLLAMA_MODEL,
    OLLAMA_MAP_MODEL,
    OLLAMA_URL,
    OLLAMA_NUM_CTX,
    OLLAMA_TIMEOUT,
    OLLAMA_CHUNK_CHARS,
    OLLAMA_REDUCE_CHARS,
)
from models.schemas import MeetingMinutes


SYSTEM_PROMPT = """당신은 한국어 회의록 작성 전문 AI입니다.
회의 STT(음성 인식) 원문을 분석해 핵심만 추려 구조화된 회의록을 작성합니다.

## 전처리 규칙
- 추임새 제거: "아", "어", "음", "그니까", "그러니까", "뭐", "저기", "있잖아", "막", "이제" 등
- 말 더듬·반복 제거: 같은 단어/문장의 반복은 한 번만
- STT 오인식으로 의미가 불분명한 조각은 무시
- 주제와 무관한 잡담·사담은 제외
- 회의 목표와 사전 안건을 기준으로 관련 없는 내용을 걸러낸다
- 화자 표기([이름] 형식)가 있으면 담당자 추출에 활용한다

## 항목별 작성 규칙
- summary: 회의 전체를 2~3문장으로. 무엇을 논의했고 어떤 결론이 났는지 포함
- decisions: 확정된 사항만. "~하기로 했다", "~로 확정" 등 명시적 결정만 추출
- todos: 실행해야 할 작업. text는 "~하기/~구현/~작성" 동사형, member는 담당자(불명확하면 "미정")
- questions: 결론 없이 끝났거나 보류된 질문·쟁점
- next_agenda: 다음 회의에서 다루기로 명시한 안건

## 주의사항
- decisions와 todos는 내용이 겹치지 않게 구분한다 (결정=합의된 방침, todo=실행 작업)
- 추측·과장 금지. 원문에 근거가 있는 내용만 작성한다
- 해당 내용이 없으면 빈 배열 [] 로 둔다
- 반드시 한국어로, 지정된 JSON 스키마에 맞춰서만 출력한다

## 예시
입력:
[이름] 회의 목표: 결제 모듈 일정 확정
[STT 원문] 어 그러니까 결제 모듈은 다음 주 금요일까지 1차 완료하기로 하죠. [민준] 네 제가 PG 연동 맡을게요. 음 환불 정책은 아직 법무 검토가 안 끝나서 다음에 다시 얘기해요.
출력:
{"summary": "결제 모듈 1차 완료 일정을 다음 주 금요일로 확정하고 PG 연동 담당을 정했다. 환불 정책은 법무 검토 미완료로 보류했다.", "decisions": ["결제 모듈 1차 완료 일정을 다음 주 금요일로 확정"], "todos": [{"text": "PG 연동 구현하기", "member": "민준"}], "questions": ["환불 정책을 어떻게 확정할 것인가 (법무 검토 대기)"], "next_agenda": ["환불 정책 재논의"]}"""


# 긴 회의용 map 단계 프롬프트: 한 구간에서 핵심 정보만 손실 없이 뽑아낸다.
MAP_PROMPT = """당신은 한국어 회의 STT 원문의 한 구간을 정리하는 AI입니다.
이 텍스트는 긴 회의의 일부분이며, 이후 다른 구간들과 합쳐 최종 회의록을 만듭니다.

추임새("아/어/음/그니까/뭐" 등)와 반복을 제거하고, 이 구간에 실제로 등장한 정보만
아래 형식의 한국어 불릿으로 정리하세요. 해당 항목이 없으면 그 줄은 생략합니다.
요약하지 말고 핵심 사실을 빠짐없이 보존하세요. 다른 설명은 출력하지 마세요.

[논의] 주요 논의 내용
[결정] 확정된 사항
[할일] 작업 내용 (담당자가 있으면 "내용 — 담당자")
[질문] 결론 없이 남은 질문·쟁점
[안건] 다음에 다루기로 한 내용"""


# 긴 회의에서 구간 정리들의 합이 너무 길 때, 여러 정리를 하나로 합치는 프롬프트.
# 카테고리 구조를 유지한 채 중복만 제거하고 정보는 보존한다(계층적 reduce).
MERGE_PROMPT = """여러 회의 구간 정리를 하나로 통합하는 AI입니다.
아래 구간 정리들을 같은 카테고리로 묶어 하나의 정리로 합치세요.
중복되는 항목은 합치되, 서로 다른 정보는 절대 빠뜨리지 마세요. 새로 요약하거나 추측하지 마세요.

[논의] / [결정] / [할일] / [질문] / [안건] 카테고리 구조를 그대로 유지해 출력하세요.
다른 설명은 출력하지 마세요."""


# Ollama structured output용 JSON 스키마.
# format에 스키마를 넘기면 모델이 키 누락 없이 정확한 구조로 출력하도록 강제된다.
MINUTES_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "decisions": {"type": "array", "items": {"type": "string"}},
        "todos": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "text": {"type": "string"},
                    "member": {"type": "string"},
                },
                "required": ["text", "member"],
            },
        },
        "questions": {"type": "array", "items": {"type": "string"}},
        "next_agenda": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["summary", "decisions", "todos", "questions", "next_agenda"],
}


async def _ollama_chat(
    system: str,
    user: str,
    fmt: dict | str | None = None,
    model: str = OLLAMA_MODEL,
) -> str:
    """Ollama /api/chat 단일 호출. 응답 content 문자열을 반환한다."""
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "stream": False,
        "options": {
            "temperature": 0.1,
            "top_p": 0.9,
            "num_ctx": OLLAMA_NUM_CTX,
        },
    }
    if fmt is not None:
        payload["format"] = fmt

    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            resp = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
            resp.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="LLM 응답 시간 초과")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Ollama 오류: {e.response.text[:300]}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Ollama 연결 실패: {e}")

    return resp.json()["message"]["content"].strip()


def _split_into_chunks(text: str, limit: int) -> list[str]:
    """문장 경계를 지켜 text를 limit 글자 이하의 청크들로 나눈다."""
    # 문장 끝(. ? !) 뒤 공백 기준으로 분할 — 문장 중간을 자르지 않는다.
    sentences = re.split(r"(?<=[.?!。？！])\s+", text)
    chunks: list[str] = []
    cur = ""
    for s in sentences:
        if not s:
            continue
        # 한 문장이 limit보다 길면 통째로 하나의 청크로 둔다.
        if len(cur) + len(s) + 1 > limit and cur:
            chunks.append(cur.strip())
            cur = s
        else:
            cur = f"{cur} {s}".strip()
    if cur.strip():
        chunks.append(cur.strip())
    return chunks


def _parse_minutes(raw: str) -> MeetingMinutes:
    """LLM 응답 문자열 → MeetingMinutes. JSON mode가 깨졌을 때를 대비한 방어적 파싱."""
    candidate = raw.strip()

    # 혹시 코드블록으로 감싸여 오면 벗겨낸다.
    if candidate.startswith("```"):
        candidate = re.sub(r"^```(?:json)?|```$", "", candidate, flags=re.MULTILINE).strip()

    try:
        data = json.loads(candidate)
    except json.JSONDecodeError:
        # 앞뒤에 군더더기 텍스트가 붙은 경우 첫 번째 JSON 객체만 추출
        match = re.search(r"\{.*\}", candidate, re.DOTALL)
        if not match:
            raise HTTPException(
                status_code=500,
                detail=f"LLM 응답에서 JSON을 찾지 못함\n원본: {raw[:500]}",
            )
        data = json.loads(match.group())

    return MeetingMinutes(**data)


def _build_context(body_label: str, body: str, goal: str | None, agenda: str | None) -> str:
    parts = []
    if goal:
        parts.append(f"[회의 목표]\n{goal}")
    if agenda:
        parts.append(f"[사전 안건]\n{agenda}")
    parts.append(f"[{body_label}]\n{body}")
    return "\n\n".join(parts)


async def _analyze_single(text: str, goal: str | None, agenda: str | None) -> MeetingMinutes:
    """짧은 회의: 전사문을 한 번에 분석한다."""
    user = _build_context("STT 원문", text, goal, agenda)
    raw = await _ollama_chat(SYSTEM_PROMPT, user, fmt=MINUTES_SCHEMA)
    print(f"[llm] (single) 원본 응답: {raw[:200]}...")
    return _parse_minutes(raw)


async def _analyze_mapreduce(text: str, goal: str | None, agenda: str | None) -> MeetingMinutes:
    """긴 회의: 구간별 요약(map) 후 통합 분석(reduce)."""
    chunks = _split_into_chunks(text, OLLAMA_CHUNK_CHARS)
    print(f"[llm] (map-reduce) {len(text):,}자 → 청크 {len(chunks)}개"
          f" / map={OLLAMA_MAP_MODEL} reduce={OLLAMA_MODEL}")

    # map: 구간별 핵심 정리 (순차 — Ollama 단일 인스턴스)
    notes = []
    import time

    for i, chunk in enumerate(chunks, 1):
        start = time.time()
        user = f"(구간 {i}/{len(chunks)})\n\n{chunk}"
        note = await _ollama_chat(MAP_PROMPT, user, model=OLLAMA_MAP_MODEL)
        elapsed = time.time() - start
        print(f"[llm]   구간 {i}/{len(chunks)} 정리 완료 ({len(note)}자) {elapsed:.1f}s")
        notes.append(note)

    # 계층적 reduce: 정리들의 합이 한도를 넘으면 그룹으로 통합해 접는다.
    notes = await _fold_notes(notes)

    # 최종 reduce: 구간 정리들을 합쳐 구조화된 회의록 생성
    combined = "\n\n".join(f"=== 정리 {i} ===\n{n}" for i, n in enumerate(notes, 1))
    user = _build_context("구간별 핵심 정리 (시간순)", combined, goal, agenda)
    raw = await _ollama_chat(SYSTEM_PROMPT, user, fmt=MINUTES_SCHEMA)
    print(f"[llm] (reduce) 원본 응답: {raw[:200]}...")
    return _parse_minutes(raw)


def _batch_notes(notes: list[str], limit: int) -> list[list[str]]:
    """정리들을 합산 글자 수가 limit 이하가 되도록 연속 그룹으로 묶는다."""
    batches: list[list[str]] = []
    cur: list[str] = []
    cur_len = 0
    for n in notes:
        if cur and cur_len + len(n) > limit:
            batches.append(cur)
            cur, cur_len = [], 0
        cur.append(n)
        cur_len += len(n)
    if cur:
        batches.append(cur)
    return batches


async def _fold_notes(notes: list[str]) -> list[str]:
    """구간 정리들의 합이 OLLAMA_REDUCE_CHARS 이하가 될 때까지 계층적으로 통합한다."""
    while sum(len(n) for n in notes) > OLLAMA_REDUCE_CHARS and len(notes) > 1:
        batches = _batch_notes(notes, OLLAMA_REDUCE_CHARS)
        if len(batches) == len(notes):
            # 더 못 줄임(각 정리가 이미 한도에 근접) — 무한루프 방지
            break
        print(f"[llm] (fold) 정리 {len(notes)}개 → {len(batches)}개로 통합")
        merged: list[str] = []
        for batch in batches:
            if len(batch) == 1:
                merged.append(batch[0])
            else:
                user = "\n\n".join(f"--- 정리 ---\n{n}" for n in batch)
                merged.append(await _ollama_chat(MERGE_PROMPT, user, model=OLLAMA_MAP_MODEL))
        notes = merged
    return notes


async def analyze_minutes(
    text: str,
    goal: str | None = None,
    agenda: str | None = None,
) -> MeetingMinutes:
    """STT 텍스트 → Ollama LLM → 구조화된 회의록.

    전사문이 길면 map-reduce(구간별 요약 → 통합)로 처리해
    긴 회의에서도 컨텍스트 잘림 없이 회의록을 만든다.
    """
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="분석할 STT 원문이 비어 있습니다")

    try:
        if len(text) <= OLLAMA_CHUNK_CHARS:
            return await _analyze_single(text, goal, agenda)
        return await _analyze_mapreduce(text, goal, agenda)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"회의록 생성 실패: {e}")
