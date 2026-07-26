"use client";

import * as React from "react";
import { useProductStore } from "@/components/providers/product-store";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    useProductStore.getState().refreshFromServer();
  }, []);

  return <>{children}</>;
}
