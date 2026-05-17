'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useWebRTC } from '@/src/hooks/useWebRTC';
import { participantApi, meetingsApi, type UserSummary } from '@/src/lib/api';
import { useRouter, useParams } from 'next/navigation';

type TranscriptItem = {
  id: number;
  speaker: string;
  content: string;
  startTime: number;
  endTime: number;
  createdAt: string;
};


const DARK = {
  bg: "#111110", surface: "#1c1c1a", surface2: "#242422",
  border: "rgba(255,255,255,0.08)", borderHover: "rgba(255,255,255,0.14)",
  textPrimary: "#f0ede8", textSecondary: "rgba(240,237,232,0.55)", textTertiary: "rgba(240,237,232,0.3)",
  accent: "#3b82f6", accentDim: "rgba(59,130,246,0.15)", accentBorder: "rgba(59,130,246,0.3)",
  green: "#22c55e", greenDim: "rgba(34,197,94,0.12)",
  red: "#ef4444", redDim: "rgba(239,68,68,0.15)",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

function VideoTile({ label, isMe, isMuted, isCameraOff, videoRef, muted }: {
  label: string; isMe?: boolean; isMuted?: boolean; isCameraOff?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>; muted?: boolean;
}) {
  return (
    <div style={{
      background: DARK.surface,
      border: `1px solid ${isMe ? DARK.accentBorder : DARK.border}`,
      borderRadius: 12, position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0,
    }}>
      {videoRef && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: isCameraOff ? "none" : "block" }}
        />
      )}
      {isCameraOff && (
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600, color: "#fff" }}>
          {label.slice(0, 1)}
        </div>
      )}
      <div style={{ position: "absolute", bottom: 10, left: 12, right: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: "#fff", background: "rgba(0,0,0,0.45)", padding: "3px 8px", borderRadius: 5, backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 5 }}>
          {label}
          {isMe && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.1)", padding: "1px 5px", borderRadius: 3 }}>나</span>}
        </div>
        {isMuted && (
          <div style={{ width: 22, height: 22, borderRadius: 5, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 12 12" fill="none" width="11" height="11" style={{ color: DARK.red }}>
              <path d="M6 1a2 2 0 0 1 2 2v3a2 2 0 0 1-4 0V3a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

function RemoteVideoTile({ peerId, stream }: { peerId: string; stream: MediaStream | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);
  const initial = peerId.slice(0, 1).toUpperCase();
  return (
    <div style={{
      background: DARK.surface, border: `1px solid ${DARK.border}`,
      borderRadius: 12, position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0,
    }}>
      {stream
        ? <video ref={videoRef} autoPlay playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#0d9488)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600, color: "#fff" }}>{initial}</div>
      }
      <div style={{ position: "absolute", bottom: 10, left: 12, fontSize: 12.5, fontWeight: 500, color: "#fff", background: "rgba(0,0,0,0.45)", padding: "3px 8px", borderRadius: 5, backdropFilter: "blur(4px)" }}>
        {peerId}
      </div>
    </div>
  );
}

function formatSeconds(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function MeetingRoomPage() {
  const routeParams = useParams();
  const id = routeParams.id as string;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'transcript' | 'ai' | 'participants'>('transcript');
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [hostEmail, setHostEmail] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);

  // WebRTC
  const myId = typeof window !== 'undefined' ? (localStorage.getItem('userEmail') ?? 'anonymous') : 'anonymous';
  const { localStream, remoteStreams, isReady, toggleMic, toggleCamera } = useWebRTC(id, myId);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // WebSocket 상태
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // 음성인식 상태
  const [isListening, setIsListening] = useState(false);

  // 참여자 목록
  const [participants, setParticipants] = useState<UserSummary[]>([]);
  const myEmail = typeof window !== 'undefined' ? (localStorage.getItem('userEmail') ?? '') : '';

  // 참여자 초대
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    setInviteResult(null);
    try {
      const user = await participantApi.add(id, email);
      setInviteResult({ type: 'success', message: `${user.name}님을 초대했습니다.` });
      setInviteEmail("");
      loadParticipants();
    } catch (err) {
      setInviteResult({ type: 'error', message: err instanceof Error ? err.message : "초대에 실패했습니다." });
    } finally {
      setInviting(false);
    }
  };
  const stompRef = useRef<Client | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const segmentTimeRef = useRef(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // 로컬 스트림 → video 엘리먼트 연결
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // 타이머
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // 자막 스크롤
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // 참여자 목록 로드 (초대 후에도 갱신)
  const loadParticipants = useCallback(() => {
    participantApi.list(id).then(setParticipants).catch(() => {});
  }, [id]);

  useEffect(() => { loadParticipants(); }, [loadParticipants]);

  // 입장 시 완료된 회의면 회의록으로 리다이렉트
  useEffect(() => {
    meetingsApi.get(id).then(meeting => {
      if (meeting.status === 'COMPLETED') {
        router.replace(`/meetings/${id}`);
      }
    }).catch(() => {});
  }, [id, router]);

  // 회의 종료 (호스트 전용)
  const handleEndMeeting = async () => {
    if (!isHost || ending) return;
    setEnding(true);
    try {
      await meetingsApi.updateStatus(id, "COMPLETED");
      if (stompRef.current?.connected) {
        stompRef.current.publish({
          destination: `/app/meetings/${id}/signal`,
          body: JSON.stringify({ type: 'meeting-ended', from: 'host', to: null, payload: null }),
        });
      }
    } catch {
      setEnding(false);
      return;
    }
    router.push(`/meetings/${id}`);
  };

  // STOMP WebSocket 연결
  useEffect(() => {
    // 호스트 여부 확인 (생성자 == 현재 유저)
    meetingsApi.get(id).then(meeting => {
      setHostEmail(meeting.hostUserEmail);
      const myEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
      if (myEmail && meeting.hostUserEmail === myEmail) setIsHost(true);
    }).catch(() => {});

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_URL}/ws`),
      reconnectDelay: 3000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/meetings/${id}/transcript`, (message) => {
          const segment: TranscriptItem = JSON.parse(message.body);
          setTranscripts(prev => [...prev, segment]);
        });
        // 회의 종료 신호 수신
        client.subscribe(`/topic/meetings/${id}/signal`, (message) => {
          const signal = JSON.parse(message.body);
          if (signal.type === 'meeting-ended') {
            router.push(`/meetings/${id}`);
          }
        });
      },
      onDisconnect: () => setIsConnected(false),
    });

    stompRef.current = client;
    client.activate();
    return () => { client.deactivate(); };
  }, [id]);

  // 음성인식 시작
  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      const text = event.results[event.results.length - 1][0].transcript.trim();
      if (!text) return;

      const startTime = segmentTimeRef.current;
      const endTime = startTime + 3;
      segmentTimeRef.current = endTime;

      await fetch(`${API_URL}/api/meetings/${id}/segments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') ?? ''}`,
        },
        body: JSON.stringify({ speaker: '나', content: text, startTime, endTime }),
      }).catch(() => null);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      // continuous 모드가 끊기면 재시작
      if (isListening) recognition.start();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [id, isListening]);

  // 음성인식 중지
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const handleToggleMic = () => {
    toggleMic();
    if (!isMuted) stopListening(); else startListening();
    setIsMuted(v => !v);
  };

  const handleToggleCamera = () => {
    toggleCamera();
    setIsCameraOff(v => !v);
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: DARK.bg, color: DARK.textPrimary, fontSize: 14, lineHeight: 1.5,
      overflow: "hidden",
    }}>
      {/* TOPBAR */}
      <div style={{
        height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", background: DARK.surface, borderBottom: `1px solid ${DARK.border}`,
        flexShrink: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontFamily: "var(--font-instrument-serif), serif", fontSize: 17, color: DARK.textPrimary }}>
            Meet<span style={{ color: "#6b8cff" }}>Log</span>
          </div>
          <div style={{ width: 1, height: 18, background: DARK.border }} />
          <div style={{ fontSize: 13.5, fontWeight: 500, color: DARK.textPrimary }}>AI 모델 파인튜닝 논의</div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: DARK.redDim, border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 999, padding: "3px 10px", fontSize: 11.5, fontWeight: 600, color: DARK.red,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: DARK.red, display: "inline-block", animation: "blink 1.2s ease infinite" }} />
            REC
          </div>
          {/* WebSocket 연결 상태 */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: isConnected ? DARK.greenDim : "rgba(239,68,68,0.1)",
            border: `1px solid ${isConnected ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
            borderRadius: 999, padding: "3px 10px", fontSize: 11.5, fontWeight: 600,
            color: isConnected ? DARK.green : DARK.red,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: isConnected ? DARK.green : DARK.red, display: "inline-block" }} />
            {isConnected ? "연결됨" : "연결 중..."}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: DARK.textSecondary, fontVariantNumeric: "tabular-nums" }}>
            {formatTime(seconds)}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: DARK.textSecondary,
            background: DARK.surface2, border: `1px solid ${DARK.border}`, padding: "4px 10px", borderRadius: 6,
          }}>
            <svg viewBox="0 0 13 13" fill="none" width="13" height="13"><circle cx="5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 11c0-2 1.6-3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="9.5" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8.5 11c0-1.7 1-3 2.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            5명 참여 중
          </div>
          {isHost ? (
            <button
              onClick={handleEndMeeting}
              disabled={ending}
              style={{
                background: DARK.red, border: `1px solid ${DARK.red}`,
                color: "#fff", fontSize: 13, fontWeight: 600,
                padding: "6px 16px", borderRadius: 7, cursor: "pointer",
                opacity: ending ? 0.6 : 1, display: "inline-flex", alignItems: "center", gap: 6,
              }}>
              <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {ending ? "종료 중..." : "회의 종료"}
            </button>
          ) : (
            <Link href="/meetings" style={{
              background: DARK.surface2, border: `1px solid ${DARK.border}`,
              color: DARK.textSecondary, fontSize: 13, fontWeight: 500,
              padding: "6px 14px", borderRadius: 7, cursor: "pointer", textDecoration: "none",
            }}>나가기</Link>
          )}
        </div>
      </div>

      {/* ROOM LAYOUT */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* VIDEO AREA */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, gap: 12, overflow: "hidden" }}>
          {/* VIDEO GRID */}
          <div style={{
            flex: 1, display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 1fr)",
            gap: 10, overflow: "hidden",
          }}>
            {/* 내 화면 */}
            <VideoTile
              label="나"
              isMe
              isMuted={isMuted}
              isCameraOff={isCameraOff}
              videoRef={localVideoRef}
              muted
            />
            {/* 원격 참여자 */}
            {remoteStreams.map(({ peerId, stream }) => (
              <RemoteVideoTile key={peerId} peerId={peerId} stream={stream} />
            ))}
            {/* 빈 슬롯 */}
            {Array.from({ length: Math.max(0, 5 - remoteStreams.length) }).map((_, i) => (
              <div key={`empty-${i}`} style={{
                background: DARK.surface, border: `1px dashed ${DARK.border}`,
                borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                opacity: 0.4, minHeight: 0,
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, marginBottom: 6, opacity: 0.4 }}>+</div>
                  <div style={{ fontSize: 12, color: DARK.textTertiary }}>대기 중</div>
                </div>
              </div>
            ))}
          </div>

          {/* CONTROLS */}
          <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexShrink: 0 }}>
            {[
              { label: isMuted ? "마이크 켜기" : "음소거", active: !isMuted, danger: isMuted, onClick: handleToggleMic, content: (
                <svg viewBox="0 0 18 18" fill="none" width="18" height="18">
                  <path d="M9 2a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" stroke="currentColor" strokeWidth="1.4"/>
                  {isMuted ? <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="1.4"/> : <path d="M4.5 10A4.5 4.5 0 0 0 13.5 10M9 14v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>}
                </svg>
              )},
              { label: isCameraOff ? "카메라 켜기" : "카메라", active: !isCameraOff, danger: isCameraOff, onClick: handleToggleCamera, content: (
                <svg viewBox="0 0 18 18" fill="none" width="18" height="18"><rect x="1" y="5" width="11" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M12 8l5-3v8l-5-3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
              )},
              { label: "화면 공유", active: isScreenSharing, danger: false, onClick: () => setIsScreenSharing(v => !v), content: (
                <svg viewBox="0 0 18 18" fill="none" width="18" height="18"><rect x="1" y="3" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M6 17h6M9 14v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M7 9l2-2 2 2M9 7v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )},
            ].map(btn => (
              <div key={btn.label} style={{ position: "relative" }}>
                <button onClick={btn.onClick} style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: btn.danger ? DARK.redDim : btn.active ? DARK.accentDim : DARK.surface2,
                  border: `1px solid ${btn.danger ? "rgba(239,68,68,0.3)" : btn.active ? DARK.accentBorder : DARK.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: btn.danger ? DARK.red : btn.active ? DARK.accent : DARK.textPrimary,
                }}>
                  {btn.content}
                </button>
                <span style={{
                  position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)",
                  fontSize: 10, color: DARK.textTertiary, whiteSpace: "nowrap",
                }}>{btn.label}</span>
              </div>
            ))}
            <div style={{ width: 1, height: 32, background: DARK.border, margin: "0 4px" }} />
            {[
              { label: "참여자", icon: <svg viewBox="0 0 18 18" fill="none" width="18" height="18"><circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M1 16c0-3.3 2.7-6 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="13" cy="6" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M12 16c0-2.5 1.5-4.5 3.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
              { label: "채팅", icon: <svg viewBox="0 0 18 18" fill="none" width="18" height="18"><path d="M3 3h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6l-3 3V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg> },
            ].map(btn => (
              <div key={btn.label} style={{ position: "relative" }}>
                <button style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: DARK.surface2, border: `1px solid ${DARK.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: DARK.textPrimary,
                }}>{btn.icon}</button>
                <span style={{ position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: DARK.textTertiary, whiteSpace: "nowrap" }}>{btn.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{
          width: 320, flexShrink: 0,
          background: DARK.surface, borderLeft: `1px solid ${DARK.border}`,
          display: "flex", flexDirection: "column",
        }}>
          {/* TABS */}
          <div style={{ display: "flex", borderBottom: `1px solid ${DARK.border}`, padding: "0 4px", flexShrink: 0 }}>
            {([
              { key: "transcript", label: "실시간 자막", badge: isConnected ? "Live" : null },
              { key: "ai", label: "AI 분석", badge: null },
              { key: "participants", label: "참여자", badge: null },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                flex: 1, padding: "13px 8px", textAlign: "center", fontSize: 13,
                color: activeTab === tab.key ? DARK.textPrimary : DARK.textSecondary,
                background: "transparent", border: "none", cursor: "pointer",
                borderBottom: `2px solid ${activeTab === tab.key ? DARK.accent : "transparent"}`,
                fontWeight: activeTab === tab.key ? 500 : 400,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                marginBottom: -1,
              }}>
                {tab.label}
                {tab.badge && (
                  <span style={{ background: DARK.accentDim, color: DARK.accent, fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 999 }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* PANEL BODY */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {activeTab === "transcript" && (
              <div style={{ padding: "14px 16px" }}>
                {/* 음성인식 상태 배너 */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 7, marginBottom: 14,
                  padding: "10px 12px",
                  background: isListening ? DARK.greenDim : DARK.accentDim,
                  border: `1px solid ${isListening ? "rgba(34,197,94,0.3)" : DARK.accentBorder}`,
                  borderRadius: 9,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: isListening ? DARK.green : DARK.accent,
                    animation: "pulse2 1.5s ease infinite",
                  }} />
                  <div style={{ fontSize: 12, color: isListening ? DARK.green : DARK.accent, fontWeight: 500 }}>
                    {isListening ? "음성 인식 중 — 말하면 자막이 전송됩니다" : "마이크를 켜면 자막 인식이 시작됩니다"}
                  </div>
                </div>

                {/* 자막 목록 */}
                {transcripts.length === 0 ? (
                  <div style={{ textAlign: "center", color: DARK.textTertiary, fontSize: 13, padding: "32px 0" }}>
                    아직 자막이 없습니다
                  </div>
                ) : (
                  transcripts.map((item) => (
                    <div key={item.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: "linear-gradient(135deg,#2563eb,#4f46e5)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>
                          {item.speaker.slice(0, 1)}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: DARK.textPrimary }}>{item.speaker}</div>
                        <div style={{ fontSize: 11, color: DARK.textTertiary, marginLeft: "auto" }}>
                          {formatSeconds(item.startTime)}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: DARK.textSecondary, lineHeight: 1.65, paddingLeft: 27 }}>
                        {item.content}
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            )}

            {activeTab === "ai" && (
              <div style={{ padding: "14px 16px" }}>
                <div style={{ textAlign: "center", color: DARK.textTertiary, fontSize: 13, padding: "32px 0" }}>
                  회의 종료 후 AI 분석 결과가 표시됩니다
                </div>
              </div>
            )}

            {activeTab === "participants" && (
              <div style={{ padding: "14px 16px" }}>
                {/* 초대 입력 */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: DARK.textTertiary, marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>참여자 초대</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="email" value={inviteEmail}
                      onChange={e => { setInviteEmail(e.target.value); setInviteResult(null); }}
                      onKeyDown={e => e.key === "Enter" && handleInvite()}
                      placeholder="이메일 입력"
                      style={{
                        flex: 1, padding: "7px 10px", borderRadius: 7,
                        border: `1px solid ${DARK.border}`, background: DARK.surface2,
                        color: DARK.textPrimary, fontSize: 12.5, outline: "none",
                      }}
                    />
                    <button
                      onClick={handleInvite} disabled={!inviteEmail.trim() || inviting}
                      style={{
                        padding: "7px 12px", borderRadius: 7, border: "none",
                        background: DARK.accent, color: "#fff",
                        fontSize: 12, fontWeight: 500, cursor: "pointer",
                        opacity: !inviteEmail.trim() || inviting ? 0.5 : 1,
                      }}
                    >{inviting ? "..." : "초대"}</button>
                  </div>
                  {inviteResult && (
                    <div style={{ fontSize: 12, marginTop: 6, color: inviteResult.type === 'success' ? DARK.green : DARK.red }}>
                      {inviteResult.message}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: `1px solid ${DARK.border}`, paddingTop: 12 }}>
                  {participants.length === 0 ? (
                    <div style={{ fontSize: 12, color: DARK.textTertiary, textAlign: "center", padding: "16px 0" }}>참여자 없음</div>
                  ) : participants.map((p, i) => {
                    const isMe = p.email === myEmail;
                    const isConnected = isMe || remoteStreams.some(r => r.peerId === p.email);
                    const colors = [
                      "linear-gradient(135deg,#2563eb,#4f46e5)",
                      "linear-gradient(135deg,#16a34a,#0d9488)",
                      "linear-gradient(135deg,#7c3aed,#db2777)",
                      "linear-gradient(135deg,#d97706,#dc2626)",
                      "linear-gradient(135deg,#0284c7,#0891b2)",
                    ];
                    return (
                      <div key={p.email} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${DARK.border}` }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: colors[i % colors.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#fff", flexShrink: 0 }}>
                          {p.name.slice(0, 1)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: DARK.textPrimary, display: "flex", alignItems: "center", gap: 4 }}>
                            {p.name}
                            {isMe && <span style={{ fontSize: 11, color: DARK.accent, background: DARK.accentDim, padding: "1px 6px", borderRadius: 3 }}>나</span>}
                            {p.email === hostEmail && (
                              <span style={{ fontSize: 11, color: "#f59e0b", background: "rgba(245,158,11,0.15)", padding: "1px 6px", borderRadius: 3 }}>방장</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: DARK.textTertiary }}>{p.email}</div>
                        </div>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: isConnected ? DARK.green : DARK.textTertiary, flexShrink: 0 }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes wave { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.4)} }
        @keyframes pulse2 { 0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,0.5)} 50%{box-shadow:0 0 0 5px rgba(59,130,246,0)} }
        @keyframes cursor { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes dotpulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
        @keyframes ring { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
