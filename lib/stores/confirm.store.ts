import { create } from "zustand";

type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: ((value: boolean) => void) | null;
};

type ConfirmStore = ConfirmState & {
  ask: (opts: { title?: string; message: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean>;
  answer: (value: boolean) => void;
};

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  open: false,
  title: "Konfirmasi",
  message: "",
  confirmLabel: "Ya, lanjutkan",
  danger: false,
  resolve: null,

  ask({ title = "Konfirmasi", message, confirmLabel = "Ya, lanjutkan", danger = false }) {
    return new Promise<boolean>((resolve) => {
      set({ open: true, title, message, confirmLabel, danger, resolve });
    });
  },

  answer(value) {
    const { resolve } = get();
    set({ open: false, resolve: null });
    resolve?.(value);
  },
}));
