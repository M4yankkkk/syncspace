import { useState } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { CheckCircle2, Circle, Plus, User } from 'lucide-react';

interface TaskBoardProps {
  isPartner?: boolean;
}

export default function TaskBoard({ isPartner = false }: TaskBoardProps) {
  const { myTasks, partnerTasks, addMyTask, toggleMyTask, partnerPresence } = useSessionStore();
  const tasks = isPartner ? partnerTasks : myTasks;
  const [newTask, setNewTask] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim() && !isPartner) {
      addMyTask(newTask.trim());
      setNewTask('');
    }
  };

  return (
    <div className={`flex flex-col h-full bg-surface/50 border ${isPartner ? 'border-indigo-500/30' : 'border-emerald-500/30'} rounded-2xl overflow-hidden`}>
      <div className={`p-4 border-b ${isPartner ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-emerald-500/20 bg-emerald-500/5'} flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isPartner ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <User size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-100">{isPartner ? "Partner's Tasks" : "My Tasks"}</h3>
            {isPartner && (
              <span className="text-xs text-indigo-300/70 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                {partnerPresence}
              </span>
            )}
          </div>
        </div>
        <div className="text-sm font-medium text-slate-400">
          {tasks.filter(t => t.completed).length} / {tasks.length} done
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className={`flex items-start gap-3 p-3 rounded-xl transition-all ${task.completed ? 'opacity-50 bg-slate-800/50' : 'bg-slate-800 border border-slate-700/50 hover:border-slate-600'}`}
          >
            <button 
              onClick={() => !isPartner && toggleMyTask(task.id)}
              disabled={isPartner}
              className={`mt-0.5 flex-shrink-0 ${isPartner ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
            >
              {task.completed ? (
                <CheckCircle2 className={isPartner ? 'text-indigo-400' : 'text-emerald-400'} size={20} />
              ) : (
                <Circle className="text-slate-500" size={20} />
              )}
            </button>
            <span className={`text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
              {task.description}
            </span>
          </div>
        ))}
      </div>

      {!isPartner && (
        <form onSubmit={handleAdd} className="p-4 border-t border-slate-700/50 bg-slate-800/30">
          <div className="relative">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
            <button 
              type="submit"
              disabled={!newTask.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 disabled:opacity-50 disabled:hover:bg-emerald-500/20 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
