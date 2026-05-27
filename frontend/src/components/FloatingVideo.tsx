import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Mic } from 'lucide-react';
import { useSessionStore } from '../store/useSessionStore';

interface FloatingVideoProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoOn: boolean;
  toggleVideo: () => void;
}

export default function FloatingVideo({ localStream, remoteStream, isVideoOn, toggleVideo }: FloatingVideoProps) {
  const { isPttActive, setPttActive } = useSessionStore();
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 320, height: 240 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOn]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.resize-handle') || (e.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    } else if (isResizing) {
      setSize({
        width: Math.max(200, e.clientX - position.x),
        height: Math.max(150, e.clientY - position.y)
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setIsResizing(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleResizeDown = (e: React.PointerEvent) => {
    setIsResizing(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  return (
    <div 
      className="fixed z-50 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-700 cursor-move touch-none group flex flex-col"
      style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="flex-1 relative bg-black w-full h-full">
        {remoteStream ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">Waiting for partner...</div>
        )}
        
        {/* Local Video Picture-in-Picture */}
        {isVideoOn && localStream && (
          <div className="absolute bottom-4 right-4 w-1/3 aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-lg">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>
        )}

        {/* Video Toggle Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); toggleVideo(); }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 backdrop-blur-sm transition-colors border border-slate-600 shadow-md"
        >
          {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>

        {/* Mic / PTT Indicator */}
        <button
          onMouseDown={(e) => { e.stopPropagation(); setPttActive(true); }}
          onMouseUp={(e) => { e.stopPropagation(); setPttActive(false); }}
          onMouseLeave={(e) => { e.stopPropagation(); setPttActive(false); }}
          className={`absolute top-4 right-14 p-2 rounded-full backdrop-blur-sm transition-colors border border-slate-600 shadow-md flex items-center gap-2 ${isPttActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'}`}
        >
          <Mic size={18} className={isPttActive ? 'animate-pulse' : ''} />
        </button>
      </div>

      {/* Resize Handle */}
      <div 
        className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onPointerDown={handleResizeDown}
      >
        <div className="w-2 h-2 border-r-2 border-b-2 border-slate-500 rounded-br-sm" />
      </div>
    </div>
  );
}
