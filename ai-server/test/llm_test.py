"""
MeetLog AI Server 테스트 스크립트
더미 데이터로 /transcribe, /analyze 엔드포인트 테스트
"""

import json
import httpx
import asyncio

BASE_URL = "http://localhost:8101"

# ── 더미 STT 텍스트 (추임새 포함) ───────────────
DUMMY_STT_TEXTS = [
    # {
    #     "name": "스프린트 회의",
    #     "goal": "이번 스프린트 작업 분배 및 기술 스택 확정",
    #     "agenda": "1. 로그인 기능 구현 방향\n2. API 명세 확정",
    #     "text": (
    #         "아 그니까 이번 스프린트에서 뭘 해야 하냐면은 음 로그인이랑 "
    #         "회의록 자동 생성 기능을 붙여야 할 것 같아요. 어 WebRTC는 이미 됐고 "
    #         "그니까 STT 연동이 제일 중요한 거고. 아 Whisper 모델은 medium으로 "
    #         "가는 게 맞을 것 같고 음 속도 때문에. 그리고 방장이 STT 원문 수정할 수 "
    #         "있게 해야 하는데 그게 UX 상 중요한 포인트야. 아 그리고 LoRA 파인튜닝 "
    #         "데이터셋도 이번 주 안에 만들어야 해. 최소 50개는. 다음 회의 때 중간 결과 공유하자."
    #     ),
    # },
    # {
    #     "name": "인프라 회의",
    #     "goal": "Docker 배포 환경 확정",
    #     "agenda": "1. Docker Compose 구성\n2. Nginx 설정\n3. SSL 인증서",
    #     "text": (
    #         "음 배포 환경을 어떻게 할지 얘기해봐야 할 것 같아요. "
    #         "아 Docker Compose로 묶어서 배포하는 게 편할 것 같고 "
    #         "Nginx 리버스 프록시도 붙여야 할 것 같아요. 어 그니까 "
    #         "프론트 백엔드 AI 서버 MySQL 이렇게 네 개를 한 번에 올리는 거죠. "
    #         "음 Mac Mini 서버에 올릴 건데 포트포워딩 설정도 해야 하고. "
    #         "아 SSL 인증서는 Let's Encrypt 쓰면 될 것 같아요. 무료니까. "
    #         "그리고 뭐 GitHub Actions로 CI CD 붙이는 것도 나중에 고려해보자."
    #     ),
    # },
    # {
    #     "name": "AI 모델 회의",
    #     "goal": "LoRA 파인튜닝 계획 수립",
    #     "agenda": "1. 베이스 모델 선정\n2. 데이터셋 포맷\n3. 학습 일정",
    #     "text": (
    #         "아 그래서 AI 서버에 어떤 모델을 쓸지 결정해야 하는데 "
    #         "음 Qwen2.5가 좋다고 하더라고요. 어 한국어 성능이 좋고 "
    #         "그니까 LoRA 파인튜닝 계획도 있으니까 Qwen으로 가는게 맞을 것 같아요. "
    #         "아 근데 EXAONE도 괜찮다고 하던데 그건 나중에 비교해보죠 뭐. "
    #         "일단 Qwen2.5-14B로 시작하고 Ollama로 서빙하는 방향으로. "
    #         "데이터셋은 아 instruction output 형식으로 만들어야 하고 "
    #         "PEFT 라이브러리 써서 학습하는 거로. 이번 주 안에 데이터 50개 목표."
    #     ),
    # },
    # ── 추가 더미 케이스 ─────────────────────────────
    {
        "name": "프론트엔드 UI/UX 리뷰 회의",
        "goal": "대시보드 및 회의실 화면 UI 개선 방향 확정",
        "agenda": "1. 대시보드 레이아웃 검토\n2. 회의실 화면 UX 이슈\n3. 디자인 시스템 통일",
        "text": (
            "[박서연] 아 그니까 대시보드 화면이 지금 좀 뭔가 어수선한 것 같아서요. "
            "음 사이드바 너비가 좀 좁은 것 같기도 하고 아니 그게 아니라 "
            "넓은 건데 텍스트가 잘리는 거잖아요. 그 부분 수정해야 할 것 같아요.\n"
            "[김민준] 아 맞아요 저도 그거 봤는데 어 폰트 사이즈 문제인가 싶기도 했거든요. "
            "잠깐 그 Pretendard 폰트 적용이 제대로 안 된 건 아닌가요?\n"
            "[박서연] 음 그거는 아닌 것 같고 그니까 white-space nowrap 처리가 "
            "빠진 것 같아요. 근데 그것보다 더 급한 게 회의실 화면인데. "
            "아 STT 자막이 화면 아래에 쌓이는 방식인데 그게 좀 뭐 읽기 불편하다는 "
            "피드백이 있었어요. 어 자동 스크롤이 안 된다는 거죠.\n"
            "[이준혁] 아 그건 제가 useEffect로 ref 붙이면 금방 되는데 "
            "음 그보다 WebRTC 비디오 레이아웃이 더 문제 같아요. "
            "참여자가 셋 이상일 때 그리드가 깨지거든요. 잠깐 혹시 CSS Grid 쓴 거 아니죠?\n"
            "[김민준] 맞아요 맞아요 flex로 했거든요. 그니까 그게 문제인 거지. "
            "아 Grid로 바꾸면서 반응형도 같이 잡아야 할 것 같아요. "
            "뭐 그리고 다크모드 회의실이랑 라이트모드 대시보드 사이 전환할 때 "
            "배경 깜빡임 현상도 있었어요 그거 어 next-themes 설정 문제인 것 같고.\n"
            "[박서연] 음 오늘 나온 이슈 정리해볼게요. 사이드바 텍스트 잘림, "
            "STT 자동 스크롤, 비디오 그리드 레이아웃, 다크모드 깜빡임. "
            "아 그 디자인 시스템 컬러 토큰도 Tailwind config에 다 등록돼 있나요? "
            "그니까 하드코딩된 hex 값들 있으면 이번 기회에 다 정리하자고요."
        ),
    },
    {
        "name": "보안·인증 아키텍처 회의",
        "goal": "JWT 인증 플로우 및 권한 관리 설계 확정",
        "agenda": "1. Access/Refresh Token 전략\n2. 권한 롤 설계\n3. 소셜 로그인 연동",
        "text": (
            "[최재원] 자 그니까 인증 쪽을 어떻게 할지 얘기해야 하는데 "
            "음 JWT 쓰는 건 확정이고 문제는 어 토큰 만료 정책을 어떻게 잡느냐죠. "
            "아 Access Token은 15분 Refresh Token은 7일로 하는 게 일반적인데.\n"
            "[한지수] 잠깐 그 7일이 너무 길지 않나요? 어 보안 측면에서는 "
            "짧을수록 좋은데 음 사용자 입장에선 매번 로그인하는 게 불편하잖아요.\n"
            "[최재원] 아 맞아요 그래서 Refresh Token Rotation을 쓰면 되는데 "
            "그니까 Refresh 할 때마다 새 Refresh Token 발급하는 방식이에요. "
            "음 이렇게 하면 탈취돼도 한 번 쓰면 무효화되니까 좀 안전하죠.\n"
            "[이준혁] 아 근데 그거 Redis 없이 할 수 있어요? "
            "뭐 토큰 블랙리스트 관리가 필요한 거 아닌가요?\n"
            "[최재원] 어 DB에 저장하는 방법도 있는데 음 Redis가 있으면 당연히 더 좋죠. "
            "지금 인프라에 Redis 추가하는 거 가능한가요?\n"
            "[한지수] 아 Docker Compose에 Redis 컨테이너 하나 추가하면 되니까 "
            "그건 어렵지 않을 것 같아요. 그것보다 권한 관리가 더 복잡한 것 같은데 "
            "음 회의 방장이랑 일반 참여자 권한이 달라야 하잖아요.\n"
            "[최재원] 맞아요 그니까 ROLE_OWNER, ROLE_MEMBER 이렇게 두 개로 나누면 될 것 같고 "
            "아 나중에 엔터프라이즈 플랜 같은 거 생기면 ROLE_ADMIN도 추가하는 거로. "
            "일단은 두 개만 가져가고. 소셜 로그인은 어 Google OAuth2만 우선 하는 걸로.\n"
            "[한지수] 아 그 Spring Security OAuth2 쓰면 되겠네요. "
            "근데 프론트에서 토큰 저장 위치도 얘기해야 할 것 같아요. "
            "그니까 localStorage는 XSS 취약하고 Cookie는 CSRF 취약하고. "
            "음 httpOnly Cookie에 Refresh Token만 저장하고 "
            "Access Token은 메모리에 두는 방식이 제일 안전할 것 같아요.\n"
            "[최재원] 그래요 그걸로 가죠. 정리하면 httpOnly Cookie + 메모리 저장, "
            "Refresh Token Rotation, Redis 블랙리스트, 롤은 OWNER/MEMBER 두 개."
        ),
    },
    {
        "name": "데이터베이스 설계 회의",
        "goal": "ERD 최종 검토 및 인덱스 전략 수립",
        "agenda": "1. 주요 테이블 관계 검토\n2. 인덱스 설계\n3. 소프트 딜리트 전략",
        "text": (
            "[김민준] 아 ERD 공유해놨는데 다들 보셨죠? 음 일단 크게 "
            "User, Meeting, Participant, MeetingMinutes, Todo 이렇게 다섯 개 테이블인데.\n"
            "[박서연] 어 잠깐 Participant 테이블이 따로 있어요? "
            "그니까 Meeting에 참여자 정보를 그냥 JSON으로 박아도 되지 않나요?\n"
            "[김민준] 아 아니 그러면 안 되죠. 음 참여자별로 권한이 다르고 "
            "나중에 참여 이력 조회할 때도 필요하고 그니까 별도 테이블이 맞아요. "
            "다대다 관계인데 Participant가 중간 테이블 역할 하는 거고.\n"
            "[이준혁] 아 맞다 맞다. 근데 Meeting 테이블에 status 컬럼이 "
            "뭐 SCHEDULED, IN_PROGRESS, DONE, CANCELLED 이렇게 네 개인데 "
            "음 CANCELLED는 진짜 쓸 일 있나요?\n"
            "[김민준] 어 그게 아 소프트 딜리트 때문에요. 하드 딜리트 쓰면 "
            "데이터 복구가 안 되니까 음 그냥 상태로 관리하는 게 나을 것 같아서요. "
            "아 근데 그러면 is_deleted 컬럼이랑 중복이 될 수도 있겠네요.\n"
            "[박서연] 그니까 방향을 정해야 하는데 어 status로 전부 관리하는 방식이랑 "
            "is_deleted 따로 두는 방식이랑 하나만 선택하는 게 좋을 것 같아요.\n"
            "[김민준] 음 status 하나로 통일하죠. CANCELLED가 곧 삭제 상태인 거로. "
            "그리고 인덱스 얘기 해야 하는데 아 Meeting에서 created_at 기준 정렬이 많이 쓰이고 "
            "user_id로 필터링도 많이 하니까 복합 인덱스 user_id, created_at 조합으로.\n"
            "[이준혁] 아 그리고 Todo 테이블에 assignee_id도 인덱스 걸어야 할 것 같아요. "
            "어 담당자 기준으로 할 일 목록 조회하는 쿼리가 많을 테니까. "
            "잠깐 그 Todo에 due_date 컬럼도 있어야 하지 않나요?\n"
            "[김민준] 아 맞아요 그거 빠뜨렸네. 추가하죠. "
            "그리고 MeetingMinutes는 Meeting이랑 일대일인데 "
            "음 그냥 Meeting 테이블에 합치는 게 낫지 않을까요 뭐 조인 줄이는 측면에서.\n"
            "[박서연] 어 근데 Minutes 데이터가 크거든요 JSON으로 들어오는 AI 결과가. "
            "그니까 분리해두는 게 Meeting 목록 조회할 때 성능이 더 나을 것 같아요."
        ),
    },
    {
        "name": "성능 최적화 및 모니터링 회의",
        "goal": "STT 처리 속도 개선 및 서버 모니터링 체계 수립",
        "agenda": "1. Whisper 처리 지연 원인 분석\n2. 비동기 처리 전환\n3. 모니터링 도구 선정",
        "text": (
            "[이준혁] 자 음 오늘 성능 얘기 해야 하는데 일단 STT가 너무 느려요. "
            "어 지금 30초짜리 음성 파일 하나 처리하는 데 뭐 한 40초 걸리거든요.\n"
            "[최재원] 아 그게 Whisper medium 모델 쓰기 때문 아닌가요? "
            "음 small로 바꾸면 빠르긴 한데 정확도가 좀 떨어지고.\n"
            "[이준혁] 그니까 그게 트레이드오프인데 어 근본적인 문제는 "
            "동기 방식으로 처리하고 있어서 하나 끝나야 다음 거 시작하는 거잖아요. "
            "아 비동기 큐 방식으로 바꿔야 해요. 음 Celery 같은 거 쓰거나 "
            "아니면 FastAPI background tasks 활용하거나.\n"
            "[한지수] 잠깐 Celery면 또 Redis나 RabbitMQ 브로커가 필요한 거 아닌가요? "
            "어 그거 추가하면 인프라가 좀 복잡해지는데.\n"
            "[이준혁] 아 맞아요. 그니까 일단은 FastAPI의 BackgroundTasks로 먼저 해보고 "
            "음 나중에 트래픽 많아지면 Celery로 전환하는 게 현실적일 것 같아요. "
            "근데 BackgroundTasks는 서버 재시작하면 큐가 날아가는 문제가 있어서 "
            "뭐 그 점은 감안해야 하고.\n"
            "[최재원] 아 그리고 GPU 없이 CPU로 돌리고 있어서 느린 것도 있거든요. "
            "어 Mac Mini에 GPU가 없으니까. 음 compute_type을 int8로 낮추면 "
            "CPU에서 좀 더 빠르게 돌아가던데 그 설정 바꿔봤어요?\n"
            "[이준혁] 아 그거 깜빡했네요. 지금은 float16으로 되어 있는데 "
            "int8로 바꾸면 아 얼마나 빨라지는지 벤치마크 해봐야겠다. "
            "그니까 오늘 할 일 정리하면 int8 벤치마크, BackgroundTasks 전환, "
            "그리고 모니터링 얘기도 해야 하는데 어 지금 로그가 print 문으로만 되어 있잖아요.\n"
            "[한지수] 음 그거 Prometheus랑 Grafana 조합이 제일 좋긴 한데 "
            "아 설정이 좀 번거롭죠. 그니까 일단은 structlog로 구조화 로깅만 붙이고 "
            "어 Sentry는 에러 추적용으로 무료 플랜 쓰는 것도 괜찮을 것 같아요.\n"
            "[최재원] 아 Sentry 좋죠. 그거 Next.js랑 Spring Boot 둘 다 SDK 있으니까 "
            "음 프론트 백 동시에 달 수 있고. 그걸로 가죠."
        ),
    },
    {
        "name": "제품 로드맵 기획 회의",
        "goal": "v1.0 출시 범위 확정 및 v2.0 기능 후보 논의",
        "agenda": "1. v1.0 MVP 기능 목록 확정\n2. 출시 일정\n3. v2.0 후보 기능 브레인스토밍",
        "text": (
            "[정다은] 아 오늘은 로드맵 얘기 해봐야 할 것 같아서요. "
            "어 v1.0에 뭘 넣을지 명확하게 정하지 않으면 계속 기능이 늘어나잖아요.\n"
            "[김민준] 맞아요 맞아요. 음 지금 생각하는 MVP는 어 로그인, 회의 생성, "
            "WebRTC 화상 회의, STT 자막, 회의록 자동 생성 이 정도인 것 같은데.\n"
            "[정다은] 아 그 범위면 충분할 것 같아요. 근데 잠깐 할 일 관리 기능은요? "
            "어 AI가 뽑아준 액션 아이템을 Todo로 저장하고 완료 처리하는 거.\n"
            "[박서연] 음 그거는 있어야 할 것 같아요. 그게 없으면 "
            "회의록 생성하는 의미가 좀 반감되는 느낌이라서. 아 간단한 거니까 넣죠.\n"
            "[김민준] 아 그러면 로그인, 회의 CRUD, WebRTC, STT, AI 회의록, Todo 관리. "
            "그니까 이게 v1.0 범위고. 아 그 이메일 초대 기능은요? "
            "어 지금 회의 참여를 링크 공유로만 하는데 이메일로 초대하는 것도.\n"
            "[정다은] 음 그건 v1.0에 없어도 될 것 같아요. 링크 공유면 충분하고 "
            "아 복잡도만 높아지니까 나중에 하죠. 일정은 어떻게 생각하세요?\n"
            "[이준혁] 어 지금 기준으로 음 핵심 기능들이 한 60퍼센트 정도 된 것 같고 "
            "아 2주면 v1.0 나올 수 있을 것 같아요. 근데 QA 기간 포함하면 3주?\n"
            "[정다은] 그니까 3주 목표로 잡고 마지막 주에 QA랑 버그 수정하는 거로. "
            "아 그리고 v2.0 후보도 오늘 미리 얘기해두면 좋을 것 같아서. "
            "뭐 일단 생각나는 거 다 말해보면 어 캘린더 연동, 슬랙 연동, "
            "화자 분리 STT, 다국어 지원, 요금제 시스템 이런 게 있는데.\n"
            "[박서연] 아 화자 분리가 제일 임팩트 클 것 같아요. "
            "어 지금은 STT가 누가 말했는지 구분을 못 하잖아요. "
            "그게 되면 회의록 퀄리티가 확 올라갈 것 같고.\n"
            "[김민준] 맞아요 근데 그게 기술적으로 음 pyannote.audio 같은 라이브러리 써야 하고 "
            "아 모델 크기도 크고 처리 시간도 더 걸리고. 그니까 v2.0 때 제대로 하죠. "
            "일단 오늘 결론은 v1.0 범위 확정, 3주 출시 목표, v2.0 1순위 후보는 화자 분리."
        ),
    },
]


async def test_analyze(client: httpx.AsyncClient, case: dict):
    """POST /analyze 테스트"""
    print(f"\n{'='*55}")
    print(f"테스트: {case['name']}")
    print(f"{'='*55}")
    print(f"[입력 STT]\n{case['text']}\n")

    resp = await client.post(
        f"{BASE_URL}/analyze",
        json={
            "text": case["text"],
            "goal": case["goal"],
            "agenda": case["agenda"],
        },
        timeout=120.0,
    )

    if resp.status_code != 200:
        print(f"오류: {resp.status_code} {resp.text}")
        return

    result = resp.json()
    print("[회의록 결과]")
    print(f"요약: {result['summary']}")
    print(f"결정사항: {result['decisions']}")
    print(f"할 일: {result['todos']}")
    print(f"미결 질문: {result['questions']}")
    print(f"다음 안건: {result['next_agenda']}")

    # 결과 저장
    filename = case['name'].replace('/', '_').replace(' ', '_')
    with open(f"test_results/test_result_{filename}.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"결과 저장: test_results/test_result_{filename}.json")


async def main():
    async with httpx.AsyncClient() as client:

        # 1. 더미 STT로 analyze 테스트
        print("\n3. /analyze 테스트 (더미 STT 텍스트)")
        for case in DUMMY_STT_TEXTS:
            await test_analyze(client, case)


if __name__ == "__main__":
    asyncio.run(main())