import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore } from '../store/useSessionStore';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export function useWebRTC() {
  const { ws, isPttActive } = useSessionStore();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('new');

  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Keep localStreamRef in sync
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!ws) return;

    // Wait for ws to be open before doing anything
    const setup = () => {
      console.log('[WebRTC] Setting up peer connection...');
      
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Remote stream container — we create it upfront so ontrack just adds to it
      const remote = new MediaStream();
      setRemoteStream(remote);

      pc.ontrack = (event) => {
        console.log('[WebRTC] ontrack fired, kind:', event.track.kind);
        remote.addTrack(event.track);
        // Force a re-render by setting a new reference
        setRemoteStream(new MediaStream(remote.getTracks()));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws.send(JSON.stringify({ type: 'WEBRTC', data: { type: 'candidate', candidate: event.candidate } }));
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[WebRTC] ICE state:', pc.iceConnectionState);
        setConnectionState(pc.iceConnectionState);
      };

      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', pc.connectionState);
      };

      pc.onnegotiationneeded = async () => {
        console.log('[WebRTC] negotiationneeded fired');
        try {
          makingOfferRef.current = true;
          await pc.setLocalDescription();
          ws.send(JSON.stringify({ 
            type: 'WEBRTC', 
            data: { type: 'offer', offer: pc.localDescription, sender: useSessionStore.getState().username } 
          }));
        } catch (err) {
          console.error('[WebRTC] Error creating offer:', err);
        } finally {
          makingOfferRef.current = false;
        }
      };

      const handleMessage = (event: MessageEvent) => {
        // The backend writePump can batch multiple messages with newlines.
        // Split them and handle each individually.
        const rawData = event.data as string;
        const parts = rawData.split('\n').filter(Boolean);

        for (const part of parts) {
          try {
            const msg = JSON.parse(part);
            handleSignalingMessage(msg);
          } catch {
            // Not JSON or malformed — ignore
          }
        }
      };

      const handleSignalingMessage = async (msg: any) => {
        const pc = pcRef.current;
        if (!pc) return;

        try {
          if (msg.type === 'HELLO') {
            console.log('[WebRTC] Received HELLO from partner');
            // Partner joined — send an offer if we have tracks
            if (pc.getSenders().length > 0) {
              console.log('[WebRTC] We have tracks, sending offer on HELLO');
              try {
                makingOfferRef.current = true;
                await pc.setLocalDescription();
                ws.send(JSON.stringify({ 
                  type: 'WEBRTC', 
                  data: { type: 'offer', offer: pc.localDescription, sender: useSessionStore.getState().username } 
                }));
              } finally {
                makingOfferRef.current = false;
              }
            } else {
              // We have no tracks yet — send our own HELLO back so when we DO get tracks,
              // negotiationneeded will fire and the partner will get our offer.
              console.log('[WebRTC] No tracks yet, sending HELLO back');
              ws.send(JSON.stringify({ type: 'HELLO' }));
            }
          } else if (msg.type === 'WEBRTC') {
            const payload = msg.data;

            if (payload.type === 'offer') {
              console.log('[WebRTC] Received offer from:', payload.sender);
              const myUsername = useSessionStore.getState().username || '';
              const senderUsername = payload.sender || '';
              const isPolite = myUsername < senderUsername;

              const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable';

              ignoreOfferRef.current = !isPolite && offerCollision;
              if (ignoreOfferRef.current) {
                console.log('[WebRTC] Ignoring offer (glare, we are impolite)');
                return;
              }

              await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
              await pc.setLocalDescription();
              ws.send(JSON.stringify({ 
                type: 'WEBRTC', 
                data: { type: 'answer', answer: pc.localDescription } 
              }));
              console.log('[WebRTC] Sent answer');
            } else if (payload.type === 'answer') {
              console.log('[WebRTC] Received answer');
              await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
            } else if (payload.type === 'candidate') {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
              } catch (err) {
                if (!ignoreOfferRef.current) console.error('[WebRTC] ICE candidate error:', err);
              }
            }
          }
        } catch (err) {
          console.error('[WebRTC] Signaling error:', err);
        }
      };

      ws.addEventListener('message', handleMessage);

      // Try to get media — but don't block the connection setup
      const initMedia = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          console.log('[WebRTC] Got local media, tracks:', stream.getTracks().map(t => t.kind));
          setLocalStream(stream);
          localStreamRef.current = stream;
          // Start with mic muted (PTT mode)
          stream.getAudioTracks().forEach(track => { track.enabled = false; });
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
          setMicError(null);
        } catch (err) {
          console.error('[WebRTC] Media access denied:', err);
          setMicError('Mic/Camera access denied. Tap "Retry" below.');
        }
        // Always send HELLO to tell the partner we're here
        ws.send(JSON.stringify({ type: 'HELLO' }));
      };

      initMedia();

      return () => {
        console.log('[WebRTC] Cleaning up');
        ws.removeEventListener('message', handleMessage);
        pc.close();
        pcRef.current = null;
      };
    };

    // If ws is already open, set up immediately, otherwise wait
    if (ws.readyState === WebSocket.OPEN) {
      return setup();
    } else {
      const onOpen = () => {
        ws.removeEventListener('open', onOpen);
        setup();
      };
      ws.addEventListener('open', onOpen);
      return () => {
        ws.removeEventListener('open', onOpen);
      };
    }
  }, [ws]);

  // Retry media (user gesture — solves Android overlay issue)
  const retryMedia = useCallback(async () => {
    const pc = pcRef.current;
    const ws = useSessionStore.getState().ws;
    if (!pc) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      console.log('[WebRTC] Retry: Got media');
      setLocalStream(stream);
      localStreamRef.current = stream;
      stream.getAudioTracks().forEach(track => { 
        track.enabled = useSessionStore.getState().isPttActive; 
      });
      
      // Add tracks that aren't already being sent
      stream.getTracks().forEach(track => {
        const senders = pc.getSenders();
        const alreadySending = senders.find(s => s.track?.kind === track.kind);
        if (!alreadySending) {
          pc.addTrack(track, stream);
        } else {
          // Replace the existing track
          alreadySending.replaceTrack(track);
        }
      });
      setMicError(null);
      
      // Notify partner
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'HELLO' }));
      }
    } catch (err) {
      console.error('[WebRTC] Retry failed:', err);
      setMicError('Still denied. Check browser site settings for this URL.');
    }
  }, []);

  // Handle Video toggle
  const toggleVideo = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const currentVideoTrack = stream.getVideoTracks()[0];

    if (currentVideoTrack) {
      // Turn off
      currentVideoTrack.stop();
      stream.removeTrack(currentVideoTrack);
      setIsVideoOn(false);

      const senders = pcRef.current?.getSenders() || [];
      const sender = senders.find(s => s.track?.kind === 'video');
      if (sender) pcRef.current?.removeTrack(sender);
    } else {
      // Turn on
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];
        stream.addTrack(videoTrack);
        setIsVideoOn(true);
        if (pcRef.current) {
          pcRef.current.addTrack(videoTrack, stream);
        }
      } catch (err) {
        console.error('[WebRTC] Camera access denied:', err);
      }
    }
  }, []);

  // Handle Push-To-Talk
  useEffect(() => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = isPttActive;
      });
    }
  }, [isPttActive]);

  return { micError, localStream, remoteStream, isVideoOn, toggleVideo, retryMedia, connectionState };
}
