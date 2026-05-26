import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppStore {
  workspaceId: string;
  workspaceName: string;
  sidebarOpen: boolean;
  setWorkspace: (id: string, name: string) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      workspaceId:   "00000000-0000-0000-0000-000000000001",
      workspaceName: "My Brand",
      sidebarOpen:   true,
      setWorkspace:  (id, name) => set({ workspaceId: id, workspaceName: name }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: "smm-store" }
  )
);
