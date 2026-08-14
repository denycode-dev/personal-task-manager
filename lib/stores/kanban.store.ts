"use client";
import { create } from "zustand";

type ActiveDrag = { type: "card" | "column"; id: string } | null;

type KanbanStore = {
  activeDrag: ActiveDrag;
  setActiveDrag: (drag: ActiveDrag) => void;
};

export const useKanbanStore = create<KanbanStore>((set) => ({
  activeDrag: null,
  setActiveDrag: (drag) => set({ activeDrag: drag }),
}));
