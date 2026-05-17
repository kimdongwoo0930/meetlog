'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { meetingsApi, userApi, participantApi, type UserSummary } from "@/src/lib/api";

export default function NewMeetingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [participants, setParticipants] = useState<UserSummary[]>([]);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddParticipant = async () => {
    const email = emailInput.trim();
    if (!email) return;
    if (participants.some(p => p.email === email)) {
      setSearchError("이미 추가된 참여자입니다.");
      return;
    }
    setSearching(true);
    setSearchError("");
    try {
      const user = await userApi.searchByEmail(email);
      setParticipants(prev => [...prev, user]);
      setEmailInput("");
    } catch {
      setSearchError("해당 이메일의 사용자를 찾을 수 없습니다.");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");
    try {
      const meeting = await meetingsApi.create(title.trim());
      // 참여자 순차 추가
      for (const p of participants) {
        await participantApi.add(meeting.id, p.email).catch(() => null);
      }
      router.push(`/meetings/${meeting.id}/room`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "회의 생성에 실패했습니다.");
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "10px 14px", borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg)", color: "var(--text-primary)",
    fontSize: 14, outline: "none",
  };

  return (
    <>
      <div style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "0 28px", height: 52,
        display: "flex", alignItems: "center",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>새 회의 시작</div>
      </div>

      <div style={{ padding: 28, maxWidth: 520 }}>
        <form onSubmit={handleSubmit}>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20,
          }}>
            {/* 회의 제목 */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", display: "block", marginBottom: 8 }}>
                회의 제목
              </label>
              <input
                type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="예: 개발팀 주간 스프린트 회의" autoFocus style={inputStyle}
              />
            </div>

            {/* 참여자 초대 */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", display: "block", marginBottom: 8 }}>
                참여자 초대 <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>(선택)</span>
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="email" value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); setSearchError(""); }}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddParticipant())}
                  placeholder="이메일 입력 후 추가"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button" onClick={handleAddParticipant}
                  disabled={!emailInput.trim() || searching}
                  style={{
                    padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border)",
                    background: "var(--bg)", color: "var(--text-secondary)",
                    fontSize: 13, fontWeight: 500, cursor: "pointer", flexShrink: 0,
                    opacity: !emailInput.trim() || searching ? 0.5 : 1,
                  }}
                >
                  {searching ? "검색 중..." : "추가"}
                </button>
              </div>

              {searchError && (
                <div style={{ fontSize: 12, color: "var(--red)", marginTop: 6 }}>{searchError}</div>
              )}

              {/* 추가된 참여자 칩 */}
              {participants.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {participants.map(p => (
                    <div key={p.email} style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: "var(--accent-light)", border: "1px solid var(--accent-border)",
                      borderRadius: 999, padding: "4px 10px 4px 8px", fontSize: 12.5,
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%",
                        background: "var(--accent)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 600, flexShrink: 0,
                      }}>
                        {p.name.slice(0, 1)}
                      </div>
                      <span style={{ color: "var(--accent)", fontWeight: 500 }}>{p.name}</span>
                      <button
                        type="button"
                        onClick={() => setParticipants(prev => prev.filter(x => x.email !== p.email))}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--accent)", padding: 0, lineHeight: 1, fontSize: 14,
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div style={{ fontSize: 13, color: "var(--red)" }}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => router.back()} style={{
                padding: "9px 18px", borderRadius: 8,
                border: "1px solid var(--border)", background: "transparent",
                color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>취소</button>
              <button type="submit" disabled={!title.trim() || loading} style={{
                padding: "9px 20px", borderRadius: 8, border: "none",
                background: title.trim() && !loading ? "var(--text-primary)" : "var(--border)",
                color: title.trim() && !loading ? "#fff" : "var(--text-tertiary)",
                fontSize: 13, fontWeight: 500,
                cursor: title.trim() && !loading ? "pointer" : "default",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                {loading ? "생성 중..." : "회의 시작"}
                {!loading && (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 6.5h9M7 2.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
