'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ── 실제 demo_meeting.txt 전체 파싱 (98개 발화) ─────────────── */
const DEMO_SEGMENTS = [
  { id: "1", speaker: "김민준", start: 0, end: 59, content: "네, 그럼 오늘 회의 시작하겠습니다. 어 오늘 참석자는 저 김민준이랑 이서연씨, 박지훈씨, 최수진씨, 정우성씨까지 다섯 명이고요. 오늘 아젠다는 먼저 스프린트 25 리뷰 하고, 그 다음에 API v2 설계 얘기 하고, PR 리뷰 프로세스 개선 얘기 하고, 결제 버그 처리 방안, DB 성능 이슈, 마지막으로 베타 출시 일정 확정하는 걸로 진행하겠습니다. 우선 스프린트 25 리뷰부터 하죠. 이서연씨 프론트 먼저 해줄 수 있어요?" },
  { id: "2", speaker: "이서연", start: 60, end: 97, content: "네, 저는 이번 스프린트에서 작업 템플릿 UI는 완료했어요. 그니까 사용자가 반복 작업을 템플릿으로 저장하고 불러오는 기능인데요, 어 드래그앤드롭도 잘 붙었고 모바일 반응형도 적용했어요. 근데 팀 초대 플로우 쪽은 음 이메일 발송 연동 부분에서 막혀서 완성을 못 했어요." },
  { id: "3", speaker: "김민준", start: 98, end: 101, content: "아 팀 초대가 왜 막혔어요?" },
  { id: "4", speaker: "이서연", start: 102, end: 138, content: "그니까 박지훈씨가 화요일에 이메일 서비스 API 올렸는데요, 어 스테이징 환경이랑 로컬 환경이 SMTP 설정이 달라서 저는 계속 401이 뜨더라고요. 그래서 환경변수 확인하다가 시간이 다 갔어요. 어 초대 플로우 자체 UI는 다 됐고 API 연동만 남았어요." },
  { id: "5", speaker: "박지훈", start: 139, end: 163, content: "아 그거 제가 .env.example 업데이트를 깜빡했네요. 죄송해요. 오늘 오전에 올려드릴게요. MAILGUN_API_KEY랑 MAILGUN_DOMAIN 두 개 추가하면 돼요." },
  { id: "6", speaker: "이서연", start: 164, end: 171, content: "아 네 그러면 오늘 오후에 합칠 수 있을 것 같아요." },
  { id: "7", speaker: "김민준", start: 172, end: 182, content: "알겠어요. 그럼 팀 초대는 오늘 안에 완료 목표로 하죠. 박지훈씨 백엔드는요?" },
  { id: "8", speaker: "박지훈", start: 183, end: 236, content: "저는 어 작업 템플릿 API랑 팀 초대 API 둘 다 완료했고요, 음 추가로 검색 성능 개선 작업도 좀 했는데 이건 스프린트 외 작업이에요. 그니까 작업 검색할 때 풀텍스트 서치 인덱스 적용했거든요. LIKE 쿼리 쓰다가 FTS로 바꿨는데 체감 속도가 꽤 빨라졌어요. 아 그리고 팀 초대 API에 rate limiting도 추가했어요. 같은 이메일로 하루 5회 이상 초대 못 하게요." },
  { id: "9", speaker: "최수진", start: 237, end: 281, content: "저는 이번 스프린트 QA 항목이 총 16개였는데요, 14개 완료했어요. 남은 두 개 중 하나는 팀 초대 플로우 연동 완료되면 바로 할 수 있고요, 나머지 하나가 좀 중요한 이슈예요. 어 결제 모듈 쪽에서 버그를 발견했어요. 연간 구독을 중간에 해지하거나 다운그레이드할 때 환불 금액이 잘못 계산되는 케이스가 있어요." },
  { id: "10", speaker: "김민준", start: 282, end: 291, content: "아 그건 빨리 잡아야겠네요. 나중에 자세히 얘기하죠. 정우성씨는요?" },
  { id: "11", speaker: "정우성", start: 292, end: 341, content: "저는 배포 파이프라인 개선이랑 모니터링 대시보드 셋업 완료했어요. 그라파나에 주요 지표 다 올려놨고요, 특히 API 응답시간이랑 에러율은 실시간으로 보이게 했어요. 그리고 CD 파이프라인에 롤링 업데이트 적용해서 이제 배포할 때 다운타임이 없어요. 어 또 Slack 배포 알림도 달았어요. 배포 시작, 완료, 실패 세 가지 상태를 채널에 자동으로 올려줘요." },
  { id: "12", speaker: "김민준", start: 342, end: 393, content: "오 좋네요. 롤링 업데이트에 슬랙 알림까지. 수고하셨어요. 그럼 스프린트 25는 어 작업 템플릿 완료, 팀 초대 90%, 인프라 개선 완료, 결제 버그 발견 이렇게 정리됩니다. 자 그럼 다음 안건으로 API v2 설계 논의 들어가겠습니다. 박지훈씨가 지난주에 설계 문서 슬랙에 올려줬는데 다들 보셨죠? 오늘 주요 변경사항 확정하는 게 목표예요." },
  { id: "13", speaker: "박지훈", start: 394, end: 429, content: "네, 어 제가 설계 문서에서 크게 세 가지 변경사항을 제안했는데요. 첫 번째가 대시보드 데이터 조회를 GraphQL로 전환하는 거고요, 두 번째가 인증 방식을 httpOnly 쿠키로 바꾸는 거고, 세 번째가 페이지네이션을 커서 기반으로 바꾸는 거예요." },
  { id: "14", speaker: "이서연", start: 430, end: 449, content: "어 GraphQL 전환이 제일 궁금했는데요. 프론트 입장에서는 기존 REST로도 잘 돌아가고 있거든요. 왜 GraphQL이 필요한 건가요?" },
  { id: "15", speaker: "박지훈", start: 450, end: 498, content: "그니까 완전히 다 바꾸는 건 아니고요, 대시보드 조회 부분만이에요. 지금 대시보드 한 페이지 로드할 때 API를 네다섯 번 호출하잖아요? 프로젝트 목록 가져오고, 각 프로젝트별 작업 수 가져오고, 최근 활동 가져오고, 팀 멤버 가져오고. 이게 전부 워터폴로 쌓여서 첫 로딩이 느려지는 거거든요. 크롬 네트워크 탭 보면 600ms 넘는 경우도 있어요." },
  { id: "16", speaker: "이서연", start: 499, end: 515, content: "아 그 초기 로딩 느린 거요? 저도 그거 항상 불편했는데. GraphQL로 하면 한 번에 다 가져올 수 있는 거죠?" },
  { id: "17", speaker: "박지훈", start: 516, end: 538, content: "정확히요. 그리고 프론트 입장에서도 GraphQL Codegen 쓰면 타입스크립트 타입이랑 React Query 훅이 자동으로 생성돼서 오히려 반복 코드가 줄어요." },
  { id: "18", speaker: "이서연", start: 539, end: 551, content: "아 코드젠이요? 그거 좋네요. 그러면 REST랑 GraphQL이 같이 존재하는 건가요?" },
  { id: "19", speaker: "박지훈", start: 552, end: 581, content: "네, 하이브리드로 가는 거예요. 기존 REST 엔드포인트는 그대로 두고요, 복잡한 조회가 필요한 부분에만 GraphQL 레이어 추가하는 거예요. Apollo Server를 백엔드에 붙이는 방향으로 보고 있어요." },
  { id: "20", speaker: "최수진", start: 582, end: 598, content: "그러면 테스트 입장에서는 REST랑 GraphQL 두 가지를 다 커버해야 하는 거잖아요. 부담이 좀 있을 것 같은데요." },
  { id: "21", speaker: "박지훈", start: 599, end: 644, content: "음 그 부분이 트레이드오프인데요, GraphQL은 스키마가 명확하게 정의되어 있어서 인트로스펙션으로 자동으로 테스트 케이스를 뽑을 수가 있거든요. 그리고 Apollo Studio에서 쿼리 테스트가 REST보다 훨씬 직관적이에요." },
  { id: "22", speaker: "정우성", start: 645, end: 664, content: "인프라 관점에서는 Apollo Server 추가되면 메모리 사용량이 좀 늘 수 있는데요, 지금 서버 스펙 여유가 있어서 괜찮을 것 같아요." },
  { id: "23", speaker: "김민준", start: 665, end: 677, content: "알겠어요. 대시보드는 GraphQL로 방향 잡겠습니다. 두 번째 인증 방식 얘기해줘요." },
  { id: "24", speaker: "박지훈", start: 678, end: 713, content: "지금 JWT를 로컬스토리지에 저장하고 있는데요, 이게 XSS 공격에 취약해요. v2에서는 httpOnly 쿠키로 바꾸려고 해요. 쿠키는 JavaScript에서 직접 접근이 안 되니까 훨씬 안전하고, CSRF 토큰도 같이 추가하면 CSRF도 막을 수 있어요." },
  { id: "25", speaker: "이서연", start: 714, end: 739, content: "쿠키로 바꾸면 CORS 설정 다시 해야 하지 않나요? withCredentials 옵션이랑 CORS 헤더가 맞아야 하잖아요. 그리고 로컬 개발 환경에서 CORS 이슈 많이 나오던데요." },
  { id: "26", speaker: "박지훈", start: 740, end: 765, content: "맞아요, CORS는 다시 설정해야 하고요. 나중에 모바일 앱 나올 때를 대비해서 토큰 방식도 병행해야 할 것 같아요. 웹은 쿠키, 모바일은 Authorization 헤더 방식으로요." },
  { id: "27", speaker: "정우성", start: 766, end: 781, content: "인증 방식 바꾸면 Nginx 설정도 수정이 필요한데요, 그 부분은 박지훈씨랑 같이 보면서 작업하면 좋겠어요." },
  { id: "28", speaker: "박지훈", start: 782, end: 816, content: "네 그렇게 하죠. 마지막으로 페이지네이션인데요, 지금 오프셋 기반이라서 데이터가 많아지면 쿼리가 느려지거든요. OFFSET 값이 크면 MySQL이 앞에 건너뛸 행을 다 스캔해야 해서요. 커서 기반으로 바꾸면 인덱스 탐색으로 바로 접근이 가능해요." },
  { id: "29", speaker: "이서연", start: 817, end: 838, content: "커서 기반 페이지네이션은 무한 스크롤 구현하기가 더 쉬워지는 거 있어서요. 저는 찬성이에요. 프론트에서 페이지 번호 관리 안 해도 되니까 훨씬 깔끔해져요." },
  { id: "30", speaker: "김민준", start: 839, end: 877, content: "좋아요. 정리하겠습니다. 대시보드는 GraphQL 도입, 인증은 httpOnly 쿠키로 전환, 페이지네이션은 커서 기반으로. 일정은 전체 v2 완성에 5-6주 보고 있고, 베타는 v1 기반으로 가고 v2는 정식 릴리즈에 포함하기로 합니다. 다음은 PR 리뷰 프로세스 개선이에요." },
  { id: "31", speaker: "김민준", start: 878, end: 892, content: "이번에 스프린트 진행하면서 PR 리뷰가 좀 병목이 됐던 것 같아서요. 최수진씨가 슬랙에 언급하셨잖아요." },
  { id: "32", speaker: "최수진", start: 893, end: 926, content: "네 맞아요. 어 제가 보기엔 PR이 너무 커서 리뷰하기가 힘들어요. 지난주에 박지훈씨 PR이 어 900줄짜리가 하나 있었는데요, 거기에 집중해서 리뷰하기가 쉽지 않더라고요. 리뷰어 입장에서 뭘 봐야 할지 감이 안 오는 경우가 있어요." },
  { id: "33", speaker: "박지훈", start: 927, end: 953, content: "음 그거는 사실 저도 좀 문제라고 생각했는데요, 기능이 연결되어 있다 보니까 자연스럽게 커지는 경우가 있어요. 한 PR에 백엔드 도메인 로직이랑 API 레이어가 같이 들어가다 보니까요." },
  { id: "34", speaker: "이서연", start: 954, end: 970, content: "저는 프론트 쪽에서 UI 컴포넌트랑 API 연동이랑 상태 관리가 한 PR에 다 들어오면 뭘 먼저 봐야 할지 어렵더라고요." },
  { id: "35", speaker: "김민준", start: 971, end: 989, content: "음 그래서 PR 크기 제한을 도입하면 어떨까요? 변경 라인이 400줄 넘으면 분리하는 걸 가이드라인으로 하는 거예요." },
  { id: "36", speaker: "박지훈", start: 990, end: 1006, content: "어 400줄은 좀 빡빡한 것 같아요. 500줄 정도면 어떨까요? 리팩터링이나 테스트 파일 추가할 때는 예외로 두고요." },
  { id: "37", speaker: "최수진", start: 1007, end: 1033, content: "그리고 PR 크기 제한도 중요한데요, 리뷰 SLA도 있으면 좋겠어요. PR 올리면 영업일 기준 하루 안에는 최소 첫 리뷰를 달아주는 거요. 리뷰 안 달리면 슬랙에서 멘션하거나요." },
  { id: "38", speaker: "이서연", start: 1034, end: 1050, content: "맞아요. 저도 PR 올려놓고 사흘씩 기다린 경우가 있었는데요, 그 동안 다른 작업 하다가 컨텍스트가 사라지더라고요." },
  { id: "39", speaker: "정우성", start: 1051, end: 1083, content: "GitHub Actions에 리뷰 SLA 체크 자동화 달 수 있어요. PR 생성 후 24시간 지나면 슬랙에 자동 알림 보내는 거요. Danger.js 같은 도구 쓰면 PR 사이즈 체크랑 SLA 알림 둘 다 한번에 할 수 있어요." },
  { id: "40", speaker: "김민준", start: 1084, end: 1098, content: "오 그거 좋네요. 그럼 Danger.js 도입을 검토하는 걸로 하죠. 정우성씨가 리서치해줄 수 있어요?" },
  { id: "41", speaker: "정우성", start: 1099, end: 1112, content: "네, 이번 주 안에 Danger.js 셋업해볼게요. CI 파이프라인에 붙이는 건 어렵지 않아요." },
  { id: "42", speaker: "박지훈", start: 1113, end: 1139, content: "아 그리고 PR 템플릿도 개선하면 좋겠어요. 지금 PR 설명이 너무 비어있는 경우가 많거든요. 변경 이유, 테스트 방법, 스크린샷 이 세 가지는 필수로 채우게 하는 게 좋을 것 같아요." },
  { id: "43", speaker: "이서연", start: 1140, end: 1158, content: "동의해요. 저는 PR 설명 잘 쓰는 게 리뷰 속도를 확 높이는 것 같더라고요. 맥락이 있으면 리뷰어가 뭘 봐야 할지 바로 알잖아요." },
  { id: "44", speaker: "김민준", start: 1159, end: 1192, content: "알겠어요. 그럼 정리하면, PR 크기는 500줄 이하 권장 가이드라인, 리뷰 SLA는 영업일 1일 이내, Danger.js로 자동화, PR 템플릿 개선. 이거 다음 스프린트 초반에 적용하죠. 자 이제 결제 버그 처리 방안 얘기하겠습니다." },
  { id: "45", speaker: "최수진", start: 1193, end: 1234, content: "네, 시나리오가 두 가지예요. 첫 번째는 연간 구독을 연도 중간에 월 구독으로 다운그레이드할 때고요, 두 번째는 연간 구독을 아예 중간에 해지할 때예요. 두 경우 모두 환불 금액 계산이 잘못돼요. 테스트 케이스 여러 개 돌려봤는데요, 고객이 받아야 할 금액보다 대부분 적게 계산되더라고요." },
  { id: "46", speaker: "박지훈", start: 1235, end: 1275, content: "어 어제 코드 봤는데요, 문제가 결제일 기준으로 일할 계산을 해야 하는데 코드가 월 단위로만 계산하고 있어요. 예를 들어 1월 15일에 연간 구독 시작하고 7월 20일에 해지하면 정확히는 186일을 쓴 거잖아요. 근데 지금 코드는 6개월 기준으로 계산하거든요. 그 차이가 생기는 거예요." },
  { id: "47", speaker: "최수진", start: 1276, end: 1308, content: "맞아요. 그래서 일별로 계산하면 고객이 받아야 할 금액이랑 현재 계산되는 금액 사이에 차이가 꽤 나요. 연간 구독이 12만원이면 최대 1만원 정도 차이 날 수 있어요. 이건 고객 신뢰 문제로 이어질 수 있어요." },
  { id: "48", speaker: "이서연", start: 1309, end: 1316, content: "아 그러면 이미 잘못 환불된 케이스가 있을 수 있겠네요?" },
  { id: "49", speaker: "박지훈", start: 1317, end: 1332, content: "음 연간 구독 고객 수가 아직 적어서 실제 민원은 없었지만, 있을 수 있죠. 그래서 DB 점검도 같이 해야 해요." },
  { id: "50", speaker: "김민준", start: 1333, end: 1336, content: "수정 일정은요?" },
  { id: "51", speaker: "박지훈", start: 1337, end: 1373, content: "어 수정 자체는 어렵지 않아요. LocalDate 간 daysBetween 구하는 거라서 크게 복잡하지 않아요. 테스트 케이스만 촘촘히 짜면 되고요. 목요일까지 가능해요. DB 점검 쿼리도 같이 짤게요." },
  { id: "52", speaker: "최수진", start: 1374, end: 1397, content: "그럼 제가 금요일에 QA 돌릴게요. 결제 관련이라 엣지 케이스 많이 봐야 해서 하루는 잡아야 할 것 같아요. 일할 계산 경계값이랑 윤년 케이스도 확인해야 하거든요." },
  { id: "53", speaker: "정우성", start: 1398, end: 1421, content: "금요일에 QA 통과하면 그날 저녁에 핫픽스 배포할게요. 롤링 업데이트라 다운타임 없이 됩니다. 결제 대행사 추가 환불 API가 필요하면 미리 확인해둬야 할 것 같아요." },
  { id: "54", speaker: "박지훈", start: 1422, end: 1431, content: "맞아요. 포트원 쪽에서 부분 환불 API 이번 주 중으로 확인할게요." },
  { id: "55", speaker: "김민준", start: 1432, end: 1467, content: "좋아요. 그럼 박지훈씨 목요일까지 버그 수정 및 DB 점검 쿼리 작성, 최수진씨 금요일 QA, 정우성씨 금요일 저녁 핫픽스 배포, 결제 대행사 추가 환불 처리 방법은 박지훈씨가 이번 주 중으로 확인해줘요. 다음 안건으로 가겠습니다. DB 성능 최적화예요." },
  { id: "56", speaker: "박지훈", start: 1468, end: 1494, content: "네, 최근 들어서 작업 조회 API 응답이 좀 느려졌거든요. 그라파나에서 p95 응답시간이 1.2초까지 올라가는 경우가 생겼어요. 사용자 수가 늘면서 데이터가 쌓이니까 느려지는 거예요." },
  { id: "57", speaker: "정우성", start: 1495, end: 1515, content: "맞아요, 저도 모니터링에서 봤어요. 특히 프로젝트 내 작업 목록 조회 엔드포인트가 문제인 것 같더라고요. p50은 괜찮은데 p95가 튀는 패턴이에요." },
  { id: "58", speaker: "박지훈", start: 1516, end: 1549, content: "쿼리 분석해봤더니 N+1 문제가 있었어요. 작업 목록 가져올 때 각 작업마다 담당자 정보를 별도 쿼리로 가져오고 있었거든요. 작업이 50개면 쿼리가 51번 나가는 거예요. JPA에서 Lazy Loading 쓰다 보니까 생긴 문제예요." },
  { id: "59", speaker: "이서연", start: 1550, end: 1559, content: "아 그래서 그렇게 느렸구나. Fetch Join으로 해결하는 건가요?" },
  { id: "60", speaker: "박지훈", start: 1560, end: 1609, content: "네, Fetch Join으로 한 번에 가져오도록 바꿨고요, 추가로 자주 조회되는 project_id 컬럼이랑 status 컬럼에 인덱스도 추가했어요. 로컬 테스트에서는 870ms에서 140ms로 확 줄었어요. 6배 넘게 빨라진 거예요." },
  { id: "61", speaker: "정우성", start: 1610, end: 1619, content: "오 그거 꽤 큰 차이네요. 오늘 오후에 스테이징 배포해볼 수 있어요?" },
  { id: "62", speaker: "박지훈", start: 1620, end: 1627, content: "네 오늘 오후에 정우성씨랑 같이 스테이징 배포하죠." },
  { id: "63", speaker: "최수진", start: 1628, end: 1641, content: "인덱스 추가할 때 운영 DB에 락 걸리지 않나요? 사용 중에 테이블이 잠기면 문제가 크잖아요." },
  { id: "64", speaker: "박지훈", start: 1642, end: 1664, content: "MySQL 8에서 Instant DDL을 지원해서요, 인덱스 추가할 때 테이블 락 없이 바로 적용이 가능해요. 지금 테이블 데이터 규모에서는 문제없을 거예요." },
  { id: "65", speaker: "정우성", start: 1665, end: 1677, content: "그럼 배포할 때 특별한 조치 없이 Flyway 마이그레이션 스크립트로 포함하면 되겠네요." },
  { id: "66", speaker: "박지훈", start: 1678, end: 1714, content: "네 그렇게 하면 돼요. 추가로 Redis 캐싱도 고려하고 있는데요, 자주 바뀌지 않는 프로젝트 메타 정보나 사용자 권한 같은 건 캐싱하면 DB 부하가 더 줄어들 것 같아요. TTL 5분 정도로 설정하면 실시간성은 유지하면서 DB 요청 수를 확 줄일 수 있거든요." },
  { id: "67", speaker: "김민준", start: 1715, end: 1721, content: "Redis 추가하면 인프라가 복잡해지지 않나요?" },
  { id: "68", speaker: "정우성", start: 1722, end: 1753, content: "Redis는 나중에 세션 관리랑 실시간 알림할 때도 쓸 거라서요, 지금 추가해도 무리가 없어요. Docker Compose에 서비스 하나 추가하는 수준이고요. AWS ElastiCache 연결하면 운영에서도 관리가 편해요." },
  { id: "69", speaker: "김민준", start: 1754, end: 1787, content: "알겠어요. 그럼 Fetch Join이랑 인덱스는 오늘 스테이징 배포해서 수치 확인하고요, 수치 확인되면 다음 배포 때 운영 반영하죠. Redis 캐싱은 다음 스프린트에 별도 태스크로 잡겠습니다. 마지막 안건, 베타 출시 일정 확정입니다." },
  { id: "70", speaker: "김민준", start: 1788, end: 1813, content: "지금까지 나온 이야기 정리해보면요, 이번 주 안에 팀 초대 플로우 연동 완료, 결제 버그 핫픽스, DB 최적화 스테이징 검증이 완료돼야 하고요. 베타 전에 추가로 손볼 게 있어요?" },
  { id: "71", speaker: "이서연", start: 1814, end: 1844, content: "온보딩 플로우가 좀 복잡하다는 피드백이 있었잖아요. 지난번 사용자 테스트에서요. 지금 프로젝트 생성 온보딩이 6단계인데요, 사용자 테스트 때 세 명이 3단계에서 멈추더라고요. 그 부분이 베타 전에 개선되면 좋겠어요." },
  { id: "72", speaker: "김민준", start: 1845, end: 1849, content: "어느 정도 수정이 필요한 건가요?" },
  { id: "73", speaker: "이서연", start: 1850, end: 1884, content: "크게 바꾸는 건 아니고요, 6단계를 3단계로 줄이는 거예요. 나머지 세 단계는 나중에 설정에서 할 수 있도록 스킵 가능하게 하면 돼요. 하루 이틀이면 될 것 같아요." },
  { id: "74", speaker: "최수진", start: 1885, end: 1913, content: "온보딩 단계 줄이는 거 QA에서도 반겼어요. 신규 사용자 시나리오 테스트할 때 중간에 포기할 것 같다는 느낌이 들었거든요. 베타 사용자들한테 첫 인상이 중요하니까 온보딩 개선은 꼭 들어가야 한다고 봐요." },
  { id: "75", speaker: "박지훈", start: 1914, end: 1944, content: "온보딩에서 스킵하면 나중에 설정 화면에서 채울 수 있게 백엔드 쪽도 확인이 필요한데요, 지금 필수 입력 검증이 어디서 일어나는지 확인해볼게요. 서버 사이드 validation이 강하게 걸려 있으면 같이 풀어야 해요." },
  { id: "76", speaker: "이서연", start: 1945, end: 1950, content: "아 그 부분 같이 보면서 하면 좋겠어요." },
  { id: "77", speaker: "김민준", start: 1951, end: 1971, content: "그렇게 해줘요. 그럼 베타 전 개발 작업을 정리하면, 팀 초대 연동 완료, 결제 버그 수정, DB 최적화 반영, 온보딩 개선 이렇게 네 가지네요." },
  { id: "78", speaker: "정우성", start: 1972, end: 2017, content: "저는 인프라 쪽으로 베타 오픈 전에 SSL 인증서 갱신 확인하고요, 오토스케일링 설정 점검, 에러 알림 슬랙 채널 연결, 그리고 DB 백업 정책도 한번 확인해야 할 것 같아요. 베타 때 데이터 손실 나면 안 되니까요. 그리고 부하 테스트도 한번 돌려야 할 것 같아요. 베타 오픈하면 트래픽이 갑자기 올라올 수 있으니까요." },
  { id: "79", speaker: "최수진", start: 2018, end: 2045, content: "그럼 제가 보기엔 이번 주 금요일까지 개발 작업이 완료되면요, 다음 주 월요일부터 수요일까지 전체 QA 한 번 돌리고, 목요일에 베타 오픈하는 게 어떨까요? QA 체크리스트는 제가 미리 정리해둘게요." },
  { id: "80", speaker: "김민준", start: 2046, end: 2053, content: "현실적인 일정 같아요. 각자 이 일정 맞출 수 있어요?" },
  { id: "81", speaker: "이서연", start: 2054, end: 2063, content: "저 괜찮아요. 온보딩이랑 팀 초대 연동 수요일까지 끝낼 수 있어요." },
  { id: "82", speaker: "박지훈", start: 2064, end: 2077, content: "네, 결제 버그 목요일, 나머지는 그 전에 맞출게요. 스테이징 DB 최적화 배포는 오늘 오후에요." },
  { id: "83", speaker: "최수진", start: 2078, end: 2088, content: "네, QA 체크리스트는 이번 주 안에 공유하고 다음 주 QA 진행할게요." },
  { id: "84", speaker: "정우성", start: 2089, end: 2102, content: "인프라는 이번 주 내로 다 준비해놓을게요. 스테이징 배포도 오늘 오후에 박지훈씨랑 같이 할게요." },
  { id: "85", speaker: "김민준", start: 2103, end: 2120, content: "좋습니다. 그럼 베타 출시 일정을 다음 주 목요일로 확정하겠습니다. 그럼 스프린트 26 플래닝도 간단하게 하고 마무리하죠." },
  { id: "86", speaker: "김민준", start: 2121, end: 2147, content: "이번 주에 핫픽스랑 베타 준비가 메인이니까 스프린트 26 포인트는 좀 줄여서 잡는 게 맞을 것 같아요. 지난 스프린트가 28포인트 완료였으니까 이번엔 25포인트 정도로 잡으면 어떨까요?" },
  { id: "87", speaker: "이서연", start: 2148, end: 2161, content: "저 괜찮아요. 근데 스프린트 26에 꼭 들어가야 하는 게 뭔지 먼저 정리해야 할 것 같아요." },
  { id: "88", speaker: "박지훈", start: 2162, end: 2189, content: "당연히 베타 이후에 들어올 피드백 대응 버퍼는 남겨둬야 하고요, 그 다음으로 API v2 작업 시작해야 하지 않을까요? GraphQL 설계 문서 구체화하는 걸 스프린트 26에 넣으면 좋겠어요." },
  { id: "89", speaker: "최수진", start: 2190, end: 2220, content: "저는 테스트 자동화 환경 구축을 스프린트 26에 넣고 싶어요. 지금 E2E 테스트가 전혀 없는데요, Playwright 도입해서 핵심 플로우만이라도 커버하면 베타 이후 회귀 버그를 잡는 데 큰 도움이 될 것 같아요." },
  { id: "90", speaker: "정우성", start: 2221, end: 2245, content: "맞아요. E2E 테스트 있으면 배포 후 자동으로 핵심 플로우 체크가 되니까 저한테도 편하죠. Playwright는 GitHub Actions에 붙이는 게 어렵지 않아요." },
  { id: "91", speaker: "이서연", start: 2246, end: 2269, content: "Playwright 도입하면 제가 초기 설정이랑 로그인, 프로젝트 생성, 작업 추가 이 세 개 핵심 시나리오 작성할 수 있어요. 그 정도면 큰 회귀 버그는 잡히거든요." },
  { id: "92", speaker: "김민준", start: 2270, end: 2305, content: "좋아요. 그럼 스프린트 26 주요 백로그는요, GraphQL 설계 문서 구체화, Playwright E2E 기본 셋업, Redis 캐싱 도입, Danger.js PR 자동화 설정 이렇게 네 가지로 잡겠습니다. 포인트는 나중에 각자 추정해서 슬랙에 올려줘요." },
  { id: "93", speaker: "박지훈", start: 2306, end: 2333, content: "네 알겠습니다. GraphQL 설계 문서는 제가 이번 주 안에 초안 올릴게요. Apollo Server 기본 스키마 구조 잡는 게 핵심이라서 설계 먼저 맞추고 시작하는 게 좋을 것 같아요." },
  { id: "94", speaker: "최수진", start: 2334, end: 2354, content: "저는 Playwright 셋업이랑 기본 시나리오 초안을 이서연씨랑 같이 하면 좋겠어요. QA 시나리오랑 E2E 시나리오가 겹치는 부분이 많거든요." },
  { id: "95", speaker: "이서연", start: 2355, end: 2359, content: "좋아요. 시간 맞춰서 같이 보죠." },
  { id: "96", speaker: "정우성", start: 2360, end: 2375, content: "Redis 캐싱은 제가 인프라 설정 먼저 해두고요, 박지훈씨가 애플리케이션 레이어 붙이는 거로 하면 어떨까요?" },
  { id: "97", speaker: "박지훈", start: 2376, end: 2395, content: "네 그렇게 하죠. Spring Data Redis 붙이는 건 그렇게 오래 안 걸려요. 설정파일이랑 캐시 어노테이션 추가하면 되거든요." },
  { id: "98", speaker: "김민준", start: 2396, end: 2492, content: "좋아요. 그럼 오늘 회의에서 결정된 사항 최종 정리할게요. API v2는 베타 이후 정식 릴리즈에 포함, 대시보드는 GraphQL로, 인증은 httpOnly 쿠키로, 페이지네이션은 커서 기반으로. PR 크기 500줄 이하 가이드라인 도입, 리뷰 SLA 영업일 1일, Danger.js 도입 검토, PR 템플릿 개선. 결제 버그는 목요일 수정 완료, 금요일 QA, 저녁 배포. DB 성능 개선은 오늘 스테이징 검증 후 다음 배포 때 운영 반영. Redis 캐싱은 스프린트 26. 온보딩 개선은 이번 주 완료. 베타 오픈은 다음 주 목요일. 스프린트 26 백로그는 GraphQL 설계 문서, Playwright 셋업, Redis 캐싱, Danger.js 자동화 네 가지. 다들 수고 많으셨습니다." },
];

const SPEAKER_COLORS: Record<string, { bg: string; text: string }> = {
  "김민준": { bg: "#eff6ff", text: "#2563eb" },
  "이서연": { bg: "#f0fdf4", text: "#16a34a" },
  "박지훈": { bg: "#fdf4ff", text: "#7c3aed" },
  "최수진": { bg: "#fffbeb", text: "#d97706" },
  "정우성": { bg: "#fef2f2", text: "#dc2626" },
};

function fmt(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

export default function DemoSttPage() {
  const router = useRouter();
  const [segments, setSegments] = useState(DEMO_SEGMENTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleEditStart = (seg: typeof segments[0]) => {
    setEditingId(seg.id);
    setEditContent(seg.content);
  };

  const handleEditSave = (seg: typeof segments[0]) => {
    const trimmed = editContent.trim();
    if (trimmed && trimmed !== seg.content) {
      setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, content: trimmed } : s));
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setSegments(prev => prev.filter(s => s.id !== id));
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => router.push("/meetings/demo-lora-stages"), 2800);
  };

  if (generating) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f9f8f6", gap: 28 }}>
        <div style={{ position: "relative", width: 72, height: 72 }}>
          <svg viewBox="0 0 72 72" fill="none" width="72" height="72" style={{ animation: "spin 1.2s linear infinite", position: "absolute", inset: 0 }}>
            <circle cx="36" cy="36" r="30" stroke="#e8e5de" strokeWidth="5"/>
            <circle cx="36" cy="36" r="30" stroke="#2563eb" strokeWidth="5" strokeDasharray="60 130" strokeLinecap="round"/>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" width="28" height="28">
              <path d="M12 3l1.5 4.5H18l-3.5 2.5 1.5 4.5L12 12l-4 2.5 1.5-4.5L6 7.5h4.5L12 3z" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: "#1a1916", marginBottom: 8 }}>회의록 생성 중입니다</div>
          <div style={{ fontSize: 13, color: "#a8a49e" }}>AI가 회의 내용을 분석하고 있습니다</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb", animation: `dotpulse 1.2s ease ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes dotpulse { 0%,100%{opacity:0.25;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9f8f6", display: "flex", flexDirection: "column" }}>
      {/* 헤더 */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e8e5de",
        padding: "0 32px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/meetings")}
            style={{ padding: "6px 14px", fontSize: 13, borderRadius: 7, border: "1px solid #e8e5de", background: "transparent", color: "#6b6760", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <svg viewBox="0 0 12 12" fill="none" width="11" height="11"><path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            목록으로
          </button>
          <div style={{ width: 1, height: 18, background: "#e8e5de" }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1916" }}>STT 검토</div>
            <div style={{ fontSize: 12, color: "#6b6760", marginTop: 1 }}>TaskFlow 스프린트 25 리뷰 & 26 플래닝</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#a8a49e" }}>총 {segments.length}개 발화 · 약 41분</div>
          <button
            onClick={handleGenerate}
            style={{ padding: "8px 20px", fontSize: 13.5, fontWeight: 600, borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}
          >
            <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M7 1l1.5 3.5H12l-3 2 1.5 3.5L7 8 3.5 10 5 6.5 2 4.5h3.5L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            회의록 생성
          </button>
        </div>
      </div>

      {/* 안내 */}
      <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "10px 32px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#92400e" }}>
        <svg viewBox="0 0 14 14" fill="none" width="14" height="14"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
        STT 오인식 또는 불필요한 발화를 수정·삭제한 후 <strong style={{ margin: "0 3px" }}>회의록 생성</strong>을 눌러주세요.
      </div>

      {/* 세그먼트 목록 */}
      <div style={{ flex: 1, padding: "24px 32px", maxWidth: 900, width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {segments.map(seg => {
            const color = SPEAKER_COLORS[seg.speaker] ?? { bg: "#f5f5f5", text: "#555" };
            const isEditing = editingId === seg.id;

            return (
              <div key={seg.id} style={{
                background: "#fff", border: `1px solid ${isEditing ? "#2563eb" : "#e8e5de"}`,
                borderRadius: 10, padding: "12px 14px",
                transition: "border-color 0.15s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ background: color.bg, color: color.text, borderRadius: 999, padding: "2px 9px", fontSize: 12, fontWeight: 600 }}>{seg.speaker}</div>
                  <span style={{ fontSize: 11, color: "#a8a49e", fontFamily: "monospace" }}>{fmt(seg.start)} — {fmt(seg.end)}</span>
                  <div style={{ flex: 1 }} />
                  {!isEditing && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => handleEditStart(seg)} style={{ padding: "2px 8px", fontSize: 11.5, borderRadius: 5, border: "1px solid #e8e5de", background: "transparent", color: "#6b6760", cursor: "pointer" }}>수정</button>
                      <button onClick={() => handleDelete(seg.id)} style={{ padding: "2px 8px", fontSize: 11.5, borderRadius: 5, border: "1px solid #fecaca", background: "transparent", color: "#ef4444", cursor: "pointer" }}>삭제</button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div>
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)} autoFocus style={{ width: "100%", minHeight: 68, padding: "8px 12px", fontSize: 13.5, lineHeight: 1.65, fontFamily: "inherit", border: "1px solid #2563eb", borderRadius: 7, outline: "none", resize: "vertical", boxSizing: "border-box", background: "#f8fbff" }} />
                    <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
                      <button onClick={() => setEditingId(null)} style={{ padding: "4px 12px", fontSize: 12.5, borderRadius: 6, border: "1px solid #e8e5de", background: "transparent", color: "#6b6760", cursor: "pointer" }}>취소</button>
                      <button onClick={() => handleEditSave(seg)} style={{ padding: "4px 14px", fontSize: 12.5, borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 500 }}>저장</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13.5, color: "#1a1916", lineHeight: 1.65 }}>{seg.content}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
