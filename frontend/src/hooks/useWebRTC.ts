import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

const STUN_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: [
        'turn:211.58.5.66:3478',
        'turn:211.58.5.66:3478?transport=tcp',
      ],
      username: 'meetlog',
      credential: 'ehddn0930',
    },
  ],
};

export type RemoteStream = {
  peerId: string;
  stream: MediaStream | null;
};

export function useWebRTC(meetingId: string, myId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // peerId → RTCPeerConnection
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  // setRemoteDescription 전에 도착한 ICE candidates 임시 보관
  const iceCandidateBuffer = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const stompRef = useRef<Client | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // RTCPeerConnection 생성 헬퍼
  const createPeer = useCallback((peerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(STUN_CONFIG);

    // 로컬 트랙 추가 (상대방이 내 영상/음성을 받을 수 있게)
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // 상대방 트랙 수신
    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        const exists = prev.find(r => r.peerId === peerId);
        if (exists) {
          // 이미 있지만 stream이 null이면 (onconnectionstatechange가 먼저 온 경우) 업데이트
          if (!exists.stream) {
            return prev.map(r => r.peerId === peerId ? { ...r, stream: event.streams[0] } : r);
          }
          return prev;
        }
        return [...prev, { peerId, stream: event.streams[0] }];
      });
    };

    // ICE candidate 수집 → 시그널링 서버로 전송
    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      console.log(`[ICE] ${myId} → ${peerId}:`, event.candidate.type, event.candidate.address);
      stompRef.current?.publish({
        destination: `/app/meetings/${meetingId}/signal`,
        body: JSON.stringify({
          type: 'ice-candidate',
          from: myId,
          to: peerId,
          payload: event.candidate,
        }),
      });
    };

    pc.onicegatheringstatechange = () => {
      console.log(`[ICE gathering] ${peerId}:`, pc.iceGatheringState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[ICE connection] ${peerId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.warn(`[ICE] ${peerId} failed — restartIce 시도`);
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[PeerConnection] ${peerId}:`, pc.connectionState);
      if (pc.connectionState === 'connected') {
        setRemoteStreams(prev =>
          prev.find(r => r.peerId === peerId) ? prev : [...prev, { peerId, stream: null }]
        );
      } else if (pc.connectionState === 'failed') {
        // disconnected는 일시적일 수 있으므로 failed만 정리
        console.warn(`[PeerConnection] ${peerId} failed — 연결 종료`);
        setRemoteStreams(prev => prev.filter(r => r.peerId !== peerId));
        peerConnections.current.delete(peerId);
      }
    };

    peerConnections.current.set(peerId, pc);
    return pc;
  }, [meetingId, myId]);

  // 시그널 메시지 처리
  const handleSignal = useCallback(async (message: {
    type: string; from: string; to: string | null; payload: unknown;
  }) => {
    if (message.from === myId) return; // 내가 보낸 메시지는 무시

    const { type, from, payload } = message;

    if (type === 'join') {
      // 이미 연결 중인 peer면 중복 생성 방지
      if (peerConnections.current.has(from)) return;
      const pc = createPeer(from);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      stompRef.current?.publish({
        destination: `/app/meetings/${meetingId}/signal`,
        body: JSON.stringify({ type: 'offer', from: myId, to: from, payload: offer }),
      });

    } else if (type === 'offer' && message.to === myId) {
      // 이미 연결 중인 peer면 중복 생성 방지
      if (peerConnections.current.has(from)) return;
      const pc = createPeer(from);
      await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      // answer를 먼저 보내고, 버퍼에 쌓인 ICE candidates 추가
      stompRef.current?.publish({
        destination: `/app/meetings/${meetingId}/signal`,
        body: JSON.stringify({ type: 'answer', from: myId, to: from, payload: answer }),
      });
      const buffered = iceCandidateBuffer.current.get(from) ?? [];
      iceCandidateBuffer.current.delete(from);
      for (const c of buffered) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      }

    } else if (type === 'answer' && message.to === myId) {
      const pc = peerConnections.current.get(from);
      if (pc && pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
        // answer 처리 완료 후 버퍼에 쌓인 ICE candidates 추가
        const buffered = iceCandidateBuffer.current.get(from) ?? [];
        iceCandidateBuffer.current.delete(from);
        for (const c of buffered) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
      }

    } else if (type === 'ice-candidate' && message.to === myId) {
      const pc = peerConnections.current.get(from);
      if (!pc || pc.signalingState === 'closed') return;
      if (pc.remoteDescription !== null) {
        await pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit)).catch(() => {});
      } else {
        // remoteDescription 설정 전에 도착한 candidate는 버퍼에 보관
        const buf = iceCandidateBuffer.current.get(from) ?? [];
        buf.push(payload as RTCIceCandidateInit);
        iceCandidateBuffer.current.set(from, buf);
      }

    } else if (type === 'leave') {
      peerConnections.current.get(from)?.close();
      peerConnections.current.delete(from);
      setRemoteStreams(prev => prev.filter(r => r.peerId !== from));
    }
  }, [myId, meetingId, createPeer]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. 카메라 + 마이크 획득 (실패해도 시그널링은 계속 진행)
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaError('카메라/마이크 접근 불가 — HTTP 접속 시 Chrome flags 설정 필요');
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
          localStreamRef.current = stream;
          setLocalStream(stream);
        } catch (e) {
          setMediaError(`카메라/마이크 권한 오류: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      if (!mounted) return;

      // 2. STOMP 연결 (카메라 없어도 항상 실행)
      const client = new Client({
        webSocketFactory: () => new SockJS(`${API_URL}/ws`),
        reconnectDelay: 3000,
        onConnect: () => {
          // 시그널 채널 구독
          client.subscribe(`/topic/meetings/${meetingId}/signal`, (msg) => {
            handleSignal(JSON.parse(msg.body));
          });

          // 입장 알림 → 기존 참여자들이 offer를 보내옴
          client.publish({
            destination: `/app/meetings/${meetingId}/signal`,
            body: JSON.stringify({ type: 'join', from: myId, to: null, payload: null }),
          });

          setIsReady(true);
        },
      });

      stompRef.current = client;
      client.activate();
    };

    init().catch(console.error);

    return () => {
      mounted = false;
      // 퇴장 알림 (연결된 상태일 때만)
      if (stompRef.current?.connected) {
        stompRef.current.publish({
          destination: `/app/meetings/${meetingId}/signal`,
          body: JSON.stringify({ type: 'leave', from: myId, to: null, payload: null }),
        });
      }
      stompRef.current?.deactivate();
      peerConnections.current.forEach(pc => pc.close());
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [meetingId, myId, handleSignal]);

  const toggleMic = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
  }, []);

  return { localStream, remoteStreams, isReady, mediaError, toggleMic, toggleCamera };
}
