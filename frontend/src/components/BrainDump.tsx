import { useEffect, useState } from 'react';
import { useSessionStore } from '../store/useSessionStore';

export default function BrainDump() {
  const { ws } = useSessionStore();
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'BRAIN_DUMP') {
        setContent(msg.data.content);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    if (ws) {
      ws.send(JSON.stringify({ type: 'BRAIN_DUMP', data: { content: val } }));
    }
  };

  return (
    <div className="flex-1 bg-surface/30 border border-slate-800 rounded-2xl p-4 flex flex-col">
      <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2">
        Brain Dump (Syncs Live)
      </h3>
      <textarea 
        value={content}
        onChange={handleChange}
        className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-300 resize-none focus:outline-none focus:border-primary/50 transition-colors placeholder-slate-600"
        placeholder="Drop links, notes, or snippets here..."
      />
    </div>
  );
}
