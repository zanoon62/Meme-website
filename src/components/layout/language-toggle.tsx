"use client";

import * as React from "react";
import { useSyncExternalStore } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type Lang = "en" | "ar";

const LANGS: { code: Lang; label: string; native: string; flag: string }[] = [
  { code: "en", label: "English", native: "English", flag: "EN" },
  { code: "ar", label: "Arabic", native: "العربية", flag: "AR" },
];

const LANG_KEY = "meme-lang";

function getStoredLang(): Lang {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LANG_KEY);
      if (stored === "ar" || stored === "en") return stored;
    } catch {}
  }
  return "en";
}

let currentLang: Lang = getStoredLang();
const listeners = new Set<() => void>();

function syncDocument(l: Lang) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  }
}

// Immediate initial sync on client evaluation
if (typeof window !== "undefined") {
  syncDocument(currentLang);
}

export function setLang(l: Lang) {
  if (currentLang === l) return;
  currentLang = l;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
    syncDocument(l);
  }
  listeners.forEach((fn) => fn());
}

export function getLang(): Lang {
  return currentLang;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): Lang {
  return currentLang;
}

function getServerSnapshot(): Lang {
  return "en";
}

export function useLang(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  React.useEffect(() => {
    syncDocument(lang);
  }, [lang]);

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
