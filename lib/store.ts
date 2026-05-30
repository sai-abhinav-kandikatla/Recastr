"use client";

import { create } from "zustand";
import type { Platform, Tone } from "@/lib/types";

type RecastrState = {
  activePlatform: Platform;
  previewMode: "light" | "dark";
  selectedTone: Tone;
  rightPanelOpen: boolean;
  approvedOutputIds: string[];
  setActivePlatform: (platform: Platform) => void;
  setPreviewMode: (mode: "light" | "dark") => void;
  setSelectedTone: (tone: Tone) => void;
  toggleRightPanel: () => void;
  approveOutput: (outputId: string) => void;
};

export const useRecastrStore = create<RecastrState>((set) => ({
  activePlatform: "LINKEDIN",
  previewMode: "light",
  selectedTone: "Professional",
  rightPanelOpen: true,
  approvedOutputIds: [],
  setActivePlatform: (platform) => set({ activePlatform: platform }),
  setPreviewMode: (mode) => set({ previewMode: mode }),
  setSelectedTone: (tone) => set({ selectedTone: tone }),
  toggleRightPanel: () =>
    set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  approveOutput: (outputId) =>
    set((state) => ({
      approvedOutputIds: state.approvedOutputIds.includes(outputId)
        ? state.approvedOutputIds
        : [...state.approvedOutputIds, outputId],
    })),
}));
