import { useState } from 'react';
import { useSessionStore } from '../store/useSessionStore';

export default function DebriefModal({ isOpen }: { isOpen: boolean }) {
  const { myTasks } = useSessionStore();
  const [rating, setRating] = useState<'green' | 'yellow' | 'red' | null>(null);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    
    // In a real implementation, send this to the REST API:
    console.log("Submitting Debrief:", { rating, notes, tasksCompleted: myTasks.filter(t => t.completed).length });
    
    // End session
    window.location.href = '/';
  };

  const completedCount = myTasks.filter(t => t.completed).length;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-slate-700 rounded-3xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95">
        <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
        <p className="text-slate-400 mb-6">Take 2 minutes to review your session and rate your focus.</p>

        <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700/50">
          <h4 className="text-sm font-semibold text-slate-300 mb-1">Productivity</h4>
          <p className="text-2xl font-bold text-emerald-400">{completedCount} <span className="text-sm font-normal text-slate-500">/ {myTasks.length} tasks completed</span></p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Rate your Focus</label>
            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setRating('green')}
                className={`flex-1 py-3 rounded-xl border ${rating === 'green' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 transition-colors'}`}
              >
                Deep
              </button>
              <button 
                type="button" 
                onClick={() => setRating('yellow')}
                className={`flex-1 py-3 rounded-xl border ${rating === 'yellow' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 transition-colors'}`}
              >
                Distracted
              </button>
              <button 
                type="button" 
                onClick={() => setRating('red')}
                className={`flex-1 py-3 rounded-xl border ${rating === 'red' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 transition-colors'}`}
              >
                Poor
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Notes (Optional)</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What went well? What distracted you?"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-300 resize-none focus:outline-none focus:border-primary/50 transition-colors"
              rows={3}
            />
          </div>

          <button 
            type="submit"
            disabled={!rating}
            className="w-full py-4 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold transition-colors disabled:opacity-50 disabled:hover:bg-primary"
          >
            Submit Debrief
          </button>
        </form>
      </div>
    </div>
  );
}
