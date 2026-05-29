from pydantic import BaseModel
from typing import Optional


class TranscribeResponse(BaseModel):
    text: str


class AnalyzeRequest(BaseModel):
    text: str                        # STT 원문
    goal: Optional[str] = None       # 회의 목표 (사전 컨텍스트)
    agenda: Optional[str] = None     # 사전 안건




class TodoItem(BaseModel):
    text: str                        # 할 일 내용 (동사형)
    member: str = "미정"             # 담당자, 불명확하면 "미정"


class MeetingMinutes(BaseModel):
    summary: str
    decisions: list[str]
    todos: list[TodoItem]            # [{"text": str, "member": str}]
    questions: list[str]
    next_agenda: list[str]