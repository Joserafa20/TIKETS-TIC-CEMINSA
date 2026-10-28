import { create } from 'zustand';

export interface AppError {
  title: string;
  message: string;
  solution?: string;
  code?: number;
}

interface ErrorStore {
  error: AppError | null;
  show: (error: AppError) => void;
  clear: () => void;
}

export const useErrorStore = create<ErrorStore>((set) => ({
  error: null,
  show: (error) => set({ error }),
  clear: () => set({ error: null }),
}));
