'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/src/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("access_token"));
  }, []);

  const handleStartMeeting = () => {
    if (isLoggedIn) {
      router.push("/meetings/new");
    } else {
      router.push("/login");
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setIsLoggedIn(false);
  };

  return (
    <div style={{ background: "var(--bg)", color: "var(--text-primary)", fontSize: 15, lineHeight: 1.6 }}>
      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(249,248,246,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)", padding: "0 2rem",
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          fontSize: 20, color: "var(--text-primary)",
        }}>
          Meet<span style={{ color: "var(--accent)" }}>Log</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              style={{ fontSize: 13.5, color: "var(--text-secondary)", background: "transparent", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}
            >
              로그아웃
            </button>
          ) : (
            <>
              <Link href="/login" style={{ fontSize: 13.5, color: "var(--text-secondary)", background: "transparent", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: 6, cursor: "pointer", textDecoration: "none" }}>
                로그인
              </Link>
              <Link href="/signup" style={{ fontSize: 13.5, fontWeight: 500, color: "#fff", background: "var(--text-primary)", padding: "7px 16px", borderRadius: 7, border: "none", cursor: "pointer", textDecoration: "none" }}>
                시작하기
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px 2rem 80px", textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: 900, height: 600,
          background: "radial-gradient(ellipse at center, #dbeafe 0%, transparent 65%)",
          opacity: 0.5, pointerEvents: "none",
        }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "var(--accent-light)", border: "1px solid var(--accent-border)",
          color: "var(--accent)", fontSize: 12.5, fontWeight: 500,
          padding: "5px 12px", borderRadius: 999, marginBottom: "2rem",
          animation: "fadeUp 0.5s ease both",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: "pulse 2s ease infinite", display: "inline-block" }} />
          AI 기반 자동 회의록 플랫폼
        </div>

        <h1 style={{
          fontFamily: "'Pretendard Variable', Pretendard, sans-serif",
          fontSize: "clamp(42px, 7vw, 76px)", lineHeight: 1.08,
          letterSpacing: "-0.02em", color: "var(--text-primary)",
          maxWidth: 760, animation: "fadeUp 0.5s 0.1s ease both",
        }}>
          회의는 하고,<br /><em style={{ fontStyle: "italic", color: "var(--accent)" }}>정리는 AI가</em>
        </h1>

        <p style={{
          marginTop: "1.25rem", fontSize: 17, color: "var(--text-secondary)",
          maxWidth: 500, lineHeight: 1.7, animation: "fadeUp 0.5s 0.2s ease both",
        }}>
          실시간 음성 회의를 녹음하고, AI가 요약·결정사항·할 일을 자동으로 구조화합니다.
        </p>

        <div style={{
          marginTop: "2.5rem", display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap",
          animation: "fadeUp 0.5s 0.3s ease both",
        }}>
          <button onClick={handleStartMeeting} style={{
            background: "var(--text-primary)", color: "#fff",
            fontSize: 14, fontWeight: 500, padding: "11px 24px", borderRadius: 8,
            border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            회의 시작하기
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          {isLoggedIn && (
            <Link href="/meetings" style={{
              background: "var(--surface)", color: "var(--text-primary)",
              fontSize: 14, fontWeight: 500, padding: "11px 24px", borderRadius: 8,
              border: "1px solid var(--border)", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none",
            }}>
              회의 목록 보기
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7h10M2 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </Link>
          )}
        </div>

        {/* DEMO CARD */}
        <div style={{
          marginTop: "4rem", width: "100%", maxWidth: 820,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 16, overflow: "hidden",
          boxShadow: "0 4px 40px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          animation: "fadeUp 0.6s 0.4s ease both",
        }}>
          <div style={{
            background: "#f4f3f0", borderBottom: "1px solid var(--border)",
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#ff5f57", "#febc2e", "#28c840"].map(c => (
                <span key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginLeft: 4 }}>MeetLog — 개발팀 주간 회의</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: 24, borderRight: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>실시간 회의 내용</div>
              <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.75 }}>
                {[
                  { speaker: "동우", text: "이번 스프린트에서 로그인 기능을 구현해야 할 것 같아요." },
                  { speaker: "민수", text: "JWT 방식이 좋을 것 같은데, 세션 관리가 편리하니까요." },
                  { speaker: "동우", text: "동의해요. 그러면 프론트는 Next.js, 백엔드는 Spring Boot로 확정하죠." },
                  { speaker: "민수", text: "이메일 인증 기능도 추가할지 논의가 필요할 것 같아요." },
                  { speaker: "동우", text: "다음 회의에서 API 명세도 같이 확정합시다." },
                ].map((line, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{line.speaker}</span>: {line.text}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-tertiary)", marginBottom: 12 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1"/><path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                AI 자동 분석 완료
              </div>
              {[
                { label: "📋 회의 요약", content: "로그인 기능 구현 방향 및 기술 스택 결정" },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", marginBottom: 5 }}>{item.label}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>{item.content}</div>
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", marginBottom: 5 }}>✅ 결정사항</div>
                <div>
                  {["JWT 인증", "Next.js", "Spring Boot"].map(tag => (
                    <span key={tag} style={{ display: "inline-block", background: "var(--green-light)", color: "var(--green)", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4, marginRight: 4, marginBottom: 4 }}>{tag}</span>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", marginBottom: 5 }}>🔨 할 일</div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>동우: 로그인 API 구현<br />민수: 로그인 UI 제작</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", marginBottom: 5 }}>❓ 미결 사항</div>
                <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>이메일 인증 기능 추가 여부</div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 1100, margin: "0 auto", padding: "6rem 2rem" }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "1rem" }}>주요 기능</div>
        <h2 style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif", fontSize: "clamp(30px, 4vw, 44px)", lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--text-primary)", maxWidth: 520, marginBottom: "1rem" }}>회의의 모든 순간을<br />놓치지 않습니다</h2>
        <p style={{ fontSize: 15.5, color: "var(--text-secondary)", maxWidth: 460, lineHeight: 1.7, marginBottom: "3rem" }}>실시간 음성 통신부터 AI 분석까지, 회의의 전 과정을 MeetLog가 처리합니다.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          {[
            { icon: "🎙", title: "실시간 음성 회의", desc: "WebRTC 기반의 고품질 실시간 음성 통신. 회의방 생성, 참여, 화면 공유까지 지원합니다." },
            { icon: "🤖", title: "AI 자동 분석", desc: "Whisper STT와 LLM이 회의 내용을 자동으로 요약하고 핵심만 추출합니다." },
            { icon: "📝", title: "구조화된 회의록", desc: "요약, 결정사항, 할 일, 질문, 다음 안건을 체계적으로 정리해 즉시 공유할 수 있습니다." },
            { icon: "✅", title: "액션 아이템 추적", desc: "담당자별 할 일을 자동으로 분류하고, 팀 전체가 진행 상황을 확인할 수 있습니다." },
            { icon: "👥", title: "참여자 관리", desc: "회의 참여자를 관리하고, 각자의 발언과 할 일을 개인별로 추적합니다." },
            { icon: "🔍", title: "회의 검색 (예정)", desc: "지난 회의 내용을 키워드로 빠르게 검색하고, 관련 결정사항을 찾을 수 있습니다." },
          ].map(feat => (
            <div key={feat.title} style={{ background: "var(--surface)", padding: "2rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: "1rem" }}>{feat.icon}</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>{feat.title}</div>
              <div style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>{feat.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ background: "var(--text-primary)", padding: "6rem 2rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b8cff", marginBottom: "1rem" }}>작동 방식</div>
          <h2 style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif", fontSize: "clamp(30px, 4vw, 44px)", lineHeight: 1.15, letterSpacing: "-0.02em", color: "#fff", maxWidth: 520, marginBottom: "1rem" }}>5단계로 완성되는<br />자동 회의록</h2>
          <p style={{ fontSize: 15.5, color: "rgba(255,255,255,0.55)", maxWidth: 460, lineHeight: 1.7, marginBottom: "3rem" }}>회의가 끝나면 AI가 자동으로 처리합니다. 별도의 작업이 필요 없습니다.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", position: "relative" }}>
            <div style={{ position: "absolute", top: 20, left: "10%", right: "10%", height: 1, background: "rgba(255,255,255,0.1)" }} />
            {[
              { num: 1, title: "음성 녹음", desc: "WebRTC로 실시간 회의 음성을 녹음", active: true },
              { num: 2, title: "음성 분할", desc: "긴 회의를 구간별로 자동 분할" },
              { num: 3, title: "STT 변환", desc: "Whisper로 텍스트 변환" },
              { num: 4, title: "LLM 분석", desc: "Qwen / Llama로 내용 분석 및 요약" },
              { num: 5, title: "회의록 생성", desc: "구조화된 회의록 즉시 제공" },
            ].map(step => (
              <div key={step.num} style={{ padding: "0 1rem", textAlign: "center" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  border: `1px solid ${step.active ? "var(--accent)" : "rgba(255,255,255,0.15)"}`,
                  background: step.active ? "var(--accent)" : "rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 600, color: step.active ? "#fff" : "rgba(255,255,255,0.5)",
                  margin: "0 auto 1rem", position: "relative", zIndex: 1,
                }}>{step.num}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: "0.4rem" }}>{step.title}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* FOOTER */}
      <footer style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "'Pretendard Variable', Pretendard, sans-serif", fontSize: 17, color: "var(--text-primary)" }}>Meet<span style={{ color: "var(--accent)" }}>Log</span></div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {[
            { label: "GitHub", href: "https://github.com/kimdongwoo0930" },
            { label: "Velog", href: "https://velog.io/@kimdongwoo0930" },
            { label: "개인정보처리방침", href: "#" },
          ].map(link => (
            <a key={link.label} href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--text-tertiary)", textDecoration: "none" }}>{link.label}</a>
          ))}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>© 2025 김동우. All rights reserved.</div>
      </footer>
    </div>
  );
}
