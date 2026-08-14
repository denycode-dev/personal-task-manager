import { create } from "zustand";

type UIStore = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  sidebarMinimized: boolean;
  toggleSidebarMinimized: () => void;
  setSidebarMinimized: (minimized: boolean) => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
};

export const useUIStore = create<UIStore>((set) => {
  // Check localStorage on client initialization
  const initialMinimized =
    typeof window !== "undefined"
      ? localStorage.getItem("denycode_sidebar_minimized") === "true"
      : false;

  return {
    sidebarOpen: false,
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    sidebarMinimized: initialMinimized,
    toggleSidebarMinimized: () =>
      set((s) => {
        const next = !s.sidebarMinimized;
        if (typeof window !== "undefined") {
          localStorage.setItem("denycode_sidebar_minimized", String(next));
        }
        return { sidebarMinimized: next };
      }),
    setSidebarMinimized: (minimized: boolean) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("denycode_sidebar_minimized", String(minimized));
      }
      set({ sidebarMinimized: minimized });
    },
    commandOpen: false,
    setCommandOpen: (open) => set({ commandOpen: open }),
  };
});
