import { useSessionStore } from './store/useSessionStore';
import SharedTimer from './components/SharedTimer';
import TaskBoard from './components/TaskBoard';
import BrainDump from './components/BrainDump';
import EphemeralChat from './components/EphemeralChat';
import DebriefModal from './components/DebriefModal';
import LoginScreen from './components/LoginScreen';
import FloatingVideo from './components/FloatingVideo';
import { useState, useEffect } from 'react';
import { useWebRTC } from './hooks/useWebRTC';

import { Routes, Route } from 'react-router-dom';

function App() {
  const { connectWs, ws, roomId, token, username, partnerPresence, setPttActive, isPttActive } = useSessionStore();
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  
  // Lift WebRTC state to the top level so it is only instantiated ONCE
  const { localStream, remoteStream, isVideoOn, toggleVideo } = useWebRTC();

  useEffect(() => {
    if (roomId && token) {
      connectWs();
    }
  }, [connectWs, roomId, token]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (ws) {
        const presence = document.hidden ? 'away' : 'active';
        ws.send(JSON.stringify({ type: 'PRESENCE', data: { presence } }));
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [ws]);

  // Session timer
  useEffect(() => {
    if (roomId && token && username) {
      const interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [roomId, token, username]);

  // Join notification
  useEffect(() => {
    if (partnerPresence === 'active' && roomId) {
      setNotification('Partner joined the room');
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [partnerPresence, roomId]);

  // Global spacebar listener for PTT
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isPttActive) {
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

  if (!roomId || !token || !username) {
    return (
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/:urlRoomId" element={<LoginScreen />} />
      </Routes>
    );
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/${roomId}?token=${token}`;
    navigator.clipboard.writeText(link);
    setNotification('Share link copied to clipboard!');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-background text-slate-200 flex flex-col font-sans">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-full shadow-lg shadow-primary/20 z-50 animate-in fade-in slide-in-from-top-4">
          {notification}
        </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-surface/50 backdrop-blur-sm px-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
            S
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">SyncSpace</h1>
        </div>

        <div className="flex flex-col items-center justify-center text-center">
           <div className="flex items-center gap-2 cursor-pointer group" onClick={copyShareLink} title="Click to copy invite link">
             <span className="text-sm font-bold text-slate-200">Room: {roomId}</span>
             <span className="px-2 py-0.5 rounded bg-slate-800 text-xs text-slate-400 group-hover:bg-slate-700 transition-colors">Token: {token}</span>
           </div>
           <span className="text-xs text-slate-500">Session Time: {formatDuration(sessionDuration)} • You are: {username}</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDebriefOpen(true)}
            className="px-4 py-1.5 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/50 rounded-full text-sm font-bold transition-colors"
          >
            End
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto w-full">
        {/* Left Column (Timer & Tools) */}
        <div className="w-full lg:w-72 flex flex-col gap-6">
          <SharedTimer />
          <BrainDump />
        </div>

        {/* Center Column (Split Desk) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
          <TaskBoard isPartner={false} />
          <TaskBoard isPartner={true} />
        </div>

        {/* Right Column (Chat Bento) */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <EphemeralChat />
        </div>
      </main>

      {/* Video & Communication */}
      <FloatingVideo 
        localStream={localStream} 
        remoteStream={remoteStream} 
        isVideoOn={isVideoOn} 
        toggleVideo={toggleVideo} 
      />
      <DebriefModal isOpen={isDebriefOpen} />
    </div>
  );
}

export default App;
