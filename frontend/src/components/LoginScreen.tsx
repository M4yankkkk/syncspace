import { useState, useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { useParams, useNavigate } from 'react-router-dom';

function generateRandomString(length: number) {
  return Math.random().toString(36).substring(2, 2 + length);
}

export default function LoginScreen() {
  const { setAuth } = useSessionStore();
  const { urlRoomId } = useParams();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState(urlRoomId || '');
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  
  useEffect(() => {
    // If URL has a token query param, pre-fill it
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) setToken(urlToken);
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (room && token && username) {
      setAuth(room, token, username);
      navigate(`/${room}?token=${token}`);
    }
  };

  const handleCreateNew = () => {
    const newRoom = generateRandomString(8);
    const newToken = generateRandomString(12);
    setRoom(newRoom);
    setToken(newToken);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans text-slate-200 p-4">
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
            <div className="flex gap-2">
              <input 
                required
                value={room}
                onChange={e => setRoom(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="e.g. project-x"
              />
              <button type="button" onClick={handleCreateNew} className="px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium transition-colors">
                Auto-Generate
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Room Token</label>
            <input 
              required
              type="text"
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
