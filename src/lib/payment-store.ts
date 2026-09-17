"use client";

/**
 * Payment Settings Store
 *
 * Admin-managed Vodafone Cash & InstaPay receiver details shown to
 * customers at checkout. Backed by the `payment_settings` singleton table
 * (same pattern as homepage-store.ts / homepage_settings) so every admin,
 * browser, and the checkout page itself all see the same numbers —
 * previously this was a localStorage-only Zustand store, which meant a
 * different browser/device never saw the same numbers and the customer's
 * checkout page never saw admin edits at all.
 *
 * The store only accepts 3 payment methods total: InstaPay, Vodafone Cash,
 * and Cash on Delivery — no PayMob/card gateway.
 */

import { create } from "zustand";
import { isBackendConfigured } from "@/lib/config/backend";

export interface PaymentSettingsConfig {
  vodafoneCashNumber: string;
  vodafoneCashInstructionsAr: string;
  vodafoneCashInstructionsEn: string;

  instapayAddress: string; // e.g. suitedbymeme@instapay
  instapayPhone: string;
  instapayAccountName: string;
}

const DEFAULT_CONFIG: PaymentSettingsConfig = {
  vodafoneCashNumber: "01098765432",
  vodafoneCashInstructionsAr:
    "يرجى تحويل المبلغ الإجمالي إلى رقم فودافون كاش أعلاه، ثم إرفاق صورة التحويل.",
  vodafoneCashInstructionsEn:
    "Please transfer the total amount to the Vodafone Cash number above, then attach a screenshot of the transfer.",

  instapayAddress: "suitedbymeme@instapay",
  instapayPhone: "01098765432",
  instapayAccountName: "SUITED BY MEME Atelier",
};

type PaymentStoreState = {
  config: PaymentSettingsConfig;
  loading: boolean;
  saving: boolean;
  hydrated: boolean;

  fetchFromServer: () => Promise<void>;
  saveConfig: (config: PaymentSettingsConfig) => Promise<void>;
};

export const usePaymentStore = create<PaymentStoreState>()((set) => ({
  config: DEFAULT_CONFIG,
  loading: false,
  saving: false,
  hydrated: false,

  fetchFromServer: async () => {
    try {
      set({ loading: true });
      const res = await fetch("/api/payment-settings");
      if (res.ok) {
        const data = await res.json();
        if (data?.config) {
          set({ config: { ...DEFAULT_CONFIG, ...data.config }, loading: false, hydrated: true });
          return;
        }
      }
      set({ loading: false, hydrated: true });
    } catch (e) {
      console.error("fetchFromServer (payment settings) failed:", e);
      set({ loading: false, hydrated: true });
    }
  },

  saveConfig: async (config) => {
    set({ config, saving: true });
    if (isBackendConfigured()) {
      try {
        const res = await fetch("/api/admin/payment-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.warn("Save payment settings failed:", err);
        }
      } catch (e) {
        console.warn("Save payment settings error:", e);
      }
    }
    set({ saving: false });
  },
}));
