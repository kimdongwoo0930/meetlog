'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { meetingsApi, userApi, participantApi, type UserSummary } from "@/src/lib/api";

const MEETING_TYPES = ["스프린트", "기획", "데일리", "회고", "기타"];

export default function NewMeetingPage() {
  const router = useRouter();

  // 기본 정보
  const [title, setTitle] = useState("");
  const [meetingType, setMeetingType] = useState("스프린트");
  const [customType, setCustomType] = useState("");

  // AI 컨텍스트
  const [goal, setGoal] = useState("");
  const [agenda, setAgenda] = useState("");

  // 참여자
  const [emailInput, setEmailInput] = useState("");
  const [participants, setParticipants] = useState<UserSummary[]>([]);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  // 회의 설정
  const [recording, setRecording] = useState(true);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(10);

  // 제출
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectType = (t: string) => {
    setMeetingType(t);
    if (t !== "기타") setCustomType("");
  };

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
      for (const p of participants) {
        await participantApi.add(meeting.id, p.email).catch(() => null);
      }
      router.push(`/meetings/${meeting.id}/room`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "회의 생성에 실패했습니다.");
      setLoading(false);
    }
  };

  const avatarColors = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#ef4444"];

  return (
    <>
      {/* 상단 헤더 */}
      <div style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "0 28px", height: 52,
        display: "flex", alignItems: "center",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>새 회의 시작</div>
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "28px 24px 48px" }}>
      <div style={{ width: "100%", maxWidth: 588 }}>
        <form onSubmit={handleSubmit}>
          {/* 폼 헤더 */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 20, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 4px" }}>회의 만들기</p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>회의 정보를 입력하면 AI가 자동으로 회의록을 생성합니다</p>
          </div>

          {/* ── 카드 1: 기본 정보 ── */}
          <Card title="기본 정보">
            <Field label="회의 제목" required>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="예: 개발팀 주간 스프린트 회의"
                autoFocus
                style={inputStyle}
              />
            </Field>

            <Field label="회의 유형">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {MEETING_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => selectType(t)}
                    style={{
                      fontSize: 12, padding: "4px 10px", borderRadius: 999, cursor: "pointer",
                      border: meetingType === t ? "0.5px solid #93C5FD" : "0.5px solid var(--border)",
                      background: meetingType === t ? "#EFF4FF" : "transparent",
                      color: meetingType === t ? "#1E40AF" : "var(--text-secondary)",
                      transition: "all 0.15s",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {meetingType === "기타" && (
                <input
                  type="text"
                  value={customType}
                  onChange={e => setCustomType(e.target.value)}
                  placeholder="회의 유형을 직접 입력하세요"
                  style={{ ...inputStyle, marginTop: 8 }}
                  autoFocus
                />
              )}
            </Field>
          </Card>

          {/* ── 카드 2: AI 컨텍스트 ── */}
          <Card title="AI 분석 컨텍스트">
            <Field label="회의 목표" hint="AI가 핵심 결정사항을 더 정확하게 추출합니다">
              <input
                type="text"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="예: JWT 인증 방식 최종 결정, API 명세 확인"
                style={inputStyle}
              />
            </Field>

            <Field label="사전 안건" hint="안건을 미리 입력하면 AI 회의록 품질이 향상됩니다">
              <textarea
                value={agenda}
                onChange={e => setAgenda(e.target.value)}
                placeholder={"논의할 주제를 미리 작성해두세요\n예: 1. 로그인 방식 결정\n     2. 배포 환경 확인"}
                style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
              />
            </Field>
          </Card>

          {/* ── 카드 3: 참여자 ── */}
          <Card title="참여자">
            <Field label="이메일로 초대">
              <div style={{ display: "flex", gap: 8, marginTop: 0 }}>
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); setSearchError(""); }}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddParticipant())}
                  placeholder="team@example.com"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddParticipant}
                  disabled={!emailInput.trim() || searching}
                  style={{
                    padding: "0 16px", fontSize: 13, borderRadius: 7,
                    border: "0.5px solid var(--border)",
                    background: "transparent", cursor: "pointer",
                    whiteSpace: "nowrap", color: "var(--text-primary)",
                    opacity: !emailInput.trim() || searching ? 0.5 : 1,
                  }}
                >
                  {searching ? "검색 중..." : "+ 추가"}
                </button>
              </div>
              {searchError && (
                <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{searchError}</div>
              )}
              {participants.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {participants.map((p, i) => (
                    <div key={p.email} style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 12, padding: "3px 8px 3px 6px", borderRadius: 999,
                      background: "var(--bg)", border: "0.5px solid var(--border)",
                      color: "var(--text-primary)",
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                        background: avatarColors[i % avatarColors.length], color: "#fff",
                        fontSize: 9, fontWeight: 500,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {p.name.slice(0, 1)}
                      </div>
                      {p.name}
                      <button
                        type="button"
                        onClick={() => setParticipants(prev => prev.filter(x => x.email !== p.email))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 0, lineHeight: 1, fontSize: 14 }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </Field>
          </Card>

          {/* ── 카드 4: 회의 설정 ── */}
          <Card title="회의 설정">
            {/* 녹음 여부 */}
            <ToggleRow
              icon="🎙"
              label="녹음 여부"
              desc="회의 음성을 녹음하여 AI가 STT 변환합니다"
              checked={recording}
              onChange={setRecording}
            />

            {!recording && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "10px 12px", borderRadius: 7, marginBottom: 4,
                background: "#FEF9C3", border: "0.5px solid #FDE047",
              }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M8 1.5L1 13.5h14L8 1.5Z" stroke="#CA8A04" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M8 6v3.5" stroke="#CA8A04" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="8" cy="11.5" r="0.6" fill="#CA8A04"/>
                </svg>
                <p style={{ fontSize: 12.5, color: "#92400E", margin: 0, lineHeight: 1.5 }}>
                  녹음을 사용하지 않으면 <strong>회의 종료 후 회의록을 제공받을 수 없습니다.</strong>
                </p>
              </div>
            )}

            {/* 비밀번호 */}
            <ToggleRow
              icon="🔒"
              label="비밀번호 설정"
              desc="외부 참여자 접근을 제한합니다"
              checked={usePassword}
              onChange={setUsePassword}
            />

            {usePassword && (
              <div style={{ paddingBottom: 12, borderBottom: "0.5px solid var(--border)" }}>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="비밀번호 입력"
                    style={{ ...inputStyle, paddingRight: 36 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--text-tertiary)", fontSize: 16, padding: 0, lineHeight: 1,
                    }}
                    aria-label="비밀번호 표시"
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
            )}

            {/* 최대 참여 인원 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12 }}>
              <div>
                <p style={{ fontSize: 14, color: "var(--text-primary)", margin: "0 0 2px" }}>
                  <span style={{ fontSize: 15, verticalAlign: -2, marginRight: 6 }}>👥</span>최대 참여 인원
                </p>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>초과 시 입장이 제한됩니다</p>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setMaxParticipants(v => Math.max(2, v - 1))}
                  style={numBtnStyle("left")}
                >−</button>
                <div style={{
                  width: 52, height: 36, textAlign: "center", lineHeight: "36px",
                  fontSize: 14, fontWeight: 500, color: "var(--text-primary)",
                  borderTop: "0.5px solid var(--border)", borderBottom: "0.5px solid var(--border)",
                  background: "var(--surface)",
                }}>
                  {maxParticipants}
                </div>
                <button
                  type="button"
                  onClick={() => setMaxParticipants(v => Math.min(50, v + 1))}
                  style={numBtnStyle("right")}
                >+</button>
              </div>
            </div>
          </Card>

          {error && (
            <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 12 }}>{error}</div>
          )}

          {/* 버튼 행 */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: "9px 20px", fontSize: 14, borderRadius: 7,
                border: "0.5px solid var(--border)", background: "transparent",
                color: "var(--text-secondary)", cursor: "pointer",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              style={{
                padding: "9px 24px", fontSize: 14, fontWeight: 500, borderRadius: 7,
                border: "none", background: title.trim() && !loading ? "#2563eb" : "var(--border)",
                color: title.trim() && !loading ? "#fff" : "var(--text-tertiary)",
                cursor: title.trim() && !loading ? "pointer" : "default",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10l5 2-5 2M4 12h11M15 6a9 9 0 0 1 0 12"/>
              </svg>
              {loading ? "생성 중..." : "회의 시작"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </>
  );
}

// ── 공통 스타일 상수 ──

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 12px",
  borderRadius: 7,
  border: "0.5px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text-primary)",
  fontSize: 14,
  outline: "none",
};

function numBtnStyle(side: "left" | "right"): React.CSSProperties {
  return {
    width: 36, height: 36,
    border: "0.5px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text-primary)",
    fontSize: 16,
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: side === "left" ? "7px 0 0 7px" : "0 7px 7px 0",
  };
}

// ── 서브 컴포넌트 ──

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "0.5px solid var(--border)",
      borderRadius: 12,
      padding: "20px 20px 4px",
      marginBottom: 12,
    }}>
      <p style={{
        fontSize: 11, fontWeight: 500, color: "var(--text-tertiary)",
        margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.06em",
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Field({ label, required, hint, children }: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: "4px 0 0" }}>{hint}</p>}
    </div>
  );
}

function ToggleRow({ icon, label, desc, checked, onChange }: {
  icon: string;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = `toggle-${label}`;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 0", borderBottom: "0.5px solid var(--border)",
    }}>
      <div>
        <p style={{ fontSize: 14, color: "var(--text-primary)", margin: "0 0 2px" }}>
          <span style={{ marginRight: 6 }}>{icon}</span>{label}
        </p>
        <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>{desc}</p>
      </div>
      <label htmlFor={id} style={{ position: "relative", width: 40, height: 22, flexShrink: 0, cursor: "pointer" }}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
        />
        <span style={{
          position: "absolute", inset: 0, borderRadius: 11,
          background: checked ? "#2563eb" : "var(--border)",
          transition: "background 0.2s",
        }} />
        <span style={{
          position: "absolute",
          width: 16, height: 16,
          left: checked ? 21 : 3,
          top: 3,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </label>
    </div>
  );
}
