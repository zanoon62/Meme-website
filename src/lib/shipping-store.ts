/**
 * Live Shipping Zones & Governorates Store
 * 
 * Provides dynamic management of Egyptian shipping zones, governorate mapping,
 * and live persistence for both Admin Settings and Checkout.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SHIPPING_ZONES as DEFAULT_ZONES, type ShippingZone } from "@/lib/format";

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
  addZone: (zone: Omit<ShippingZone, "id">) => void;
  updateZone: (id: string, patch: Partial<ShippingZone>) => void;
  deleteZone: (id: string) => void;
  resetToDefaults: () => void;
}

export const useShippingStore = create<ShippingStoreState>()(
  persist(
    (set) => ({
      zones: DEFAULT_ZONES,
      addZone: (zoneData) => {
        const id = `zone-${Date.now()}`;
        set((state) => ({
          zones: [...state.zones, { ...zoneData, id }],
        }));
      },
      updateZone: (id, patch) => {
        set((state) => ({
          zones: state.zones.map((z) => (z.id === id ? { ...z, ...patch } : z)),
        }));
      },
      deleteZone: (id) => {
        set((state) => ({
          zones: state.zones.filter((z) => z.id !== id),
        }));
      },
      resetToDefaults: () => {
        set({ zones: DEFAULT_ZONES });
      },
    }),
    {
      name: "meme-shipping-zones-v1",
    }
  )
);

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
