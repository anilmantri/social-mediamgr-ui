import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, TokenResponse, UsageSummary } from "@/types";

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  usage: UsageSummary | null;
  isAuthenticated: boolean;

  setTokens: (tokens: TokenResponse) => void;
  setUser: (user: User) => void;
  setUsage: (usage: UsageSummary) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      usage: null,
      isAuthenticated: false,

      setTokens: (tokens) => set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        isAuthenticated: true,
      }),
      setUser: (user) => set({ user }),
      setUsage: (usage) => set({ usage }),
      logout: () => set({
        user: null, accessToken: null, refreshToken: null,
        usage: null, isAuthenticated: false,
      }),
    }),
    {
      name: "smm-auth",
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
