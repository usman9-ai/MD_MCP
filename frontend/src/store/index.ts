import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, ChatMessage, AppSettings } from "@/types";

// ── Auth store ────────────────────────────────────────────────────────────────
interface AuthState {
  user: AuthUser | null;
  hasHydrated: boolean;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "md-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// ── Chat store ────────────────────────────────────────────────────────────────
interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  addMessage: (m: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setStreaming: (v: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  updateMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  clearMessages: () => set({ messages: [] }),
  setStreaming: (v) => set({ isStreaming: v }),
}));

// ── Settings store ────────────────────────────────────────────────────────────
interface SettingsState extends AppSettings {
  set: (patch: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoScroll: true,
      markdownEnabled: true,
      compactMode: false,
      themeMode: "dark",
      set: (patch) => set(patch),
    }),
    { name: "md-settings" }
  )
);
