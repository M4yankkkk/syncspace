import { create } from 'zustand';

interface Task {
  id: string;
  description: string;
  completed: boolean;
}

interface WSMessage {
  type: string;
  data: any;
}

interface SessionState {
  roomId: string | null;
  token: string | null;
  username: string | null;

  ws: WebSocket | null;
  myTasks: Task[];
  partnerTasks: Task[];
  timerRunning: boolean;
  timeLeft: number;
  partnerPresence: 'active' | 'typing' | 'away';
  isPttActive: boolean;
  
  // Actions
  setAuth: (roomId: string, token: string, username: string) => void;
  connectWs: () => void;
  addMyTask: (desc: string) => void;
  toggleMyTask: (id: string) => void;
  toggleTimer: () => void;
  setTimeLeft: (time: number) => void;
  setPartnerPresence: (status: 'active' | 'typing' | 'away') => void;
  setPttActive: (active: boolean) => void;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  roomId: null,
  token: null,
  username: null,
  ws: null,
  myTasks: [
    { id: '1', description: 'Complete API endpoints', completed: false },
  ],
  partnerTasks: [],
  timerRunning: false,
  timeLeft: 25 * 60, // 25 mins
  partnerPresence: 'active',
  isPttActive: false,

  setAuth: (roomId, token, username) => set({ roomId, token, username }),

  connectWs: () => {
    const { ws, roomId, token } = get();
    if (ws || !roomId || !token) return;
    const wsUrl = `ws://localhost:8081/ws?room=${encodeURIComponent(roomId)}&token=${encodeURIComponent(token)}`;
    const newWs = new WebSocket(wsUrl);
    
    newWs.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data);
      if (msg.type === 'STATE_SYNC') {
        set({
          partnerTasks: msg.data.tasks,
          timerRunning: msg.data.timerRunning,
          timeLeft: msg.data.timeLeft,
          partnerPresence: msg.data.presence
        });
      } else if (msg.type === 'PRESENCE') {
        set({ partnerPresence: msg.data.presence });
      }
    };

    set({ ws: newWs });
  },

  addMyTask: (desc) => set((state) => {
    const newTasks = [...state.myTasks, { id: Math.random().toString(), description: desc, completed: false }];
    state.ws?.send(JSON.stringify({ type: 'STATE_SYNC', data: { tasks: newTasks, timerRunning: state.timerRunning, timeLeft: state.timeLeft, presence: state.partnerPresence } }));
    return { myTasks: newTasks };
  }),

  toggleMyTask: (id) => set((state) => {
    const newTasks = state.myTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    state.ws?.send(JSON.stringify({ type: 'STATE_SYNC', data: { tasks: newTasks, timerRunning: state.timerRunning, timeLeft: state.timeLeft, presence: state.partnerPresence } }));
    return { myTasks: newTasks };
  }),

  toggleTimer: () => set((state) => {
    const newState = !state.timerRunning;
    state.ws?.send(JSON.stringify({ type: 'STATE_SYNC', data: { tasks: state.myTasks, timerRunning: newState, timeLeft: state.timeLeft, presence: state.partnerPresence } }));
    return { timerRunning: newState };
  }),

  setTimeLeft: (time) => set((state) => {
    if (time % 5 === 0) { // Throttle sync
      state.ws?.send(JSON.stringify({ type: 'STATE_SYNC', data: { tasks: state.myTasks, timerRunning: state.timerRunning, timeLeft: time, presence: state.partnerPresence } }));
    }
    return { timeLeft: time };
  }),

  setPartnerPresence: (status) => set({ partnerPresence: status }),
  setPttActive: (active) => set({ isPttActive: active }),
}));
