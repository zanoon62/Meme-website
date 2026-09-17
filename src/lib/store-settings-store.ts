"use client";

/**
 * Store Profile Settings — name/tagline/contact info shown in the footer
 * and elsewhere. Backed by the `store_settings` singleton table (same
 * pattern as payment-store.ts / payment_settings) so an admin's edit
 * reaches every browser/device instead of staying trapped in the admin's
 * own localStorage.
 */

import { create } from "zustand";
import { isBackendConfigured } from "@/lib/config/backend";

export interface StoreSettingsConfig {
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
}

export const DEFAULT_STORE_SETTINGS: StoreSettingsConfig = {
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

type StoreSettingsStoreState = {
  config: StoreSettingsConfig;
  loading: boolean;
  saving: boolean;
  hydrated: boolean;

  fetchFromServer: () => Promise<void>;
  saveConfig: (config: StoreSettingsConfig) => Promise<void>;
};

export const useStoreSettingsStore = create<StoreSettingsStoreState>()((set) => ({
  config: DEFAULT_STORE_SETTINGS,
  loading: false,
  saving: false,
  hydrated: false,

  fetchFromServer: async () => {
    try {
      set({ loading: true });
      const res = await fetch("/api/store-settings");
      if (res.ok) {
        const data = await res.json();
        if (data?.config) {
          set({ config: { ...DEFAULT_STORE_SETTINGS, ...data.config }, loading: false, hydrated: true });
          return;
        }
      }
      set({ loading: false, hydrated: true });
    } catch (e) {
      console.error("fetchFromServer (store settings) failed:", e);
      set({ loading: false, hydrated: true });
    }
  },

  saveConfig: async (config) => {
    set({ config, saving: true });
    if (isBackendConfigured()) {
      try {
        const res = await fetch("/api/admin/store-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.warn("Save store settings failed:", err);
        }
      } catch (e) {
        console.warn("Save store settings error:", e);
      }
    }
    set({ saving: false });
  },
}));
