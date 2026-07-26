"use client";

import * as React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============ Types ============
export type ProductColor = {
  name: string;
  hex: string;
};

export type ProductSize = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "ONE SIZE";

export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  category: string;
  collection: string;
  colors: ProductColor[];
  sizes: ProductSize[];
  images: string[];
  badges?: string[];
  rating: number;
  reviewCount: number;
  inventory: number;
  material: string;
  care: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isLimited?: boolean;
  tags: string[];
};

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  color: string;
  size: ProductSize;
  price: number;
  quantity: number;
};

export type WishlistItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  addedAt: number;
};

// ============ UI Store (drawer / sheet state) ============
type UIState = {
  cartOpen: boolean;
  searchOpen: boolean;
  menuOpen: boolean;
  wishlistOpen: boolean;
  setCartOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  setWishlistOpen: (v: boolean) => void;
};

export const useUI = create<UIState>((set) => ({
  cartOpen: false,
  searchOpen: false,
  menuOpen: false,
  wishlistOpen: false,
  setCartOpen: (v) => set({ cartOpen: v }),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setMenuOpen: (v) => set({ menuOpen: v }),
  setWishlistOpen: (v) => set({ wishlistOpen: v }),
}));

// ============ Cart Store ============
type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  remove: (productId: string, color: string, size: ProductSize) => void;
  updateQty: (productId: string, color: string, size: ProductSize, qty: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find(
            (l) =>
              l.productId === line.productId &&
              l.color === line.color &&
              l.size === line.size
          );
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l === existing ? { ...l, quantity: l.quantity + quantity } : l
              ),
            };
          }
          return { lines: [...state.lines, { ...line, quantity }] };
        }),
      remove: (productId, color, size) =>
        set((state) => ({
          lines: state.lines.filter(
            (l) =>
              !(l.productId === productId && l.color === color && l.size === size)
          ),
        })),
      updateQty: (productId, color, size, qty) =>
        set((state) => ({
          lines: state.lines
            .map((l) =>
              l.productId === productId && l.color === color && l.size === size
                ? { ...l, quantity: Math.max(0, qty) }
                : l
            )
            .filter((l) => l.quantity > 0),
        })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "meme-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: false,
    }
  )
);

// ============ Wishlist Store ============
type WishlistState = {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      toggle: (item) =>
        set((state) => {
          const exists = state.items.find((i) => i.productId === item.productId);
          if (exists) {
            return {
              items: state.items.filter((i) => i.productId !== item.productId),
            };
          }
          return { items: [...state.items, item] };
        }),
      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "meme-wishlist",
      storage: createJSONStorage(() => localStorage),
      skipHydration: false,
    }
  )
);

// ============ Derived selectors ============
export function useCartCount(): number {
  return useCart((s) => s.lines.reduce((acc, l) => acc + l.quantity, 0));
}

export function useCartSubtotal(): number {
  return useCart((s) => s.lines.reduce((acc, l) => acc + l.price * l.quantity, 0));
}

export function useWishlistCount(): number {
  return useWishlist((s) => s.items.length);
}

export function useWishlistHas(productId: string): boolean {
  return useWishlist((s) => s.items.some((i) => i.productId === productId));
}

// ============ Provider shims (kept for backwards-compat with StoreProvider) ============
export function UIProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
