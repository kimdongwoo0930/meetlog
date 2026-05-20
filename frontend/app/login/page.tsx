'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, userApi } from "@/src/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { accessToken, refreshToken } = await authApi.login(email, password);
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("userEmail", email);

      // 이름 가져와서 저장
      try {
        const me = await userApi.me();
        localStorage.setItem("userName", me.name);
      } catch {
        localStorage.setItem("userName", email.split("@")[0]);
      }

      router.push("/meetings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "이메일 또는 비밀번호가 올바르지 않습니다.");
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
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>로그인</h1>
        <p style={{ fontSize: 13.5, color: "var(--text-secondary)", marginBottom: "1.75rem" }}>
          계정에 로그인하세요
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              placeholder="••••••••" required
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
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: 13, color: "var(--text-secondary)" }}>
          계정이 없으신가요?{" "}
          <Link href="/signup" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>회원가입</Link>
        </div>
      </div>
    </div>
  );
}
