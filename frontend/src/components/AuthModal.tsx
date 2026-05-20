'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/src/lib/api";

interface AuthModalProps {
  onClose: () => void;
  initialTab?: 'login' | 'signup';
}

export default function AuthModal({ onClose, initialTab = 'login' }: AuthModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = tab === 'login'
        ? await authApi.login(email, password)
        : await authApi.register(email, password, name);

      localStorage.setItem("access_token", res.accessToken);
      localStorage.setItem("refresh_token", res.refreshToken);
      localStorage.setItem("userEmail", email);

      onClose();
      router.push("/meetings");
    } catch (err) {
      setError(err instanceof Error ? err.message : (tab === 'login' ? "이메일 또는 비밀번호가 올바르지 않습니다." : "회원가입에 실패했습니다."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(4px)",
          animation: "fadeIn 0.15s ease",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 201,
        width: "100%", maxWidth: 420,
        background: "var(--surface)", borderRadius: 16,
        border: "1px solid var(--border)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.06)",
        padding: "2rem",
        animation: "slideUp 0.2s ease",
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            width: 28, height: 28, borderRadius: 7,
            background: "transparent", border: "1px solid var(--border)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text-tertiary)",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Logo */}
        <div style={{
          fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          fontSize: 20, color: "var(--text-primary)", marginBottom: "1.5rem",
        }}>
          Meet<span style={{ color: "var(--accent)" }}>Log</span>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 0, marginBottom: "1.75rem",
          background: "var(--bg)", borderRadius: 8, padding: 3,
          border: "1px solid var(--border)",
        }}>
          {(['login', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              style={{
                flex: 1, padding: "7px",
                borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 13.5, fontWeight: 500,
                background: tab === t ? "var(--surface)" : "transparent",
                color: tab === t ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              {t === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {tab === 'signup' && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", display: "block", marginBottom: 5 }}>이름</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="홍길동" required
                style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", display: "block", marginBottom: 5 }}>이메일</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com" required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", display: "block", marginBottom: 5 }}>비밀번호</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="8자 이상" required minLength={8}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: "var(--red)", background: "var(--red-light)", padding: "9px 12px", borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "10px", borderRadius: 8,
            background: "var(--text-primary)", color: "#fff",
            fontSize: 14, fontWeight: 500, border: "none",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1, marginTop: 4,
          }}>
            {loading ? (tab === 'login' ? "로그인 중..." : "가입 중...") : (tab === 'login' ? "로그인" : "시작하기")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.25rem", fontSize: 13, color: "var(--text-secondary)" }}>
          {tab === 'login' ? (
            <>계정이 없으신가요?{" "}
              <button onClick={() => setTab('signup')} style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontSize: 13 }}>회원가입</button>
            </>
          ) : (
            <>이미 계정이 있으신가요?{" "}
              <button onClick={() => setTab('login')} style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontSize: 13 }}>로그인</button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, calc(-50% + 12px)) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid var(--border)", background: "var(--bg)",
  fontSize: 14, color: "var(--text-primary)", outline: "none",
  boxSizing: "border-box",
};
