"use client";

import * as React from "react";

// Zustand stores are global singletons, no provider needed.
// This wrapper is kept for context consistency and future extensions.
export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
