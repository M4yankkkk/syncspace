import { useEffect, useState } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { Mic, MessageSquare } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import EphemeralChat from './EphemeralChat';

export default function CommunicationBar() {
  const { setPttActive, isPttActive } = useSessionStore();
  const { micError } = useWebRTC();
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isPttActive) {
        // Prevent default spacebar scrolling if not in an input
        if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
          e.preventDefault();
          setPttActive(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setPttActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPttActive, setPttActive]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-slate-700 rounded-full shadow-2xl px-6 py-3 flex items-center gap-6">
      <div className="flex flex-col items-center">
        <button 
          onMouseDown={() => setPttActive(true)}
          onMouseUp={() => setPttActive(false)}
          onMouseLeave={() => setPttActive(false)}
          className={`flex items-center gap-2 transition-colors ${
            isPttActive ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className={`p-2 rounded-full ${isPttActive ? 'bg-emerald-500/20' : 'bg-transparent'}`}>
            <Mic size={20} className={isPttActive ? 'animate-pulse' : ''} />
          </div>
          <span className="text-sm font-medium">Hold Space</span>
        </button>
        {micError && <span className="text-[10px] text-danger absolute -bottom-4">{micError}</span>}
      </div>
      
      <div className="w-px h-6 bg-slate-700"></div>
      
      <button 
        onClick={() => setIsChatOpen(true)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <MessageSquare size={20} />
        <span className="text-sm font-medium">Ephemeral Chat</span>
      </button>

      <EphemeralChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
