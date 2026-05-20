'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/src/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { accessToken, refreshToken } = await authApi.register(email, password, name);
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userName", name);
      router.push("/meetings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "2rem",
    }}>
      <Link href="/" style={{
        fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
        fontSize: 24, color: "var(--text-primary)", textDecoration: "none",
        marginBottom: "2.5rem",
      }}>
        Meet<span style={{ color: "var(--accent)" }}>Log</span>
      </Link>

      <div style={{
        width: "100%", maxWidth: 400,
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 14, padding: "2rem",
        boxShadow: "0 4px 40px rgba(0,0,0,0.06)",
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>회원가입</h1>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: "1.75rem" }}>
          새 계정을 만드세요
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>이름</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="홍길동" required
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--bg)",
                fontSize: 14, color: "var(--text-primary)", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>이메일</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com" required
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--bg)",
                fontSize: 14, color: "var(--text-primary)", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", display: "block", marginBottom: 6 }}>비밀번호</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required minLength={6}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--bg)",
                fontSize: 14, color: "var(--text-primary)", outline: "none",
                boxSizing: "border-box",
              }}
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
            fontSize: 14, fontWeight: 500, border: "none", cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1, marginTop: 4,
          }}>
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: 13, color: "var(--text-secondary)" }}>
          이미 계정이 있으신가요?{" "}
          <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>로그인</Link>
        </div>
      </div>
    </div>
  );
}
