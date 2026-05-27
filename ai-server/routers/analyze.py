from fastapi import APIRouter

from models.schemas import AnalyzeRequest, MeetingMinutes
from services.llm import analyze_minutes

router = APIRouter(prefix="/analyze", tags=["LLM"])


@router.post("", response_model=MeetingMinutes)
async def analyze(req: AnalyzeRequest):
    print(f"[analyze] 텍스트 길이={len(req.text)} 목표={req.goal}")
    return await analyze_minutes(
        text=req.text,
        goal=req.goal,
        agenda=req.agenda,
    )