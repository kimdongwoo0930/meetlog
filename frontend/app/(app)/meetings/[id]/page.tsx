'use client';

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { meetingsApi, participantApi, type Meeting, type MeetingMinutes, type UserSummary } from "@/src/lib/api";

function formatDate(iso: string) {
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  return d.toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' });
}

function diffMinutes(start: string, end?: string) {
  if (!end) return null;
  const s = new Date(start.endsWith('Z') ? start : start + 'Z');
  const e = new Date(end.endsWith('Z') ? end : end + 'Z');
  return Math.round((e.getTime() - s.getTime()) / 60000);
}

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  const [participants, setParticipants] = useState<UserSummary[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    meetingsApi.get(id).then(setMeeting).catch(() => setLoadError("회의 정보를 불러올 수 없습니다."));
    participantApi.list(id).then(setParticipants).catch(() => {});
  }, [id]);

  // 상태에 따른 분기 처리
  useEffect(() => {
    if (!meeting) return;
    const myEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    const isHost = myEmail && meeting.hostUserEmail === myEmail;

    // 호스트이고 아직 COMPLETED가 아니면 검토 페이지로
    if (isHost && meeting.status !== 'COMPLETED') {
      router.replace(`/meetings/${id}/review`);
      return;
    }

    // GENERATING 상태면 생성 중 화면 표시
    if (meeting.status === 'GENERATING') {
      setGenerating(true);
      return;
    }
  }, [id, meeting, router]);

  // GENERATING 상태에서 폴링 — 완료되면 meeting 갱신
  useEffect(() => {
    if (!generating) return;
    let timer: ReturnType<typeof setTimeout>;

    const poll = () => {
      meetingsApi.get(id)
        .then(updated => {
          if (updated.status === 'COMPLETED') {
            setMeeting(updated);
            setGenerating(false);
          } else {
            timer = setTimeout(poll, 3000);
          }
        })
        .catch(() => { timer = setTimeout(poll, 3000); });
    };

    timer = setTimeout(poll, 3000);
    return () => clearTimeout(timer);
  }, [id, generating]);

  // COMPLETED 상태면 minutes 조회
  useEffect(() => {
    if (!meeting || meeting.status !== 'COMPLETED') return;
    meetingsApi.getMinutes(id).then(setMinutes).catch(() => {});
  }, [id, meeting]);

  if (loadError) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#6b6760", fontSize: 14 }}>
        {loadError}
      </div>
    );
  }

  if (!meeting) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#a8a49e", fontSize: 14 }}>
        불러오는 중...
      </div>
    );
  }

  // 회의록 생성 중 화면
  if (generating || !minutes) {
    return (
      <>
        <div style={{
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
          padding: "0 28px", height: 52,
          display: "flex", alignItems: "center",
          position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
            <Link href="/meetings" style={{ color: "var(--text-tertiary)", textDecoration: "none" }}>회의 목록</Link>
            <span>›</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{meeting.title}</span>
          </div>
        </div>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          height: "60vh", gap: 20, color: "var(--text-secondary)",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            border: "3px solid var(--border)",
            borderTopColor: "#2563eb",
            animation: "spin 1s linear infinite",
          }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
              AI가 회의록을 생성하고 있습니다
            </div>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
              STT 내용을 분석 중입니다. 잠시 기다려주세요.
            </div>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  const duration = meeting.startedAt ? diffMinutes(meeting.startedAt, meeting.endedAt) : null;
  const avatarColors = [
    { bg: "var(--accent-light)", text: "var(--accent)" },
    { bg: "#f0fdf4", text: "#16a34a" },
    { bg: "#fdf4ff", text: "#7c3aed" },
    { bg: "#fffbeb", text: "#d97706" },
    { bg: "#fef2f2", text: "#dc2626" },
  ];

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
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{meeting.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
            {meeting.startedAt && (
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <svg viewBox="0 0 13 13" fill="none" width="13" height="13"><rect x="1" y="2" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 1v2M9 1v2M1 5h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                {formatDate(meeting.startedAt)}
              </span>
            )}
            {duration !== null && (
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <svg viewBox="0 0 13 13" fill="none" width="13" height="13"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 4v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                {duration}분
              </span>
            )}
            <span>{participants.length}명 참여</span>
          </div>

          {participants.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 32, flexWrap: "wrap" }}>
              {participants.map((p, i) => {
                const c = avatarColors[i % avatarColors.length];
                return (
                  <div key={p.email} style={{
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
          )}

          {/* SUMMARY */}
          {minutes.summary && (
            <MinutesSection icon="📋" iconBg="var(--accent-light)" title="회의 요약">
              <div style={{
                fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75,
                background: "var(--bg)", padding: "14px 18px", borderRadius: 10,
                border: "1px solid var(--border)",
              }}>{minutes.summary}</div>
            </MinutesSection>
          )}

          {/* DECISIONS */}
          {minutes.decisions?.length > 0 && (
            <MinutesSection icon="✅" iconBg="var(--green-light)" title="결정사항" count={minutes.decisions.length}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {minutes.decisions.map((d, i) => (
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
          )}

          {/* TODOS */}
          {minutes.todos?.length > 0 && (
            <MinutesSection icon="🔨" iconBg="#fffbeb" title="할 일 (Action Items)" count={minutes.todos.length}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {minutes.todos.map((todo, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "11px 14px", background: "var(--surface)",
                    border: "1px solid var(--border)", borderRadius: 8,
                  }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4,
                      border: "1.5px solid var(--border)", flexShrink: 0,
                    }} />
                    <div style={{ fontSize: 13.5, color: "var(--text-primary)", flex: 1 }}>{todo.text}</div>
                    {todo.assignee && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "var(--accent-light)", color: "var(--accent)",
                        fontSize: 11.5, fontWeight: 500, padding: "2px 8px", borderRadius: 5,
                      }}>{todo.assignee}</div>
                    )}
                  </div>
                ))}
              </div>
            </MinutesSection>
          )}

          {/* QUESTIONS */}
          {minutes.questions?.length > 0 && (
            <MinutesSection icon="❓" iconBg="#fdf4ff" title="미결 질문" count={minutes.questions.length}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {minutes.questions.map((q, i) => (
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
          )}

          {/* NEXT AGENDA */}
          {minutes.nextAgenda?.length > 0 && (
            <MinutesSection icon="📅" iconBg="#f0f9ff" title="다음 회의 안건" count={minutes.nextAgenda.length}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {minutes.nextAgenda.map((item, i) => (
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
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width: 280, flexShrink: 0, padding: "28px 22px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 12 }}>회의 정보</div>
            {[
              { label: "참여자", value: `${participants.length}명` },
              { label: "결정사항", value: `${minutes.decisions?.length ?? 0}개` },
              { label: "할 일", value: `${minutes.todos?.length ?? 0}개` },
              { label: "미결 질문", value: `${minutes.questions?.length ?? 0}개` },
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
