"use client";

import * as React from "react";
import Link from "next/link";
import { SmartImage as Image } from "@/components/ui/smart-image";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useUI } from "@/components/providers/ui-provider";
import { useLiveProducts } from "@/components/providers/product-store";
import { formatPrice } from "@/lib/format";

/**
 * Live product search — filters the same Zustand product store the rest of
 * the storefront reads from (kept in sync via refreshFromServer()), so a
 * product the admin just deleted or repriced never shows stale here. No
 * separate search index or API call: the catalog is small enough that an
 * in-memory filter over the already-loaded list is instant.
 */
export function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useUI();
  const products = useLiveProducts();
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (searchOpen) {
      setQuery("");
      // Focus after the dialog's mount/animation.
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [searchOpen]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.tags?.some((tag) => tag.toLowerCase().includes(q))
        );
      })
      .slice(0, 8);
  }, [products, query]);

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl w-[95vw] p-0 gap-0 top-[12%] translate-y-0 overflow-hidden rounded-2xl"
      >
        <DialogTitle className="sr-only">Search products</DialogTitle>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="border-0 shadow-none focus-visible:ring-0 h-9 px-0 text-base"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim() === "" ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Start typing to search the collection
            </p>
          ) : results.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No products found for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {results.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/product/${p.slug}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-accent/40 transition-colors"
                  >
                    <div className="relative w-12 h-14 rounded-sm overflow-hidden bg-accent shrink-0">
                      {p.images[0] && (
                        <Image src={p.images[0]} alt={p.name} fill sizes="48px" className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </div>
                    <span className="text-sm font-medium shrink-0">{formatPrice(p.price, p.currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
