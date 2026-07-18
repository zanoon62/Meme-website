"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Lang = "en" | "ar";

const LANGS: { code: Lang; label: string; native: string; flag: string }[] = [
  { code: "en", label: "English", native: "English", flag: "EN" },
  { code: "ar", label: "Arabic", native: "العربية", flag: "AR" },
];

// Lightweight language state shared across the storefront.
// In production, this would sync with next-intl or a cookie.
const LANG_KEY = "meme-lang";
let currentLang: Lang = "en";
const listeners = new Set<(l: Lang) => void>();

export function setLang(l: Lang) {
  currentLang = l;
  if (typeof window !== "undefined") {
    localStorage.setItem(LANG_KEY, l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  }
  listeners.forEach((fn) => fn(l));
}

export function getLang(): Lang {
  return currentLang;
}

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, set] = React.useState<Lang>(currentLang);
  React.useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(LANG_KEY)) as Lang | null;
    if (stored && stored !== currentLang) {
      setLang(stored);
      set(stored);
    }
    const fn = (l: Lang) => set(l);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return [lang, setLang];
}

export function LanguageToggle() {
  const [lang, set] = useLang();
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Switch language">
          <Globe className="h-[1.1rem] w-[1.1rem]" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => set(l.code)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              l.code === lang && "bg-accent"
            )}
          >
            <span className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted">{l.flag}</span>
              <span>{l.native}</span>
            </span>
            {l.code === lang && <span className="text-xs text-muted-foreground">✓</span>}
          </DropdownMenuItem>
        ))}
        <div className="px-2 py-1.5 text-[10px] text-muted-foreground border-t border-border mt-1">
          Currency: EGP (ج.م)
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
