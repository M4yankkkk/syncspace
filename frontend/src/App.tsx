import { useSessionStore } from './store/useSessionStore';
import SharedTimer from './components/SharedTimer';
import TaskBoard from './components/TaskBoard';
import CommunicationBar from './components/CommunicationBar';
import BrainDump from './components/BrainDump';
import DebriefModal from './components/DebriefModal';
import LoginScreen from './components/LoginScreen';
import FloatingVideo from './components/FloatingVideo';
import { useState, useEffect } from 'react';

function App() {
  const { connectWs, ws, roomId, token, username } = useSessionStore();
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);

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

  if (!roomId || !token || !username) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-background text-slate-200 flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-surface/50 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
            S
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">SyncSpace</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Strict Mode: Active
          </div>
          <button 
            onClick={() => setIsDebriefOpen(true)}
            className="px-4 py-1.5 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/50 rounded-full text-sm font-bold transition-colors"
          >
            End Session
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column (Timer & Tools) */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <SharedTimer />
          <BrainDump />
        </div>

        {/* Right Column (Split Desk) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          <TaskBoard isPartner={false} />
          <TaskBoard isPartner={true} />
        </div>
      </main>

      {/* Video & Communication */}
      <FloatingVideo />
      <CommunicationBar />
      <DebriefModal isOpen={isDebriefOpen} onClose={() => setIsDebriefOpen(false)} />
    </div>
  );
}

export default App;
