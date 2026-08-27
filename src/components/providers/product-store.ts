"use client";

import * as React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product, ProductColor, ProductSize } from "@/components/providers/ui-provider";
import { products as seedProducts } from "@/data/products";
import { isBackendConfigured } from "@/lib/config/backend";
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
  _lastFetch: number;
  setHydrated: (v: boolean) => void;
  setLoading: (v: boolean) => void;
  setProducts: (p: Product[]) => void;

  /** Pull the latest catalog from Supabase (no-op if not configured) */
  refreshFromServer: (force?: boolean) => Promise<void>;

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
      // When Supabase is configured, start with an empty list — refreshFromServer()
      // will populate from the real database. When not configured (local dev),
      // use the seed catalog so the UI still renders for development/preview.
      products: isBackendConfigured() ? [] : seedProducts,
      hydrated: false,
      loading: false,
      _lastFetch: 0,
      setHydrated: (v) => set({ hydrated: v }),
      setLoading: (v) => set({ loading: v }),
      setProducts: (p) => set({ products: p }),

      refreshFromServer: async (force = false) => {
        try {
          const now = Date.now();
          if (!force && now - get()._lastFetch < 60000 && get().products.length > 0) {
            return; // Use stale-while-revalidate strategy in background or skip
          }
          set({ loading: true });
          const res = await fetch("/api/products?v=2");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data?.products)) {
              set({ 
                products: data.products, 
                loading: false, 
                _lastFetch: Date.now() 
              });
              return;
            }
          }
          set({ loading: false });
        } catch (e) {
          console.error("refreshFromServer failed:", e);
          set({ loading: false });
        }
      },

      addProduct: async (input) => {
        if (isBackendConfigured()) {
          try {
            const res = await fetch("/api/admin/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input),
            });
            if (res.ok) {
              const data = await res.json();
              if (data?.product) {
                const newProduct: Product = {
                  ...dbProductToStore(data.product),
                  images: input.images?.length ? input.images : [PLACEHOLDER_IMG],
                };
                set((s) => ({ products: [newProduct, ...s.products] }));
                return newProduct;
              }
            } else {
              const err = await res.json().catch(() => ({}));
              console.warn("API product create returned error, using fallback:", err);
            }
          } catch (e) {
            console.warn("API product create failed, using fallback:", e);
          }
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
        if (isBackendConfigured()) {
          try {
            await fetch(`/api/admin/products/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(patch),
            });
          } catch (e) {
            console.warn("API product update failed:", e);
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
        if (isBackendConfigured()) {
          try {
            await fetch(`/api/admin/products/${id}`, {
              method: "DELETE",
            });
          } catch (e) {
            console.warn("API product delete failed:", e);
          }
        }
        set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
      },

      resetToSeed: async () => {
        if (isBackendConfigured()) {
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
        // When Supabase is active, discard any cached localStorage products
        // (which may be old seed/fake products) so only real DB data shows.
        if (isBackendConfigured()) {
          state?.setProducts([]);
        }
      },
      // Only persist products in local (non-Supabase) mode
      partialize: (s) => ({ products: isBackendConfigured() ? [] : s.products }),
    }
  )
);

// Convenience hook for components that just want the live list
export function useLiveProducts(): Product[] {
  return useProductStore((s) => s.products);
}

export type CategoryItem = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
};

// Hook for fetching active categories for storefront UI (header, shop page, homepage)
export function useLiveCategories(): CategoryItem[] {
  const products = useLiveProducts();
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);

  React.useEffect(() => {
    let mounted = true;
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : { categories: [] }))
      .then((data) => {
        if (!mounted) return;
        const dbCats: CategoryItem[] = data.categories ?? [];
        if (dbCats.length > 0) {
          // Keep only active categories
          setCategories(dbCats.filter((c) => c.is_active !== false));
        } else {
          // Fallback: derive from live products if no categories DB rows exist
          const seen = new Set<string>();
          const fallback: CategoryItem[] = [];
          for (const p of products) {
            if (p.category && !seen.has(p.category)) {
              seen.add(p.category);
              fallback.push({
                id: p.category,
                slug: p.category.toLowerCase().replace(/\s+/g, "-"),
                name: p.category,
                is_active: true,
              });
            }
          }
          setCategories(fallback);
        }
      })
      .catch(() => {
        if (!mounted) return;
        const seen = new Set<string>();
        const fallback: CategoryItem[] = [];
        for (const p of products) {
          if (p.category && !seen.has(p.category)) {
            seen.add(p.category);
            fallback.push({
              id: p.category,
              slug: p.category.toLowerCase().replace(/\s+/g, "-"),
              name: p.category,
              is_active: true,
            });
          }
        }
        setCategories(fallback);
      });

    return () => {
      mounted = false;
    };
  }, [products]);

  return categories;
}

export type { ProductInput, ProductColor, ProductSize };

