'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ── 더미 STT 세그먼트 데이터 ────────────────────────────────── */
const DEMO_SEGMENTS = [
  { id: "1",  speaker: "김민준", start: 0,   end: 18,  content: "네, 그럼 오늘 회의 시작하겠습니다. 어 오늘 참석자는 저 김민준이랑 이서연씨, 박지훈씨, 최수진씨, 정우성씨까지 다섯 명이고요. 오늘 아젠다는 먼저 스프린트 25 리뷰 하고, API v2 설계 얘기 하고, PR 리뷰 프로세스 개선 얘기 하고, 결제 버그 처리 방안, DB 성능 이슈, 마지막으로 베타 출시 일정 확정하는 걸로 진행하겠습니다." },
  { id: "2",  speaker: "이서연", start: 19,  end: 42,  content: "네, 저는 이번 스프린트에서 작업 템플릿 UI는 완료했어요. 그니까 사용자가 반복 작업을 템플릿으로 저장하고 불러오는 기능인데요, 드래그앤드롭도 잘 붙었고 모바일 반응형도 적용했어요. 근데 팀 초대 플로우 쪽은 음 이메일 발송 연동 부분에서 막혀서 완성을 못 했어요." },
  { id: "3",  speaker: "김민준", start: 43,  end: 46,  content: "아 팀 초대가 왜 막혔어요?" },
  { id: "4",  speaker: "이서연", start: 47,  end: 72,  content: "그니까 박지훈씨가 화요일에 이메일 서비스 API 올렸는데요, 어 스테이징 환경이랑 로컬 환경이 SMTP 설정이 달라서 저는 계속 401이 뜨더라고요. 그래서 환경변수 확인하다가 시간이 다 갔어요. 초대 플로우 자체 UI는 다 됐고 API 연동만 남았어요." },
  { id: "5",  speaker: "박지훈", start: 73,  end: 88,  content: "아 그거 제가 .env.example 업데이트를 깜빡했네요. 죄송해요. 오늘 오전에 올려드릴게요. MAILGUN_API_KEY랑 MAILGUN_DOMAIN 두 개 추가하면 돼요." },
  { id: "6",  speaker: "김민준", start: 89,  end: 96,  content: "알겠어요. 그럼 팀 초대는 오늘 안에 완료 목표로 하죠. 박지훈씨 백엔드는요?" },
  { id: "7",  speaker: "박지훈", start: 97,  end: 128, content: "저는 작업 템플릿 API랑 팀 초대 API 둘 다 완료했고요, 추가로 검색 성능 개선 작업도 좀 했는데 이건 스프린트 외 작업이에요. 작업 검색할 때 풀텍스트 서치 인덱스 적용했거든요. LIKE 쿼리 쓰다가 FTS로 바꿨는데 체감 속도가 꽤 빨라졌어요." },
  { id: "8",  speaker: "최수진", start: 129, end: 155, content: "저는 이번 스프린트 QA 항목이 총 16개였는데요, 14개 완료했어요. 남은 두 개 중 하나는 팀 초대 플로우 연동 완료되면 바로 할 수 있고요, 나머지 하나가 좀 중요한 이슈예요. 결제 모듈 쪽에서 버그를 발견했어요." },
  { id: "9",  speaker: "김민준", start: 156, end: 162, content: "결제 버그요? 나중에 자세히 얘기하죠. 정우성씨는요?" },
  { id: "10", speaker: "정우성", start: 163, end: 193, content: "저는 배포 파이프라인 개선이랑 모니터링 대시보드 셋업 완료했어요. Grafana에 주요 지표 다 올려놨고요, CD 파이프라인에 롤링 업데이트 적용해서 이제 배포할 때 다운타임이 없어요. 그리고 Slack 배포 알림도 달았어요." },
  { id: "11", speaker: "김민준", start: 194, end: 218, content: "오 좋네요. 롤링 업데이트에 슬랙 알림까지. 수고하셨어요. 그럼 스프린트 25는 작업 템플릿 완료, 팀 초대 90%, 인프라 개선 완료, 결제 버그 발견 이렇게 정리됩니다. 다음 안건으로 API v2 설계 논의 들어가겠습니다." },
  { id: "12", speaker: "박지훈", start: 219, end: 255, content: "네, 제가 설계 문서에서 크게 세 가지 변경사항을 제안했는데요. 첫 번째가 대시보드 데이터 조회를 GraphQL로 전환하는 거고, 두 번째가 인증 방식을 httpOnly 쿠키로 바꾸는 거고, 세 번째가 페이지네이션을 커서 기반으로 바꾸는 거예요." },
  { id: "13", speaker: "이서연", start: 256, end: 278, content: "GraphQL 전환이 제일 궁금했는데요. 프론트 입장에서는 기존 REST로도 잘 돌아가고 있거든요. 지금 대시보드 한 페이지 로드할 때 API를 네다섯 번 호출하잖아요? 그게 워터폴로 쌓여서 첫 로딩이 느려지는 거거든요." },
  { id: "14", speaker: "최수진", start: 279, end: 298, content: "그러면 테스트 입장에서는 REST랑 GraphQL 두 가지를 다 커버해야 하는 거잖아요. 부담이 좀 있을 것 같은데요." },
  { id: "15", speaker: "김민준", start: 299, end: 318, content: "알겠어요. 대시보드는 GraphQL로 방향 잡겠습니다. 그럼 정리하면 대시보드는 GraphQL 도입, 인증은 httpOnly 쿠키로 전환, 페이지네이션은 커서 기반으로. API v2 완성은 5-6주 후 목표, 베타는 v1으로 가기로 합니다." },
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
    setTimeout(() => router.push("/meetings/demo-lora"), 2800);
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
          <div style={{ fontSize: 13, color: "#a8a49e" }}>총 {segments.length}개 발화</div>
          <button
            onClick={handleGenerate}
            style={{
              padding: "8px 20px", fontSize: 13.5, fontWeight: 600, borderRadius: 8,
              background: "#2563eb", color: "#fff", border: "none", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 7,
            }}
          >
            <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
              <path d="M7 1l1.5 3.5H12l-3 2 1.5 3.5L7 8 3.5 10 5 6.5 2 4.5h3.5L7 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            회의록 생성
          </button>
        </div>
      </div>

      {/* 안내 */}
      <div style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "10px 32px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#92400e" }}>
        <svg viewBox="0 0 14 14" fill="none" width="14" height="14"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
        STT 오인식 또는 불필요한 발화를 수정·삭제한 후 <strong>회의록 생성</strong>을 눌러주세요.
      </div>

      {/* 세그먼트 목록 */}
      <div style={{ flex: 1, padding: "28px 32px", maxWidth: 860, width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {segments.map(seg => {
            const color = SPEAKER_COLORS[seg.speaker] ?? { bg: "#f5f5f5", text: "#555" };
            const isEditing = editingId === seg.id;

            return (
              <div key={seg.id} style={{
                background: "#fff", border: `1px solid ${isEditing ? "#2563eb" : "#e8e5de"}`,
                borderRadius: 10, padding: "14px 16px",
                transition: "border-color 0.15s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{
                    background: color.bg, color: color.text,
                    borderRadius: 999, padding: "2px 9px",
                    fontSize: 12, fontWeight: 600,
                  }}>{seg.speaker}</div>
                  <span style={{ fontSize: 11.5, color: "#a8a49e", fontFamily: "monospace" }}>
                    {fmt(seg.start)} — {fmt(seg.end)}
                  </span>
                  <div style={{ flex: 1 }} />
                  {!isEditing && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => handleEditStart(seg)}
                        style={{ padding: "3px 8px", fontSize: 12, borderRadius: 5, border: "1px solid #e8e5de", background: "transparent", color: "#6b6760", cursor: "pointer" }}
                      >수정</button>
                      <button
                        onClick={() => handleDelete(seg.id)}
                        style={{ padding: "3px 8px", fontSize: 12, borderRadius: 5, border: "1px solid #fecaca", background: "transparent", color: "#ef4444", cursor: "pointer" }}
                      >삭제</button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      autoFocus
                      style={{
                        width: "100%", minHeight: 72, padding: "10px 12px",
                        fontSize: 13.5, lineHeight: 1.7, fontFamily: "inherit",
                        border: "1px solid #2563eb", borderRadius: 7, outline: "none",
                        resize: "vertical", boxSizing: "border-box", background: "#f8fbff",
                      }}
                    />
                    <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
                      <button onClick={() => setEditingId(null)} style={{ padding: "5px 12px", fontSize: 12.5, borderRadius: 6, border: "1px solid #e8e5de", background: "transparent", color: "#6b6760", cursor: "pointer" }}>취소</button>
                      <button onClick={() => handleEditSave(seg)} style={{ padding: "5px 14px", fontSize: 12.5, borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 500 }}>저장</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13.5, color: "#1a1916", lineHeight: 1.7 }}>{seg.content}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
