import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore } from '../store/useSessionStore';

export function useWebRTC() {
  const { ws, isPttActive } = useSessionStore();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(false);
  
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);

  useEffect(() => {
    if (!ws) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pcRef.current = pc;

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({ type: 'WEBRTC', data: { type: 'candidate', candidate: event.candidate } }));
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        await pc.setLocalDescription();
        ws.send(JSON.stringify({ type: 'WEBRTC', data: { type: 'offer', offer: pc.localDescription, sender: useSessionStore.getState().username } }));
      } catch (err) {
        console.error(err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    const handleSignaling = async (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      const pc = pcRef.current;
      if (!pc) return;

      try {
        if (msg.type === 'HELLO') {
          // A new peer joined. Force a renegotiation if we already have tracks or want to connect.
          makingOfferRef.current = true;
          await pc.setLocalDescription();
          ws.send(JSON.stringify({ type: 'WEBRTC', data: { type: 'offer', offer: pc.localDescription, sender: useSessionStore.getState().username } }));
          makingOfferRef.current = false;
        } else if (msg.type === 'WEBRTC') {
          const payload = msg.data;
          
          if (payload.type === 'offer') {
            const myUsername = useSessionStore.getState().username || '';
            const senderUsername = payload.sender || '';
            // Deterministic polite peer based on username comparison
            const isPolite = myUsername < senderUsername; 
            
            const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable';
            
            ignoreOfferRef.current = !isPolite && offerCollision;
            if (ignoreOfferRef.current) return;

            // If we're polite and there's a collision, we must rollback our offer first (if state is have-local-offer)
            // Note: setRemoteDescription with an offer implicitly rolls back in modern WebRTC, 
            // but we ensure we await it properly.
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
            await pc.setLocalDescription();
            ws.send(JSON.stringify({ type: 'WEBRTC', data: { type: 'answer', answer: pc.localDescription } }));
          } else if (payload.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          } else if (payload.type === 'candidate') {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (err) {
              if (!ignoreOfferRef.current) console.error(err);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    ws.addEventListener('message', handleSignaling);

    // Initial media setup
    navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoOn })
      .then(stream => {
        setLocalStream(stream);
        stream.getAudioTracks().forEach(track => { track.enabled = false; });
        stream.getTracks().forEach(track => {
          if (pcRef.current) pcRef.current.addTrack(track, stream);
        });
      })
      .catch(err => {
        console.error("Media access denied", err);
        setMicError("Media access denied.");
      })
      .finally(() => {
        // Send a hello message to trigger negotiation from the other side if they are there
        ws.send(JSON.stringify({ type: 'HELLO' }));
      });

    return () => {
      ws.removeEventListener('message', handleSignaling);
      pcRef.current?.close();
    };
  }, [ws]); // Only run once when ws connects

  // Handle Video toggle
  const toggleVideo = useCallback(async () => {
    if (!localStream) return;
    const currentVideoTrack = localStream.getVideoTracks()[0];
    
    if (currentVideoTrack) {
      // Turn off
      currentVideoTrack.stop();
      localStream.removeTrack(currentVideoTrack);
      setIsVideoOn(false);
      
      const senders = pcRef.current?.getSenders() || [];
      const sender = senders.find(s => s.track?.kind === 'video');
      if (sender) pcRef.current?.removeTrack(sender);
    } else {
      // Turn on
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = stream.getVideoTracks()[0];
        localStream.addTrack(videoTrack);
        setIsVideoOn(true);
        if (pcRef.current) {
          pcRef.current.addTrack(videoTrack, localStream);
        }
      } catch (err) {
        console.error("Camera access denied", err);
      }
    }
  }, [localStream]);

  // Handle Push-To-Talk logic
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isPttActive;
      });
    }
  }, [isPttActive, localStream]);

  return { micError, localStream, remoteStream, isVideoOn, toggleVideo };
}
