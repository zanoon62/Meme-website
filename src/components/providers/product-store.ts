"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product, ProductColor, ProductSize } from "@/components/providers/ui-provider";
import { products as seedProducts } from "@/data/products";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { dbProductToStore, storeProductToDb } from "@/lib/api/products";

/**
 * AdminProductStore
 *
 * Hybrid store:
 * - When Supabase is configured, all mutations go through Supabase
 *   (client-side insert/update/delete via the browser client).
 * - When Supabase is NOT configured (e.g. local preview without env),
 *   mutations fall back to localStorage so the demo still works.
 *
 * The storefront reads via useLiveProducts() which is refreshed from
 * Supabase on mount when configured.
 */

type ProductInput = Omit<Product, "id" | "rating" | "reviewCount"> & {
  id?: string;
  rating?: number;
  reviewCount?: number;
};

type ProductStore = {
  products: Product[];
  hydrated: boolean;
  loading: boolean;
  setHydrated: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  setProducts: (p: Product[]) => void;

  /** Pull the latest catalog from Supabase (no-op if not configured) */
  refreshFromServer: () => Promise<void>;

  /** CRUD — calls Supabase if configured, otherwise mutates local state */
  addProduct: (input: ProductInput) => Promise<Product>;
  updateProduct: (id: string, patch: Partial<ProductInput>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  resetToSeed: () => Promise<void>;

  getBySlug: (slug: string) => Product | undefined;
  getById: (id: string) => Product | undefined;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function genId(): string {
  return "p-" + Math.random().toString(36).slice(2, 9);
}

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=85&auto=format&fit=crop";

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: seedProducts,
      hydrated: false,
      loading: false,
      setHydrated: (v) => set({ hydrated: v }),
      setLoading: (v) => set({ loading: v }),
      setProducts: (p) => set({ products: p }),

      refreshFromServer: async () => {
        if (!isSupabaseConfigured()) return;
        try {
          set({ loading: true });
          const supabase = createSupabaseBrowserClient();
          const [{ data: rows, error }, { data: images }] = await Promise.all([
            supabase
              .from("products")
              .select("*")
              .order("created_at", { ascending: false }),
            supabase
              .from("product_images")
              .select("product_id, url, sort_order")
              .order("sort_order", { ascending: true }),
          ]);
          if (error || !rows) return;

          const imageMap = new Map<string, string[]>();
          for (const img of images ?? []) {
            const arr = imageMap.get(img.product_id) ?? [];
            arr.push(img.url);
            imageMap.set(img.product_id, arr);
          }

          const products: Product[] = rows.map((p) => ({
            ...dbProductToStore(p),
            images: imageMap.get(p.id) ?? [PLACEHOLDER_IMG],
          }));
          set({ products, loading: false });
        } catch (e) {
          console.error("refreshFromServer failed:", e);
          set({ loading: false });
        }
      },

      addProduct: async (input) => {
        if (isSupabaseConfigured()) {
          const supabase = createSupabaseBrowserClient();
          const payload = storeProductToDb(input);
          const { data, error } = await supabase
            .from("products")
            .insert(payload as never)
            .select()
            .single();
          if (error) throw new Error(error.message);
          // Insert images
          if (data && input.images?.length) {
            await supabase
              .from("product_images")
              .insert(
                input.images.map((url, i) => ({
                  product_id: data.id,
                  url,
                  sort_order: i,
                  is_primary: i === 0,
                  alt: input.name,
                })) as never
              );
          }
          const newProduct: Product = {
            ...dbProductToStore(data),
            images: input.images?.length ? input.images : [PLACEHOLDER_IMG],
          };
          set((s) => ({ products: [newProduct, ...s.products] }));
          return newProduct;
        }

        // Local fallback
        const product: Product = {
          id: input.id ?? genId(),
          slug: input.slug || slugify(input.name),
          name: input.name,
          subtitle: input.subtitle,
          description: input.description,
          price: Number(input.price) || 0,
          compareAtPrice: input.compareAtPrice ? Number(input.compareAtPrice) : undefined,
          currency: input.currency || "EGP",
          category: input.category,
          collection: input.collection,
          colors: input.colors,
          sizes: input.sizes,
          images: input.images.length ? input.images : [PLACEHOLDER_IMG],
          badges: input.badges ?? [],
          rating: input.rating ?? 5,
          reviewCount: input.reviewCount ?? 0,
          inventory: Number(input.inventory) || 0,
          material: input.material,
          care: input.care,
          isNew: input.isNew,
          isBestSeller: input.isBestSeller,
          isTrending: input.isTrending,
          isLimited: input.isLimited,
          tags: input.tags,
        };
        set((s) => ({ products: [product, ...s.products] }));
        return product;
      },

      updateProduct: async (id, patch) => {
        if (isSupabaseConfigured()) {
          const supabase = createSupabaseBrowserClient();
          const payload = storeProductToDb(patch);
          // Don't send undefined fields
          Object.keys(payload).forEach((k) =>
            (payload as Record<string, unknown>)[k] === undefined
              ? delete (payload as Record<string, unknown>)[k]
              : null
          );
          const { error } = await supabase
            .from("products")
            .update(payload as never)
            .eq("id", id);
          if (error) throw new Error(error.message);

          // Replace images if provided
          if (patch.images) {
            await supabase.from("product_images").delete().eq("product_id", id);
            if (patch.images.length) {
              await supabase.from("product_images").insert(
                patch.images.map((url, i) => ({
                  product_id: id,
                  url,
                  sort_order: i,
                  is_primary: i === 0,
                  alt: patch.name,
                })) as never
              );
            }
          }
        }

        set((s) => ({
          products: s.products.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...patch,
                  price: patch.price !== undefined ? Number(patch.price) : p.price,
                  compareAtPrice:
                    patch.compareAtPrice !== undefined
                      ? patch.compareAtPrice
                        ? Number(patch.compareAtPrice)
                        : undefined
                      : p.compareAtPrice,
                  inventory:
                    patch.inventory !== undefined ? Number(patch.inventory) : p.inventory,
                }
              : p
          ),
        }));
      },

      deleteProduct: async (id) => {
        if (isSupabaseConfigured()) {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase.from("products").delete().eq("id", id);
          if (error) throw new Error(error.message);
        }
        set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
      },

      resetToSeed: async () => {
        if (isSupabaseConfigured()) {
          // For safety, do NOT delete from Supabase on reset.
          // Just refetch.
          await get().refreshFromServer();
          return;
        }
        set({ products: seedProducts });
      },

      getBySlug: (slug) => get().products.find((p) => p.slug === slug),
      getById: (id) => get().products.find((p) => p.id === id),
    }),
    {
      name: "meme-admin-products",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (s) => ({ products: s.products }),
    }
  )
);

// Convenience hook for components that just want the live list
export function useLiveProducts(): Product[] {
  return useProductStore((s) => s.products);
}

export type { ProductInput, ProductColor, ProductSize };
