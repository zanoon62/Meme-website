"use client";

import * as React from "react";
import { useProductStore } from "@/components/providers/product-store";
import type { Product } from "@/components/providers/ui-provider";

export function StoreInitializer({ products }: { products: Product[] }) {
  const initialized = React.useRef(false);
  
  if (!initialized.current) {
    useProductStore.setState({ 
      products, 
      hydrated: true,
      _lastFetch: Date.now() 
    });
    initialized.current = true;
  }
  
  return null;
}
