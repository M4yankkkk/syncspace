import { useState } from 'react';
import { useSessionStore } from '../store/useSessionStore';

export default function LoginScreen() {
  const { setAuth } = useSessionStore();
  const [room, setRoom] = useState('');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (room && token && username) {
      setAuth(room, token, username);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans text-slate-200">
      <div className="w-full max-w-md bg-surface border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-primary/20">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Join SyncSpace Room</h1>
          <p className="text-sm text-slate-400 text-center">Enter your details and the room token to connect with your partner.</p>
        </div>
        
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Display Name</label>
            <input 
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="e.g. Alice"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Room ID</label>
            <input 
              required
              value={room}
              onChange={e => setRoom(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="e.g. project-x"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Room Token</label>
            <input 
              required
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="Secret token"
            />
          </div>
          <button 
            type="submit"
            className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-xl transition-colors shadow-lg shadow-primary/20"
          >
            Enter Room
          </button>
        </form>
      </div>
    </div>
  );
}
