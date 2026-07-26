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
  TrendingUp,
  BookOpen,
  FolderTree,
  Layers,
  Megaphone,
  Star,
  LogOut,
  Bell,
  Search,
  Plus,
  Boxes,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";

export type AdminSection =
  | "dashboard"
  | "products"
  | "orders"
  | "customers"
  | "inventory"
  | "categories"
  | "collections"
  | "marketing"
  | "reviews"
  | "analytics"
  | "settings"
  | "guide";

const NAV_GROUPS: { label: string; items: { id: AdminSection; icon: React.ElementType; label: string }[] }[] = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { id: "analytics", icon: BarChart3, label: "Analytics" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { id: "products", icon: Package, label: "Products" },
      { id: "inventory", icon: Boxes, label: "Inventory" },
      { id: "categories", icon: FolderTree, label: "Categories" },
      { id: "collections", icon: Layers, label: "Collections" },
    ],
  },
  {
    label: "Sales",
    items: [
      { id: "orders", icon: ShoppingCart, label: "Orders" },
      { id: "customers", icon: Users, label: "Customers" },
      { id: "reviews", icon: Star, label: "Reviews" },
      { id: "marketing", icon: Megaphone, label: "Marketing" },
    ],
  },
  {
    label: "System",
    items: [
      { id: "guide", icon: BookOpen, label: "Admin Guide" },
      { id: "settings", icon: Settings, label: "Settings" },
    ],
  },
];

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

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
    }
    toast.success("Signed out");
    router.push("/admin/login");
    router.refresh();
  };

  const currentLabel =
    NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === section)?.label ??
    "Dashboard";

  return (
    <main className="flex-1 bg-accent/20 min-h-screen">
      <div className="flex">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-border/60 bg-background sticky top-0 h-screen">
          <div className="p-6 pb-4">
            <Link
              href="/"
              className="font-display text-2xl tracking-[0.18em] font-bold"
            >
              MEME
            </Link>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Atelier Admin
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-3 mb-2">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => onSection(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        section === item.id
                          ? "bg-foreground text-background"
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
          </nav>

          <div className="p-3 border-t border-border/60">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent text-left">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-foreground text-background text-xs">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Atelier Admin</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      admin@memeatelier.com
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSection("settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-10 glass border-b border-border/60 px-4 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileNavOpen((v) => !v)}
              >
                <LayoutDashboard className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Admin
                </p>
                <h1 className="font-display text-xl lg:text-2xl tracking-tight">
                  {currentLabel}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  className="pl-9 h-9 w-48 lg:w-64 bg-background"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full relative"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
              </Button>
              <LanguageToggle />
              <ThemeToggle />
              {onNewProduct && (
                <Button
                  size="sm"
                  className="rounded-full hidden sm:inline-flex"
                  onClick={onNewProduct}
                >
                  <Plus className="h-4 w-4 mr-1" /> New product
                </Button>
              )}
            </div>
          </header>

          {/* Mobile nav drawer */}
          {mobileNavOpen && (
            <div className="lg:hidden border-b border-border/60 bg-background p-4 space-y-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSection(item.id);
                          setMobileNavOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-xs",
                          section === item.id
                            ? "bg-foreground text-background"
                            : "text-foreground/70 hover:bg-accent"
                        )}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 lg:p-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
