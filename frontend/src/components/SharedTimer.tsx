import { useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { Play, Pause, RefreshCw } from 'lucide-react';

export default function SharedTimer() {
  const { timerRunning, timeLeft, toggleTimer, setTimeLeft } = useSessionStore();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      toggleTimer();
      // TODO: Play sound or show alert
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft, setTimeLeft, toggleTimer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setTimeLeft(25 * 60);
    if (timerRunning) toggleTimer();
  };

  return (
    <div className="flex flex-col items-center bg-surface p-6 rounded-2xl shadow-xl border border-slate-700 w-full max-w-sm mx-auto">
      <h2 className="text-slate-400 text-sm uppercase tracking-widest font-semibold mb-2">Sync Pomodoro</h2>
      <div className="text-6xl font-black text-white tabular-nums tracking-tight mb-6">
        {formatTime(timeLeft)}
      </div>
      <div className="flex gap-4">
        <button
          onClick={toggleTimer}
          className={`flex items-center justify-center p-4 rounded-full transition-all ${
            timerRunning 
              ? 'bg-danger/20 text-danger hover:bg-danger/30' 
              : 'bg-primary/20 text-primary hover:bg-primary/30'
          }`}
        >
          {timerRunning ? <Pause size={28} className="fill-current" /> : <Play size={28} className="fill-current ml-1" />}
        </button>
        <button
          onClick={resetTimer}
          className="flex items-center justify-center p-4 rounded-full bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all"
        >
          <RefreshCw size={24} />
        </button>
      </div>
    </div>
  );
}
