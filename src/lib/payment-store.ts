/**
 * Live Payment Settings Store
 * 
 * Manages PayMob keys, Vodafone Cash wallet details, InstaPay address,
 * and enabled payment methods across Admin Settings and Checkout.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PaymentStoreState {
  // PayMob Integration
  paymobEnabled: boolean;
  paymobApiKey: string;
  paymobIntegrationId: string;
  paymobFrameId: string;
  paymobHmacSecret: string;
  paymobTestMode: boolean;

  // Vodafone Cash
  vodafoneCashEnabled: boolean;
  vodafoneCashNumber: string;
  vodafoneCashInstructionsAr: string;
  vodafoneCashInstructionsEn: string;

  // InstaPay
  instapayEnabled: boolean;
  instapayAddress: string; // e.g. suitedbymeme@instapay
  instapayPhone: string;
  instapayAccountName: string;

  // COD
  codEnabled: boolean;
  codFee: number;

  // Actions
  updatePaymob: (patch: Partial<Pick<PaymentStoreState, "paymobEnabled" | "paymobApiKey" | "paymobIntegrationId" | "paymobFrameId" | "paymobHmacSecret" | "paymobTestMode">>) => void;
  updateVodafoneCash: (patch: Partial<Pick<PaymentStoreState, "vodafoneCashEnabled" | "vodafoneCashNumber" | "vodafoneCashInstructionsAr" | "vodafoneCashInstructionsEn">>) => void;
  updateInstapay: (patch: Partial<Pick<PaymentStoreState, "instapayEnabled" | "instapayAddress" | "instapayPhone" | "instapayAccountName">>) => void;
  updateCod: (patch: Partial<Pick<PaymentStoreState, "codEnabled" | "codFee">>) => void;
}

export const usePaymentStore = create<PaymentStoreState>()(
  persist(
    (set) => ({
      paymobEnabled: true,
      paymobApiKey: "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJbXRwWkNJNkkyTmlNakps...",
      paymobIntegrationId: "4820193",
      paymobFrameId: "812049",
      paymobHmacSecret: "sec_live_9f81a7d62b...",
      paymobTestMode: true,

      vodafoneCashEnabled: true,
      vodafoneCashNumber: "01098765432",
      vodafoneCashInstructionsAr: "يرجى تحويل المبلغ الإجمالي إلى رقم فودافون كاش أعلاه، ثم إرفاق رقم الهاتف المحول منه أو صورة التحويل.",
      vodafoneCashInstructionsEn: "Please transfer the total amount to the Vodafone Cash number above, then enter your transfer sender number.",

      instapayEnabled: true,
      instapayAddress: "suitedbymeme@instapay",
      instapayPhone: "01098765432",
      instapayAccountName: "SUITED BY MEME Atelier",

      codEnabled: true,
      codFee: 25,

      updatePaymob: (patch) => set((s) => ({ ...s, ...patch })),
      updateVodafoneCash: (patch) => set((s) => ({ ...s, ...patch })),
      updateInstapay: (patch) => set((s) => ({ ...s, ...patch })),
      updateCod: (patch) => set((s) => ({ ...s, ...patch })),
    }),
    {
      name: "meme-payment-settings-v1",
    }
  )
);
