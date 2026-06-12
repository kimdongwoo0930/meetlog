'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { meetingsApi, type Meeting } from "@/src/lib/api";

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; bg: string; color: string; border: string }> = {
    SCHEDULED:   { label: "예정",    bg: "var(--accent-light)",  color: "var(--accent)",  border: "var(--accent-border)" },
    IN_PROGRESS: { label: "진행 중", bg: "var(--red-light)",     color: "var(--red)",     border: "#fecaca" },
    REVIEWING:   { label: "검토 중", bg: "#fff7ed",              color: "#ea580c",        border: "#fed7aa" },
    GENERATING:  { label: "생성 중", bg: "#faf5ff",              color: "#9333ea",        border: "#e9d5ff" },
    COMPLETED:   { label: "완료",    bg: "var(--green-light)",   color: "var(--green)",   border: "var(--green-border)" },
  };
  const c = configs[status] ?? configs["COMPLETED"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11.5, fontWeight: 500, padding: "3px 9px", borderRadius: 999,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
      {c.label}
    </span>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return `오늘 ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return `${d.getFullYear()}.${(d.getMonth()+1).toString().padStart(2,"0")}.${d.getDate().toString().padStart(2,"0")}`;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    meetingsApi.list()
      .then(setMeetings)
      .catch(err => setError(err instanceof Error ? err.message : "불러오기 실패"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "0 28px", height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>회의 목록</div>
        <Link href="/meetings/new" style={{
          fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 7,
          background: "var(--text-primary)", color: "#fff",
          display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none",
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          새 회의 시작
        </Link>
      </div>

      <div style={{ padding: 28 }}>
        {loading ? (
          <div style={{ color: "var(--text-tertiary)", fontSize: 14, textAlign: "center", padding: "60px 0" }}>불러오는 중...</div>
        ) : error ? (
          <div style={{ color: "var(--red)", fontSize: 14, textAlign: "center", padding: "60px 0" }}>{error}</div>
        ) : meetings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 14, color: "var(--text-tertiary)", marginBottom: 16 }}>아직 참여한 회의가 없습니다.</div>
            <Link href="/meetings/new" style={{
              fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 8,
              background: "var(--text-primary)", color: "#fff", textDecoration: "none",
            }}>첫 회의 시작하기</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 데모 더미 2개 */}
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              📌 AI 데모
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
              {[
                { href: "/meetings/demo-lora",    title: "TaskFlow 스프린트 25 리뷰 & 26 플래닝 — 회의록", date: "2026.06.11", badge: "회의록 데모" },
                { href: "/meetings/demo-stt",     title: "STT 원문 검토 — 추임새 필터 & 수정",             date: "2026.06.11", badge: "STT 데모" },
                { href: "/meetings/demo-compare", title: "LoRA 파인튜닝 전/후 비교",                         date: "2026.06.11", badge: "AI 연구" },
              ].map(({ href, title, date, badge }, i) => (
                <div key={href} style={{
                  display: "grid", gridTemplateColumns: "1fr 160px 100px 80px",
                  padding: "16px 20px", alignItems: "center",
                  borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                  background: "#fafaf8",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{title}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: "#faf5ff", color: "#9333ea", border: "1px solid #e9d5ff", flexShrink: 0 }}>{badge}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{date}</div>
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 500, padding: "3px 9px", borderRadius: 999, background: "#f0fdf4", color: "#16a34a", border: "1px solid #dcfce7" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />완료
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Link href={href} style={{ fontSize: 12, color: "var(--text-tertiary)", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)", textDecoration: "none" }}>
                      보기 →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 실제 회의 목록 */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 12, overflow: "hidden",
          }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 160px 100px 80px",
              padding: "10px 20px", borderBottom: "1px solid var(--border)",
              fontSize: 11.5, fontWeight: 600, color: "var(--text-tertiary)",
              letterSpacing: "0.04em", textTransform: "uppercase", background: "#fafaf8",
            }}>
              <span>회의명</span><span>일시</span><span>상태</span><span></span>
            </div>

            {meetings.map((m, i) => (
              <div key={m.id} style={{
                display: "grid", gridTemplateColumns: "1fr 160px 100px 80px",
                padding: "16px 20px", alignItems: "center",
                borderBottom: i < meetings.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>
                  {m.title}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {m.status === "IN_PROGRESS" ? "진행 중" : formatDate(m.startedAt)}
                </div>
                <div><StatusBadge status={m.status} /></div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {!(m.status === "COMPLETED" && !m.hasMinutes) && (
                    <Link
                      href={
                        m.status === "IN_PROGRESS" ? `/meetings/${m.id}/room`
                        : m.status === "REVIEWING" ? `/meetings/${m.id}/review`
                        : `/meetings/${m.id}`
                      }
                      style={{
                        fontSize: 12, color: "var(--text-tertiary)",
                        padding: "4px 10px", borderRadius: 6,
                        border: "1px solid var(--border)", textDecoration: "none",
                      }}
                    >
                      {m.status === "IN_PROGRESS" ? "참여 →"
                        : m.status === "SCHEDULED" ? "입장 →"
                        : m.status === "REVIEWING" ? "검토하기 →"
                        : m.status === "GENERATING" ? "생성 중..."
                        : "회의록 →"}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
          </div>
        )}
      </div>
    </>
  );
}
