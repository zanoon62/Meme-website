"use client";

import * as React from "react";
import { useProductStore } from "@/components/providers/product-store";
import { useHomepageStore } from "@/components/providers/homepage-store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    useProductStore.getState().refreshFromServer();
    useHomepageStore.getState().fetchFromServer();
  }, []);

  return <>{children}</>;
}
