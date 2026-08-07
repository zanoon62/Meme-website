"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface StoreSettingsState {
  name: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  currency: string;
  timezone: string;
  instagram: string;
  instagramHandle: string;
  domain: string;
  address: string;

  updateSettings: (settings: Partial<Omit<StoreSettingsState, "updateSettings" | "resetToDefaults">>) => void;
  resetToDefaults: () => void;
}

export const DEFAULT_STORE_SETTINGS = {
  name: "MEME Atelier",
  tagline: "Tailored for the modern Egyptian woman",
  description:
    "Premium women's fashion — Italian wool tailoring, cashmere knits, and silk dresses designed to outlive every trend cycle. Designed in Cairo.",
  email: "orders@meme-eg.store",
  phone: "+20 100 000 0000",
  currency: "EGP",
  timezone: "Africa/Cairo",
  instagram: "https://instagram.com/suited_by_meme",
  instagramHandle: "@suited_by_meme",
  domain: "meme-eg.store",
  address: "12 Taha Hussein St. · Zamalek · Cairo · Egypt",
};

export const useStoreSettingsStore = create<StoreSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_STORE_SETTINGS,
      updateSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
      resetToDefaults: () => set(DEFAULT_STORE_SETTINGS),
    }),
    {
      name: "meme-store-settings-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
