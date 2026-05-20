import Link from "next/link";

const MOCK_MEETING = {
  id: "1",
  title: "개발팀 주간 스프린트 회의",
  date: "2025년 1월 14일 (화) 오전 10:00",
  duration: "52분",
  team: "개발팀",
  participants: [
    { initial: "김", name: "김동우", color: "var(--accent-light)", textColor: "var(--accent)" },
    { initial: "이", name: "이민수", color: "#f0fdf4", textColor: "#16a34a" },
    { initial: "박", name: "박지현", color: "#fdf4ff", textColor: "#7c3aed" },
    { initial: "정", name: "정승환", color: "#fffbeb", textColor: "#d97706" },
    { initial: "한", name: "한소희", color: "#fef2f2", textColor: "#dc2626" },
  ],
  summary: "이번 스프린트 주간 회의에서는 로그인 기능 구현 방향을 논의하고 기술 스택을 확정했습니다. JWT 인증 방식을 채택하고 프론트엔드는 Next.js, 백엔드는 Spring Boot를 사용하기로 결정했습니다. 이메일 인증 기능 추가 여부는 미결 사항으로 남겼으며, 다음 회의에서 API 명세를 확정할 예정입니다.",
  decisions: [
    "JWT 인증 방식을 사용하여 로그인 기능 구현",
    "프론트엔드는 Next.js, 백엔드는 Spring Boot로 기술 스택 확정",
    "이번 스프린트 완료 목표: 로그인 API + UI 구현",
  ],
  todos: [
    { text: "로그인 API 구현 (POST /auth/login, /auth/refresh)", assignee: "김동우", due: "이번 주" },
    { text: "로그인 UI 화면 제작 (로그인 폼, 유효성 검사)", assignee: "이민수", due: "이번 주" },
    { text: "JWT 토큰 만료 시 갱신 로직 구현", assignee: "김동우", due: "다음 주" },
    { text: "로그인 기능 E2E 테스트 작성", assignee: "박지현", due: "다음 주" },
  ],
  questions: [
    "이메일 인증 기능 추가 여부 — 다음 스프린트에서 논의 예정",
    "소셜 로그인(Google, GitHub) 지원 여부",
  ],
  nextAgenda: [
    "REST API 명세 확정 및 Swagger 문서화",
    "이메일 인증 기능 도입 여부 최종 결정",
    "로그인 기능 구현 완료 결과 공유",
  ],
  transcript: [
    { time: "0:00", speaker: "동우", text: "이번 스프린트에서 로그인 기능을 구현해야 할 것 같아요. 어떤 방식으로 할지 논의해봅시다." },
    { time: "0:42", speaker: "민수", text: "JWT 방식이 좋을 것 같아요. 세션 관리가 서버리스 환경에서도 편리하고, 확장성도 좋거든요." },
    { time: "1:15", speaker: "동우", text: "맞아요. 그러면 JWT로 확정하죠. 프론트는 Next.js, 백엔드는 Spring Boot로 가는 거 모두 동의하시죠?" },
    { time: "1:48", speaker: "지현", text: "동의합니다. 이메일 인증 기능은 이번에 같이 넣을지 결정이 필요할 것 같아요." },
    { time: "2:20", speaker: "동우", text: "이메일 인증은 다음 스프린트에서 논의하는 게 좋겠어요. 다음 회의에서 API 명세도 확정합시다." },
  ],
};

export default function MeetingDetailPage({ params: _params }: { params: Promise<{ id: string }> }) {
  const meeting = MOCK_MEETING;

  return (
    <>
      {/* TOPBAR */}
      <div style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "0 28px", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
            <Link href="/dashboard" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>대시보드</Link>
            <span>›</span>
            <Link href="/meetings" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>회의 목록</Link>
            <span>›</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{meeting.title}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{
            fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 7,
            cursor: "pointer", border: "1px solid var(--border)",
            background: "transparent", color: "var(--text-secondary)",
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>내보내기</button>
          <button style={{
            fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 7,
            cursor: "pointer", border: "1px solid var(--border)",
            background: "transparent", color: "var(--text-secondary)",
          }}>링크 복사</button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }}>
        {/* MINUTES MAIN */}
        <div style={{ flex: 1, padding: "36px 40px", maxWidth: 760, borderRight: "1px solid var(--border)" }}>
          <h1 style={{
            fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
            fontSize: 28, lineHeight: 1.2, letterSpacing: "-0.02em",
            color: "var(--text-primary)", marginBottom: 6,
          }}>{meeting.title}</h1>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 28, fontSize: 13, color: "var(--text-tertiary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg viewBox="0 0 13 13" fill="none" width="13" height="13"><rect x="1" y="2" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 1v2M9 1v2M1 5h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {meeting.date}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg viewBox="0 0 13 13" fill="none" width="13" height="13"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {meeting.duration}
            </span>
            <span>{meeting.team}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 32, flexWrap: "wrap" }}>
            {meeting.participants.map(p => (
              <div key={p.name} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 999, padding: "4px 10px 4px 5px",
                fontSize: 12.5, color: "var(--text-secondary)",
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: p.color, color: p.textColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 600,
                }}>{p.initial}</div>
                {p.name}
              </div>
            ))}
          </div>

          {/* SUMMARY */}
          <MinutesSection icon="📋" iconBg="var(--accent-light)" title="회의 요약">
            <div style={{
              fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75,
              background: "var(--bg)", padding: "14px 18px", borderRadius: 10,
              border: "1px solid var(--border)",
            }}>{meeting.summary}</div>
          </MinutesSection>

          {/* DECISIONS */}
          <MinutesSection icon="✅" iconBg="var(--green-light)" title="결정사항" count={meeting.decisions.length}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {meeting.decisions.map((d, i) => (
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

          {/* TODOS */}
          <MinutesSection icon="🔨" iconBg="#fffbeb" title="할 일 (Action Items)" count={meeting.todos.length}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {meeting.todos.map((todo, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 14px", background: "var(--surface)",
                  border: "1px solid var(--border)", borderRadius: 8,
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 4,
                    border: "1.5px solid var(--border)", flexShrink: 0, cursor: "pointer",
                  }} />
                  <div style={{ fontSize: 13.5, color: "var(--text-primary)", flex: 1 }}>{todo.text}</div>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: "var(--accent-light)", color: "var(--accent)",
                    fontSize: 11.5, fontWeight: 500, padding: "2px 8px", borderRadius: 5,
                  }}>{todo.assignee}</div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{todo.due}</div>
                </div>
              ))}
            </div>
          </MinutesSection>

          {/* QUESTIONS */}
          <MinutesSection icon="❓" iconBg="#fdf4ff" title="미결 질문" count={meeting.questions.length}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {meeting.questions.map((q, i) => (
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

          {/* NEXT AGENDA */}
          <MinutesSection icon="📅" iconBg="#f0f9ff" title="다음 회의 안건" count={meeting.nextAgenda.length}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {meeting.nextAgenda.map((item, i) => (
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

          {/* TRANSCRIPT */}
          <div style={{ marginTop: 32, paddingTop: 28, borderTop: "1px solid var(--border)" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase",
              color: "var(--text-tertiary)", marginBottom: 16,
            }}>
              회의 원문 (STT)
              <span style={{ fontSize: 12, color: "var(--accent)", cursor: "pointer", fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>전체 보기</span>
            </div>
            {meeting.transcript.map((line, i) => (
              <div key={i} style={{
                display: "flex", gap: 12, padding: "8px 0",
                borderBottom: i < meeting.transcript.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", minWidth: 36, marginTop: 2 }}>{line.time}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", minWidth: 40 }}>{line.speaker}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>{line.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width: 280, flexShrink: 0, padding: "28px 22px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>회의 정보</div>
            {[
              { label: "날짜", value: "2025.01.14" },
              { label: "시간", value: "10:00 ~ 10:52" },
              { label: "참여자", value: "5명" },
              { label: "결정사항", value: "3개" },
              { label: "할 일", value: "4개" },
            ].map(row => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: "1px solid var(--border)",
                fontSize: 13,
              }}>
                <span style={{ color: "var(--text-tertiary)" }}>{row.label}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{
            background: "var(--accent-light)", border: "1px solid var(--accent-border)",
            borderRadius: 10, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
              🤖 AI 분석 품질
            </div>
            {[
              { label: "요약 정확도", value: 92 },
              { label: "STT 정확도", value: 95 },
              { label: "항목 추출", value: 88 },
            ].map(score => (
              <div key={score.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{score.label}</div>
                <div style={{
                  flex: 1, height: 4, background: "rgba(37,99,235,0.15)",
                  borderRadius: 2, margin: "0 10px", overflow: "hidden",
                }}>
                  <div style={{ height: "100%", width: `${score.value}%`, background: "var(--accent)", borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>{score.value}%</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "링크 공유", icon: "→" },
              { label: "PDF 내보내기", icon: "↓" },
              { label: "Markdown 복사", icon: "≡" },
            ].map(btn => (
              <button key={btn.label} style={{
                width: "100%", padding: 9,
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 8, fontSize: 13, fontWeight: 500,
                color: "var(--text-primary)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>{btn.label}</button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

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
