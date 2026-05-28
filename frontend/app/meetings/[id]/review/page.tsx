'use client';

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { meetingsApi, participantApi, aiApi, type UserSummary } from "@/src/lib/api";

type Segment = {
  id: string;
  speaker: string;
  content: string;
  startTime: number;
  endTime: number;
  createdAt: string;
};

function formatSeconds(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [meetingTitle, setMeetingTitle] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [participants, setParticipants] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  useEffect(() => {
    Promise.all([
      meetingsApi.get(id),
      meetingsApi.getSegments(id),
      participantApi.list(id),
    ]).then(([meeting, segs, parts]) => {
      setMeetingTitle(meeting.title);
      setSegments(segs as Segment[]);
      setParticipants(parts);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const speakerName = (email: string) =>
    participants.find(p => p.email === email)?.name ?? email.split('@')[0];

  const handleEditStart = (seg: Segment) => {
    setEditingId(seg.id);
    setEditContent(seg.content);
  };

  const handleEditSave = async (seg: Segment) => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === seg.content) { setEditingId(null); return; }
    try {
      await meetingsApi.updateSegment(id, seg.id, trimmed);
      setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, content: trimmed } : s));
    } catch {}
    setEditingId(null);
  };

  const handleDelete = async (segId: string) => {
    try {
      await meetingsApi.deleteSegment(id, segId);
      setSegments(prev => prev.filter(s => s.id !== segId));
    } catch {}
  };

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setGenerateError("");
    try {
      await meetingsApi.updateStatus(id, "GENERATING");
      const transcript = segments
        .map(s => `[${speakerName(s.speaker)}] ${s.content}`)
        .join('\n');
      await aiApi.analyze(id, transcript);
      await meetingsApi.updateStatus(id, "COMPLETED");
      router.push(`/meetings/${id}`);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "회의록 생성에 실패했습니다.");
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f9f8f6", color: "#6b6760", fontSize: 14 }}>
        불러오는 중...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9f8f6", display: "flex", flexDirection: "column" }}>
      {/* 헤더 */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e8e5de",
        padding: "0 32px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push('/meetings')}
            style={{
              padding: "6px 14px", fontSize: 13, borderRadius: 7,
              border: "1px solid #e8e5de", background: "transparent",
              color: "#6b6760", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}
          >
            <svg viewBox="0 0 12 12" fill="none" width="11" height="11">
              <path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            목록으로
          </button>
          <div style={{ width: 1, height: 18, background: "#e8e5de" }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1916" }}>STT 검토</div>
            <div style={{ fontSize: 12, color: "#6b6760", marginTop: 1 }}>{meetingTitle}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#a8a49e" }}>총 {segments.length}개 발화</div>
          {generateError && (
            <div style={{ fontSize: 12.5, color: "#ef4444" }}>{generateError}</div>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              padding: "9px 22px", fontSize: 14, fontWeight: 600, borderRadius: 8,
              border: "none", cursor: generating ? "default" : "pointer",
              background: generating ? "#e8e5de" : "#2563eb",
              color: generating ? "#a8a49e" : "#fff",
              display: "inline-flex", alignItems: "center", gap: 7,
              transition: "all 0.15s",
            }}
          >
            {generating ? (
              <>
                <svg viewBox="0 0 16 16" fill="none" width="14" height="14" style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20 10" />
                </svg>
                생성 중...
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                  <path d="M8 2l1.5 4.5H14l-3.5 2.5 1.5 4.5L8 11l-4 2.5 1.5-4.5L2 6.5h4.5L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                </svg>
                회의록 생성
              </>
            )}
          </button>
        </div>
      </div>

      {/* 안내 배너 */}
      <div style={{
        background: "#eff6ff", borderBottom: "1px solid #bfdbfe",
        padding: "12px 32px", fontSize: 13, color: "#1d4ed8",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <svg viewBox="0 0 16 16" fill="none" width="14" height="14" style={{ flexShrink: 0 }}>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        AI 회의록 생성 전에 STT 내용을 검토하세요. 잘못 인식된 내용을 수정하면 회의록 품질이 향상됩니다.
      </div>

      {/* 세그먼트 목록 */}
      <div style={{ flex: 1, maxWidth: 800, width: "100%", margin: "0 auto", padding: "28px 32px 60px" }}>
        {segments.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 0",
            color: "#a8a49e", fontSize: 14,
          }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>🎙</div>
            저장된 STT 데이터가 없습니다.<br />
            <span style={{ fontSize: 13 }}>회의록 생성을 눌러 빈 회의록을 만들 수 있습니다.</span>
          </div>
        ) : (
          <div style={{
            background: "#fff", border: "1px solid #e8e5de",
            borderRadius: 12, overflow: "hidden",
            boxShadow: "0 4px 40px rgba(0,0,0,0.06)",
          }}>
            {segments.map((seg, idx) => {
              const name = speakerName(seg.speaker);
              const isEditing = editingId === seg.id;
              const isLast = idx === segments.length - 1;
              return (
                <div
                  key={seg.id}
                  style={{
                    display: "flex", gap: 14, padding: "16px 20px",
                    borderBottom: isLast ? "none" : "1px solid #e8e5de",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = "#fafaf9"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  {/* 타임스탬프 */}
                  <div style={{ width: 40, flexShrink: 0, paddingTop: 3 }}>
                    <div style={{ fontSize: 11.5, color: "#a8a49e", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {formatSeconds(seg.startTime)}
                    </div>
                  </div>

                  {/* 아바타 */}
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#fff",
                  }}>
                    {name.slice(0, 1)}
                  </div>

                  {/* 내용 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1916", marginBottom: 5 }}>
                      {name}
                    </div>
                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <textarea
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSave(seg); }
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          rows={3}
                          style={{
                            width: "100%", padding: "8px 10px", borderRadius: 7,
                            border: "1px solid #2563eb", background: "#f8faff",
                            color: "#1a1916", fontSize: 14, resize: "vertical",
                            outline: "none", lineHeight: 1.65, boxSizing: "border-box",
                          }}
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => handleEditSave(seg)}
                            style={{
                              padding: "5px 14px", borderRadius: 6, border: "none",
                              background: "#2563eb", color: "#fff", fontSize: 12.5,
                              fontWeight: 500, cursor: "pointer",
                            }}
                          >저장</button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{
                              padding: "5px 14px", borderRadius: 6,
                              border: "1px solid #e8e5de", background: "transparent",
                              color: "#6b6760", fontSize: 12.5, cursor: "pointer",
                            }}
                          >취소</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 14, color: "#6b6760", lineHeight: 1.7 }}>
                        {seg.content}
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  {!isEditing && (
                    <div style={{ display: "flex", gap: 5, flexShrink: 0, paddingTop: 2 }}>
                      <button
                        onClick={() => handleEditStart(seg)}
                        title="수정"
                        style={{
                          padding: "4px 10px", borderRadius: 6, fontSize: 12,
                          border: "1px solid #e8e5de", background: "transparent",
                          color: "#6b6760", cursor: "pointer",
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}
                      >
                        <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
                          <path d="M8 2l2 2-6 6H2v-2L8 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                        </svg>
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(seg.id)}
                        title="삭제"
                        style={{
                          padding: "4px 10px", borderRadius: 6, fontSize: 12,
                          border: "1px solid #fecaca", background: "#fef2f2",
                          color: "#ef4444", cursor: "pointer",
                          display: "inline-flex", alignItems: "center", gap: 4,
                        }}
                      >
                        <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
                          <path d="M2 3h8M5 3V2h2v1M4 3v6h4V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
