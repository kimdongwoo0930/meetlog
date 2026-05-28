'use client';

import { useState } from "react";
import { meetingPasswordApi } from "@/src/lib/api";

const AUTH_KEY = (id: string) => `meetingAuth_${id}`;

export function isPasswordAuthed(meetingId: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_KEY(meetingId)) === "true";
}

export function setPasswordAuthed(meetingId: string) {
  sessionStorage.setItem(AUTH_KEY(meetingId), "true");
}

export default function MeetingPasswordModal({
  meetingId,
  onSuccess,
}: {
  meetingId: string;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      await meetingPasswordApi.verify(meetingId, password.trim());
      setPasswordAuthed(meetingId);
      onSuccess();
    } catch {
      setError("비밀번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: "32px 28px",
        width: 360, boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, background: "#eff6ff",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
              <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="#2563eb" strokeWidth="1.3"/>
              <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="#2563eb" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="8" cy="11" r="1" fill="#2563eb"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1916" }}>비밀번호 입력</div>
            <div style={{ fontSize: 12, color: "#a8a49e", marginTop: 1 }}>이 회의는 비밀번호로 보호되어 있습니다</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            placeholder="비밀번호를 입력하세요"
            autoFocus
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: `1px solid ${error ? "#ef4444" : "#e8e5de"}`,
              fontSize: 14, color: "#1a1916", outline: "none",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <div style={{ fontSize: 12.5, color: "#ef4444" }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={!password.trim() || loading}
            style={{
              padding: "10px", borderRadius: 8, border: "none",
              background: !password.trim() || loading ? "#e8e5de" : "#2563eb",
              color: !password.trim() || loading ? "#a8a49e" : "#fff",
              fontSize: 14, fontWeight: 600, cursor: !password.trim() || loading ? "default" : "pointer",
            }}
          >
            {loading ? "확인 중..." : "입장"}
          </button>
        </form>
      </div>
    </div>
  );
}
