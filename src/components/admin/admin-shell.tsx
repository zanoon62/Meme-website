"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  FolderTree,
  Megaphone,
  Star,
  LogOut,
  Boxes,
  ChevronDown,
  LayoutTemplate,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { clearAdminSession } from "@/lib/auth/simple-auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { useAdminT } from "@/components/admin/admin-i18n";
import { AdminNotifications } from "@/components/admin/admin-notifications";
import { motion, AnimatePresence } from "framer-motion";

export type AdminSection =
  | "dashboard"
  | "products"
  | "orders"
  | "customers"
  | "inventory"
  | "categories"
  | "marketing"
  | "reviews"
  | "analytics"
  | "settings"
  | "guide"
  | "homepage";

export function AdminShell({
  section,
  onSection,
  onNewProduct,
  children,
}: {
  section: AdminSection;
  onSection: (s: AdminSection) => void;
  onNewProduct?: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const { t, isAr, dir } = useAdminT();

  const navGroups = React.useMemo(
    () => [
      {
        label: t("overview"),
        items: [
          { id: "dashboard" as AdminSection, icon: LayoutDashboard, label: t("dashboard") },
          { id: "analytics" as AdminSection, icon: BarChart3, label: t("analytics") },
        ],
      },
      {
        label: t("catalog"),
        items: [
          { id: "products" as AdminSection, icon: Package, label: t("products") },
          { id: "inventory" as AdminSection, icon: Boxes, label: t("inventory") },
          { id: "categories" as AdminSection, icon: FolderTree, label: t("categories") },
        ],
      },
      {
        label: t("sales"),
        items: [
          { id: "orders" as AdminSection, icon: ShoppingCart, label: t("orders") },
          { id: "customers" as AdminSection, icon: Users, label: t("customers") },
          { id: "reviews" as AdminSection, icon: Star, label: t("reviews") },
        ],
      },
      {
        label: isAr ? "التسويق والنظام" : "Growth & System",
        items: [
          { id: "marketing" as AdminSection, icon: Megaphone, label: t("marketing") },
          { id: "homepage" as AdminSection, icon: LayoutTemplate, label: t("homepage") },
          { id: "settings" as AdminSection, icon: Settings, label: t("settings") },
        ],
      },
    ],
    [t]
  );

  const handleLogout = async () => {
    clearAdminSession();
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
    }
    toast.success("Signed out");
    router.push("/admin/login");
    router.refresh();
  };

  const currentLabel =
    navGroups.flatMap((g) => g.items).find((i) => i.id === section)?.label ??
    t("dashboard");

  return (
    <main dir={dir} className="flex-1 bg-background text-foreground min-h-screen">
      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-border/80 bg-card sticky top-0 h-screen shadow-sm">
          <div className="p-6 pb-4">
            <Link
              href="/"
              className="font-display text-2xl tracking-[0.18em] font-bold text-foreground flex items-center gap-2"
            >
              <Sparkles className="h-5 w-5 text-amber-500" />
              MEME
            </Link>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1 font-semibold">
              Atelier Admin
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-3 mb-2 font-bold">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = section === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSection(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative",
                          active
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border-l-4 border-amber-500 shadow-xs"
                            : "text-foreground/70 hover:text-foreground hover:bg-accent/60"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4", active ? "text-amber-500" : "text-muted-foreground")} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-border/80">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-accent text-left transition-colors">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="bg-amber-500 text-black font-bold text-xs">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-foreground">{t("atelierAdmin")}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      admin@memeatelier.com
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t("myAccount")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSection("settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t("settings")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/80 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
              >
                Navigation
              </Button>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                  Atelier Control
                </p>
                <h1 className="font-display text-lg font-bold text-foreground tracking-tight">
                  {currentLabel}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Interactive Notifications Center */}
              <AdminNotifications onJumpSection={onSection} />

              <LanguageToggle />
              <ThemeToggle />

              {onNewProduct && (
                <Button
                  size="sm"
                  className="rounded-lg hidden sm:inline-flex bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow"
                  onClick={onNewProduct}
                >
                  + {t("newProduct")}
                </Button>
              )}
            </div>
          </header>

          {/* Mobile nav drawer */}
          {mobileNavOpen && (
            <div className="lg:hidden border-b border-border/80 bg-card p-4 space-y-4 shadow-lg">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 font-bold">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSection(item.id);
                          setMobileNavOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-colors",
                          section === item.id
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                            : "text-foreground/70 hover:bg-accent"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Main section panel with smooth fade-in transition */}
          <div className="p-4 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={section}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
