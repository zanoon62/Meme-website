"use client";

/**
 * Live Shipping Zones & Governorates Store
 *
 * Provides dynamic management of Egyptian shipping zones, governorate
 * mapping, backed by the `shipping_settings` singleton table (same pattern
 * as payment-store.ts / payment_settings) — previously localStorage-only,
 * so an admin's rate change never reached checkout in another browser/device.
 */

import { create } from "zustand";
import { SHIPPING_ZONES as DEFAULT_ZONES, type ShippingZone } from "@/lib/format";
import { isBackendConfigured } from "@/lib/config/backend";

export interface EgyptianGovernorate {
  id: string;
  nameEn: string;
  nameAr: string;
  defaultZoneId: string;
}

export const EGYPTIAN_GOVERNORATES: EgyptianGovernorate[] = [
  { id: "cairo", nameEn: "Cairo", nameAr: "القاهرة", defaultZoneId: "cairo" },
  { id: "giza", nameEn: "Giza", nameAr: "الجيزة", defaultZoneId: "cairo" },
  { id: "alex", nameEn: "Alexandria", nameAr: "الإسكندرية", defaultZoneId: "alex" },
  { id: "dakahlia", nameEn: "Dakahlia (Mansoura)", nameAr: "الدقهلية (المنصورة)", defaultZoneId: "delta" },
  { id: "gharbia", nameEn: "Gharbia (Tanta)", nameAr: "الغربية (طنطا)", defaultZoneId: "delta" },
  { id: "qalyubia", nameEn: "Qalyubia (Banha)", nameAr: "القليوبية (بنها)", defaultZoneId: "cairo" },
  { id: "sharqia", nameEn: "Sharqia (Zagazig)", nameAr: "الشرقية (الزقازيق)", defaultZoneId: "delta" },
  { id: "monufia", nameEn: "Monufia (Shibin El Kom)", nameAr: "المنوفية (شبين الكوم)", defaultZoneId: "delta" },
  { id: "beheira", nameEn: "Beheira (Damanhour)", nameAr: "البحيرة (دمنهور)", defaultZoneId: "delta" },
  { id: "kafr_el_sheikh", nameEn: "Kafr El Sheikh", nameAr: "كفر الشيخ", defaultZoneId: "delta" },
  { id: "damietta", nameEn: "Damietta", nameAr: "دمياط", defaultZoneId: "delta" },
  { id: "port_said", nameEn: "Port Said", nameAr: "بورسعيد", defaultZoneId: "delta" },
  { id: "ismailia", nameEn: "Ismailia", nameAr: "الإسماعيلية", defaultZoneId: "delta" },
  { id: "suez", nameEn: "Suez", nameAr: "السويس", defaultZoneId: "delta" },
  { id: "faiyum", nameEn: "Faiyum", nameAr: "الفيوم", defaultZoneId: "delta" },
  { id: "beni_suef", nameEn: "Beni Suef", nameAr: "بني سويف", defaultZoneId: "delta" },
  { id: "minya", nameEn: "Minya", nameAr: "المنيا", defaultZoneId: "upper" },
  { id: "asyut", nameEn: "Asyut", nameAr: "أسيوط", defaultZoneId: "upper" },
  { id: "sohag", nameEn: "Sohag", nameAr: "سوهاج", defaultZoneId: "upper" },
  { id: "qena", nameEn: "Qena", nameAr: "قنا", defaultZoneId: "upper" },
  { id: "luxor", nameEn: "Luxor", nameAr: "الأقصر", defaultZoneId: "upper" },
  { id: "aswan", nameEn: "Aswan", nameAr: "أسوان", defaultZoneId: "upper" },
  { id: "red_sea", nameEn: "Red Sea (Hurghada / Safaga)", nameAr: "البحر الأحمر (الغردقة / سفاجا)", defaultZoneId: "redsea" },
  { id: "south_sinai", nameEn: "South Sinai (Sharm El Sheikh / Dahab)", nameAr: "جنوب سيناء (شرم الشيخ / دهب)", defaultZoneId: "redsea" },
  { id: "north_sinai", nameEn: "North Sinai (Arish)", nameAr: "شمال سيناء (العريش)", defaultZoneId: "redsea" },
  { id: "matrouh", nameEn: "Matrouh & North Coast", nameAr: "مطروح والساحل الشمالي", defaultZoneId: "redsea" },
  { id: "new_valley", nameEn: "New Valley (El Kharga)", nameAr: "الوادي الجديد (الخارجة)", defaultZoneId: "upper" },
];

interface ShippingStoreState {
  zones: ShippingZone[];
  loading: boolean;
  saving: boolean;
  hydrated: boolean;

  fetchFromServer: () => Promise<void>;
  addZone: (zone: Omit<ShippingZone, "id">) => Promise<void>;
  updateZone: (id: string, patch: Partial<ShippingZone>) => Promise<void>;
  deleteZone: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

async function persistZones(zones: ShippingZone[]) {
  if (!isBackendConfigured()) return;
  try {
    const res = await fetch("/api/admin/shipping-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: { zones } }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn("Save shipping zones failed:", err);
    }
  } catch (e) {
    console.warn("Save shipping zones error:", e);
  }
}

export const useShippingStore = create<ShippingStoreState>()((set, get) => ({
  zones: DEFAULT_ZONES,
  loading: false,
  saving: false,
  hydrated: false,

  fetchFromServer: async () => {
    try {
      set({ loading: true });
      const res = await fetch("/api/shipping-settings");
      if (res.ok) {
        const data = await res.json();
        const zones = data?.config?.zones;
        if (Array.isArray(zones) && zones.length > 0) {
          set({ zones, loading: false, hydrated: true });
          return;
        }
      }
      set({ loading: false, hydrated: true });
    } catch (e) {
      console.error("fetchFromServer (shipping settings) failed:", e);
      set({ loading: false, hydrated: true });
    }
  },

  addZone: async (zoneData) => {
    const id = `zone-${Date.now()}`;
    const zones = [...get().zones, { ...zoneData, id }];
    set({ zones, saving: true });
    await persistZones(zones);
    set({ saving: false });
  },

  updateZone: async (id, patch) => {
    const zones = get().zones.map((z) => (z.id === id ? { ...z, ...patch } : z));
    set({ zones, saving: true });
    await persistZones(zones);
    set({ saving: false });
  },

  deleteZone: async (id) => {
    const zones = get().zones.filter((z) => z.id !== id);
    set({ zones, saving: true });
    await persistZones(zones);
    set({ saving: false });
  },

  resetToDefaults: async () => {
    set({ zones: DEFAULT_ZONES, saving: true });
    await persistZones(DEFAULT_ZONES);
    set({ saving: false });
  },
}));

/** Auto-detect matching zone ID from governorate input string or ID */
export function getZoneForGovernorate(governorateNameOrId: string, zones: ShippingZone[] = DEFAULT_ZONES): ShippingZone {
  if (!governorateNameOrId) return zones[0];

  const lower = governorateNameOrId.toLowerCase().trim();
  const gov = EGYPTIAN_GOVERNORATES.find(
    (g) =>
      g.id.toLowerCase() === lower ||
      g.nameEn.toLowerCase().includes(lower) ||
      g.nameAr.includes(governorateNameOrId)
  );

  const targetZoneId = gov ? gov.defaultZoneId : "cairo";
  const matched = zones.find((z) => z.id === targetZoneId);
  return matched || zones[0];
}
