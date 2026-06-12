'use client';

import Link from "next/link";

/* ── 더미 데이터 ─────────────────────────────────────────────── */
const MEETING = {
  title: "TaskFlow 스프린트 25 리뷰 & 26 플래닝",
  date: "2026년 6월 11일 (목) 오후 2:00",
  duration: 22,
  participants: [
    { name: "김민준", role: "PM" },
    { name: "이서연", role: "프론트엔드" },
    { name: "박지훈", role: "백엔드" },
    { name: "최수진", role: "QA" },
    { name: "정우성", role: "DevOps" },
  ],
};

const MINUTES = {
  summary: "TaskFlow 스프린트 25 리뷰 및 26 플래닝을 진행하고 API v2 설계를 확정했다. PR 리뷰 프로세스 개선, 결제 모듈 버그 처리, DB 성능 최적화 방안 등을 논의했으며 베타 출시 일정도 다음 주 목요일로 확정되었다.",
  decisions: [
    "API v2는 베타 이후 정식 릴리즈에 포함",
    "대시보드는 GraphQL로 설계",
    "인증은 httpOnly 쿠키 방식으로 전환",
    "페이지네이션은 커서 기반으로 변경",
    "PR 크기 500줄 이하 가이드라인 도입",
    "리뷰 SLA 영업일 1일로 설정",
  ],
  todos: [
    { text: "팀 초대 API 환경변수 업데이트하기", assignee: "박지훈" },
    { text: "PR 리뷰 프로세스 개선하기 (Danger.js 도입)", assignee: "정우성" },
    { text: "결제 버그 수정하기 (목요일까지)", assignee: "박지훈" },
    { text: "결제 버그 QA 진행하기", assignee: "최수진" },
    { text: "핫픽스 배포하기 (금요일 저녁)", assignee: "정우성" },
    { text: "DB N+1 문제 해결 및 인덱스 추가하기", assignee: "박지훈" },
    { text: "DB 성능 스테이징 검증하기", assignee: "박지훈, 정우성" },
    { text: "온보딩 플로우 6단계 → 3단계 개선하기", assignee: "이서연" },
    { text: "Playwright E2E 기본 셋업하기", assignee: "최수진, 이서연" },
    { text: "GraphQL 설계 문서 구체화하기", assignee: "박지훈" },
    { text: "Redis 캐싱 인프라 설정하기", assignee: "정우성" },
  ],
  questions: [
    "인덱스 추가 시 운영 DB 락 발생 여부 — MySQL 8 Instant DDL 적용으로 해결 가능한지 확인 필요",
  ],
  nextAgenda: [
    "API v2 GraphQL 스키마 설계 리뷰",
    "베타 오픈 후 사용자 피드백 수집 방법 논의",
    "Redis 캐싱 전/후 성능 비교 결과 공유",
    "스프린트 26 중간 점검",
  ],
};

const AVATAR_COLORS = [
  { bg: "#eff6ff", text: "#2563eb" },
  { bg: "#f0fdf4", text: "#16a34a" },
  { bg: "#fdf4ff", text: "#7c3aed" },
  { bg: "#fffbeb", text: "#d97706" },
  { bg: "#fef2f2", text: "#dc2626" },
];

function MinutesSection({ icon, iconBg, title, count, children }: {
  icon: string; iconBg: string; title: string; count?: number; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: iconBg, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0,
        }}>{icon}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
        {count !== undefined && (
          <div style={{
            fontSize: 12, color: "var(--text-tertiary)",
            background: "var(--bg)", border: "1px solid var(--border)",
            padding: "1px 7px", borderRadius: 999,
          }}>{count}개</div>
        )}
      </div>
      {children}
    </div>
  );
}

export default function DemoLoraPage() {
  return (
    <>
      {/* TOPBAR */}
      <div style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "0 28px", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
          <Link href="/meetings" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>회의 목록</Link>
          <span>›</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{MEETING.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#faf5ff", color: "#9333ea", border: "1px solid #e9d5ff" }}>
            AI 생성 데모
          </span>
          <button style={{
            fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 7,
            cursor: "pointer", border: "1px solid var(--border)",
            background: "transparent", color: "var(--text-secondary)",
          }}>링크 복사</button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* MAIN */}
        <div style={{ flex: 1, padding: "36px 40px", maxWidth: 760, borderRight: "1px solid var(--border)" }}>

          <h1 style={{
            fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            fontSize: 28, lineHeight: 1.2, letterSpacing: "-0.02em",
            color: "var(--text-primary)", marginBottom: 8,
          }}>{MEETING.title}</h1>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 24, fontSize: 13, color: "var(--text-tertiary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg viewBox="0 0 13 13" fill="none" width="13" height="13"><rect x="1" y="2" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 1v2M9 1v2M1 5h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {MEETING.date}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg viewBox="0 0 13 13" fill="none" width="13" height="13"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {MEETING.duration}분
            </span>
            <span>{MEETING.participants.length}명 참여</span>
          </div>

          {/* 참석자 */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 36, flexWrap: "wrap" }}>
            {MEETING.participants.map((p, i) => {
              const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <div key={p.name} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 999, padding: "4px 10px 4px 5px",
                  fontSize: 12.5, color: "var(--text-secondary)",
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: c.bg, color: c.text,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 600,
                  }}>{p.name.slice(0, 1)}</div>
                  {p.name}
                </div>
              );
            })}
          </div>

          {/* 요약 */}
          <MinutesSection icon="📋" iconBg="var(--accent-light)" title="회의 요약">
            <div style={{
              fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75,
              background: "var(--bg)", padding: "14px 18px", borderRadius: 10,
              border: "1px solid var(--border)",
            }}>{MINUTES.summary}</div>
          </MinutesSection>

          {/* 결정사항 */}
          <MinutesSection icon="✅" iconBg="var(--green-light)" title="결정사항" count={MINUTES.decisions.length}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {MINUTES.decisions.map((d, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "12px 14px", background: "var(--green-light)",
                  border: "1px solid var(--green-border)", borderRadius: 8,
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>✓</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: "#14532d" }}>{d}</div>
                </div>
              ))}
            </div>
          </MinutesSection>

          {/* 할 일 — 담당자별 그룹 */}
          <MinutesSection icon="🔨" iconBg="#fffbeb" title="할 일 (Action Items)" count={MINUTES.todos.length}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(() => {
                // 담당자별 그룹화: 단일 담당자 우선, 복수 담당자 후
                const groups: Record<string, typeof MINUTES.todos> = {};
                MINUTES.todos.forEach(todo => {
                  const key = todo.assignee || "미정";
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(todo);
                });
                const single = Object.entries(groups).filter(([k]) => !k.includes(","));
                const multi  = Object.entries(groups).filter(([k]) => k.includes(","));
                return [...single, ...multi].map(([assignee, todos]) => (
                  <div key={assignee}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                      <div style={{
                        background: "var(--accent-light)", color: "var(--accent)",
                        fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 999,
                      }}>{assignee}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-tertiary)" }}>{todos.length}개</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {todos.map((todo, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 14px", background: "var(--surface)",
                          border: "1px solid var(--border)", borderRadius: 8,
                        }}>
                          <div style={{ width: 16, height: 16, borderRadius: 4, border: "1.5px solid var(--border)", flexShrink: 0 }} />
                          <div style={{ fontSize: 13.5, color: "var(--text-primary)" }}>{todo.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </MinutesSection>

          {/* 미결 질문 */}
          <MinutesSection icon="❓" iconBg="#fdf4ff" title="미결 질문" count={MINUTES.questions.length}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {MINUTES.questions.map((q, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "12px 14px", background: "#fdf4ff",
                  border: "1px solid #e9d5ff", borderRadius: 8,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: "#7c3aed",
                    background: "#ede9fe", padding: "2px 6px", borderRadius: 4,
                    flexShrink: 0, marginTop: 1,
                  }}>Q</span>
                  <div style={{ fontSize: 13.5, color: "#4c1d95" }}>{q}</div>
                </div>
              ))}
            </div>
          </MinutesSection>

          {/* 다음 회의 안건 */}
          <MinutesSection icon="📅" iconBg="#f0f9ff" title="다음 회의 안건" count={MINUTES.nextAgenda.length}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {MINUTES.nextAgenda.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "11px 14px", background: "#f0f9ff",
                  border: "1px solid #bae6fd", borderRadius: 8,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: "#0284c7", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 600, flexShrink: 0, marginTop: 1,
                  }}>{i + 1}</div>
                  <div style={{ fontSize: 13.5, color: "#0c4a6e" }}>{item}</div>
                </div>
              ))}
            </div>
          </MinutesSection>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width: 280, flexShrink: 0, padding: "28px 22px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>회의 정보</div>
            {[
              { label: "참여자", value: `${MEETING.participants.length}명` },
              { label: "결정사항", value: `${MINUTES.decisions.length}개` },
              { label: "할 일", value: `${MINUTES.todos.length}개` },
              { label: "미결 질문", value: `${MINUTES.questions.length}개` },
            ].map(row => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13,
              }}>
                <span style={{ color: "var(--text-tertiary)" }}>{row.label}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>AI 처리 정보</div>
            {[
              { label: "STT 모델", value: "mlx-whisper" },
              { label: "LLM (map)", value: "Qwen2.5-7B LoRA" },
              { label: "LLM (reduce)", value: "Qwen2.5-14B" },
              { label: "청크 수", value: "3구간" },
            ].map(row => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13,
              }}>
                <span style={{ color: "var(--text-tertiary)" }}>{row.label}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
