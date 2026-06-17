'use client';

import Link from "next/link";

/* ── 더미 데이터 (짧은 회의 — 여름 마케팅 캠페인) ───────────── */
const MEETING = {
  title: "여름 신상품 런칭 마케팅 캠페인 회의",
  date: "2026년 6월 16일 (화) 오전 10:00",
  duration: 14,
  participants: [
    { name: "박서준", role: "마케팅 팀장" },
    { name: "김하늘", role: "콘텐츠/데이터" },
    { name: "정유진", role: "컨셉 기획" },
    { name: "이도현", role: "데이터 분석" },
  ],
};

const MINUTES = {
  summary: "여름 신상품 쿨링 기능성 의류 라인의 런칭 마케팅 캠페인 컨셉과 채널별 예산 배분을 확정했다. 봄 캠페인 성과 분석을 바탕으로 인스타그램을 중심으로 총 8천만원을 배분하고, 마이크로 인플루언서 협업과 SNS 콘텐츠 일정을 정했으며 오프라인 팝업 이벤트는 추가 검토하기로 했다.",
  decisions: [
    "여름 캠페인 컨셉을 '입는 순간 에어컨'으로 확정",
    "총 예산 8천만원 배분 — 인스타그램 3,200만원 / 유튜브 2,000만원 / 네이버 검색광고 1,600만원 / 페이스북 리타겟팅 400만원 / 인플루언서 800만원",
    "페이스북은 신규 유입 대신 기존 고객 리타겟팅 용도로만 운영",
    "인플루언서는 마이크로 인플루언서(팔로워 1~5만) 8~10명으로 진행하고, 인플루언서별 할인 코드로 성과 추적",
    "SNS 콘텐츠는 티저 1주 후 제품 공개, 본 캠페인 기간 주 3회(월·수·금) 발행",
  ],
  todos: [
    { text: "'입는 순간 에어컨' 상표 법무팀 회신 확인하기 (다음 주 초)", assignee: "정유진" },
    { text: "마이크로 인플루언서 8~10명 리스트업 및 다음 주 컨택하기", assignee: "정유진" },
    { text: "콘텐츠 캘린더 최종본 공유하기 (이번 주 금요일까지)", assignee: "김하늘" },
    { text: "숏폼 편집 외주 편집자 섭외하기", assignee: "김하늘" },
    { text: "오프라인 팝업 ROI 분석 및 상세 견적서 정리하기 (다음 주까지)", assignee: "이도현" },
  ],
  questions: [
    "오프라인 쿨링 체험 팝업(1주 운영 약 1,500만원)을 별도 예산으로 편성할지 — 다음 회의에서 결정",
  ],
  nextAgenda: [
    "오프라인 팝업 이벤트 별도 예산 편성 여부 결정",
    "인플루언서 섭외 결과 및 콘텐츠 진행 상황 공유",
    "캠페인 1주차 채널별 성과 중간 점검",
  ],
};

const AVATAR_COLORS = [
  { bg: "#eff6ff", text: "#2563eb" },
  { bg: "#f0fdf4", text: "#16a34a" },
  { bg: "#fdf4ff", text: "#7c3aed" },
  { bg: "#fffbeb", text: "#d97706" },
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

export default function DemoMarketingPage() {
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
                  <div style={{ fontSize: 13.5, color: "#14532d", lineHeight: 1.6 }}>{d}</div>
                </div>
              ))}
            </div>
          </MinutesSection>

          {/* 할 일 — 담당자별 그룹 */}
          <MinutesSection icon="🔨" iconBg="#fffbeb" title="할 일 (Action Items)" count={MINUTES.todos.length}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {(() => {
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
                  <div style={{ fontSize: 13.5, color: "#4c1d95", lineHeight: 1.6 }}>{q}</div>
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
              { label: "전사 길이", value: "약 4,600자" },
              { label: "LLM (map)", value: "Qwen2.5-7B" },
              { label: "LLM (reduce)", value: "Qwen2.5-14B" },
              { label: "청크 수", value: "2구간" },
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
