"use client";

import * as React from "react";
import { useProductStore } from "@/components/providers/product-store";
import { useHomepageStore } from "@/components/providers/homepage-store";

const STALE_MS = 60_000; // 60 seconds — only refetch if data is this old

export function StoreProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const productState = useProductStore.getState();
    const homepageState = useHomepageStore.getState();

    // Only refetch products if we have no data, or if it's been over 60s since last fetch
    const productStale =
      productState.products.length === 0 ||
      !productState._lastFetch ||
      Date.now() - productState._lastFetch > STALE_MS;

    if (productStale) {
      productState.refreshFromServer();
    }

    // Homepage content changes rarely — use 5 minute staleness window
    const homepageStale =
      !homepageState._lastFetch ||
      Date.now() - homepageState._lastFetch > STALE_MS * 5;

    if (homepageStale) {
      homepageState.fetchFromServer();
    }
  }, []);

  return <>{children}</>;
}
