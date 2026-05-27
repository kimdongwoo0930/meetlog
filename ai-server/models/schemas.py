from pydantic import BaseModel
from typing import Optional


class TranscribeResponse(BaseModel):
    text: str


class AnalyzeRequest(BaseModel):
    text: str                        # STT 원문
    goal: Optional[str] = None       # 회의 목표 (사전 컨텍스트)
    agenda: Optional[str] = None     # 사전 안건




class MeetingMinutes(BaseModel):
    summary: str
    decisions: list[str]
    todos: list[dict]                # [{"text": str, "assignee": str}]
    questions: list[str]
    next_agenda: list[str]