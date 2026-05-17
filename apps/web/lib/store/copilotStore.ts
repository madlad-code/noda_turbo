// FILE: apps/web/lib/store/copilotStore.ts
import { create } from 'zustand';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  chartData?: {  // ← ADD THIS
    type: 'bar' | 'line' | 'pie' | 'doughnut';
    data: any;
    title?: string;
  };
}

interface CopilotStore {
  isOpen: boolean;
  sessionId: string;
  messages: Message[];
  highlightedSelectors: string[];
  toggleCopilot: () => void;
  addMessage: (message: Message) => void;
  setHighlightedSelectors: (selectors: string[]) => void;
}

export const useCopilotStore = create<CopilotStore>((set) => ({
  isOpen: false,
  sessionId: crypto.randomUUID(),
  messages: [],
  highlightedSelectors: [],
  toggleCopilot: () => set((state) => ({ isOpen: !state.isOpen })),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setHighlightedSelectors: (selectors) => set({ highlightedSelectors: selectors }),
}));