import { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'me' | 'partner';
  text: string;
  timestamp: number;
}

export default function EphemeralChat() {
  const { ws } = useSessionStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'CHAT') {
        setMessages(prev => [...prev, { ...msg.data, sender: 'partner' }]);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ws) return;

    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'me',
      text: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMsg]);
    ws.send(JSON.stringify({ type: 'CHAT', data: newMsg }));
    setInput('');
  };

  return (
    <div className="flex-1 bg-surface border border-slate-700 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
        <h3 className="font-bold text-slate-200">Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[300px]">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
            <div className={`px-4 py-2 rounded-2xl text-sm ${msg.sender === 'me' ? 'bg-primary text-white rounded-br-sm' : 'bg-slate-700 text-slate-200 rounded-bl-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="m-auto text-sm text-slate-500 text-center px-4">
            Messages disappear when the session ends.
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-slate-700/50 bg-slate-800/30">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-3 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:text-blue-400 disabled:opacity-50 disabled:hover:text-primary transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
