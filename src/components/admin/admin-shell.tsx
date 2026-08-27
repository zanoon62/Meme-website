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
  RotateCcw,
  Loader2,
  Eye,
  Smartphone,
  Monitor,
  ShieldCheck,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { clearAdminSession, getAdminEmailClient } from "@/lib/auth/simple-auth";
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
  | "returns"
  | "analytics"
  | "settings"
  | "guide"
  | "homepage"
  | "admin-access";

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
  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const [resettingData, setResettingData] = React.useState(false);
  const [showPreviewModal, setShowPreviewModal] = React.useState(false);
  const [previewPath, setPreviewPath] = React.useState("/");
  const [previewMode, setPreviewMode] = React.useState<"desktop" | "mobile">("desktop");
  const [adminEmail, setAdminEmail] = React.useState<string>("Admin");

  React.useEffect(() => {
    const email = getAdminEmailClient();
    if (email) setAdminEmail(email);
  }, []);

  const handleResetData = async () => {
    setResettingData(true);
    try {
      const res = await fetch("/api/admin/reset-store-data", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Failed to reset store data.");
        return;
      }
      toast.success(isAr ? "تم تصفير جميع طلبات الاختبار والإيرادات بنجاح! 🎉" : "All test orders & revenue figures reset to LE 0!");
      setShowResetDialog(false);
      window.location.reload();
    } catch {
      toast.error("Network error during reset.");
    } finally {
      setResettingData(false);
    }
  };

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
          { id: "returns" as AdminSection, icon: RotateCcw, label: t("returns") },
        ],
      },
      {
        label: isAr ? "التسويق والنظام" : "Growth & System",
        items: [
          { id: "marketing" as AdminSection, icon: Megaphone, label: t("marketing") },
          { id: "homepage" as AdminSection, icon: LayoutTemplate, label: t("homepage") },
          { id: "settings" as AdminSection, icon: Settings, label: t("settings") },
          { id: "admin-access" as AdminSection, icon: ShieldCheck, label: isAr ? "صلاحيات الإدارة" : "Admin Access" },
        ],
      },
    ],
    [t, isAr]
  );

  const handleLogout = async () => {
    await clearAdminSession();
    toast.success("Signed out");
    router.push("/admin/login");
    router.refresh();
  };

  const currentLabel =
    navGroups.flatMap((g) => g.items).find((i) => i.id === section)?.label ??
    t("dashboard");

  return (
    <main dir={dir} className="flex-1 bg-background text-foreground min-h-screen relative overflow-hidden">
      {/* Designer background ambient glow accents */}
      <div className="pointer-events-none absolute -top-40 right-0 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 w-96 h-96 bg-amber-500/5 dark:bg-amber-500/5 rounded-full blur-3xl" />

      <div className="flex relative z-10">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-border/80 bg-card/90 backdrop-blur-xl sticky top-0 h-screen shadow-sm">
          <div className="p-6 pb-4">
            <Link
              href="/"
              className="font-display text-2xl tracking-[0.18em] font-bold text-foreground flex items-center gap-2 group"
            >
              <Sparkles className="h-5 w-5 text-amber-500 group-hover:rotate-12 transition-transform duration-300" />
              MEME
            </Link>
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500/90 dark:text-amber-400/90 mt-1 font-bold">
              Atelier Admin
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-3 mb-2 font-bold opacity-80">
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
                          "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative group",
                          active
                            ? "bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent text-amber-600 dark:text-amber-400 font-bold border-l-4 border-amber-500 shadow-xs"
                            : "text-foreground/70 hover:text-foreground hover:bg-accent/60"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 transition-transform duration-200 group-hover:scale-110", active ? "text-amber-500" : "text-muted-foreground")} />
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
                <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-accent/70 text-left transition-colors">
                  <Avatar className="h-8 w-8 border border-amber-500/30">
                    <AvatarFallback className="bg-amber-500 text-black font-bold text-xs">
                      {adminEmail ? adminEmail.slice(0, 2).toUpperCase() : "AD"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-foreground">{t("atelierAdmin")}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {adminEmail || "admin@memeatelier.com"}
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
                  <LogOut className="mr-2 h-4 w-4 text-rose-500" />
                  {t("signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <div className="flex-1 min-w-0">
          {/* Top bar — iOS Frosted Glass Capsule Bar */}
          <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/70 px-4 lg:px-8 py-3 flex items-center justify-between shadow-xs transition-colors duration-200">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden rounded-xl border border-border/60"
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

            {/* Header Right / Left Action Icons Bar with iPhone Frosted Pill Effect */}
            <div className="flex items-center gap-2 sm:gap-2.5 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-xl">
              {/* Reset Test Data & Revenue button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetDialog(true)}
                className="h-9 px-3 rounded-xl border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                title={isAr ? "تصفير بيانات الاختبار والإيرادات" : "Reset Test Data & Revenue to LE 0"}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{isAr ? "تصفير البيانات" : "Reset Test Data"}</span>
              </Button>

              {/* Quick link back to storefront website */}
              <Link href="/" title={isAr ? "العودة للموقع" : "Back to Website"}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-foreground transition-all duration-200"
                >
                  <LogOut className={cn("h-4 w-4 text-muted-foreground hover:text-foreground transition-colors", isAr && "rotate-180")} />
                  <span className="sr-only">{isAr ? "العودة للموقع" : "Back to Website"}</span>
                </Button>
              </Link>

              {/* Interactive Notifications Center */}
              <AdminNotifications onJumpSection={onSection} />

              <LanguageToggle />
              <ThemeToggle />

              {onNewProduct && (
                <Button
                  size="sm"
                  className="rounded-xl hidden sm:inline-flex bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 text-xs px-3.5 h-9"
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
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Live Storefront Interactive Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden rounded-2xl flex flex-col bg-background">
          <div className="p-3 px-5 border-b border-border bg-card flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-amber-500 animate-pulse" />
              <div>
                <h3 className="font-display font-bold text-base text-foreground">
                  {isAr ? "معاينة حية ومباشرة لموقع الأتيليه" : "Live Storefront Interactive Preview"}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {isAr ? "استعرض شكل الصفحات والتغييرات فور حدوثها في الوقت الفعلي." : "Real-time interactive viewport of your live storefront website."}
                </p>
              </div>
            </div>

            {/* Path selector tabs & responsive mode toggles */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-accent/60 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setPreviewPath("/")}
                  className={cn("px-3 py-1 rounded-lg font-bold transition-all", previewPath === "/" ? "bg-amber-500 text-black shadow-xs" : "text-muted-foreground hover:text-foreground")}
                >
                  {isAr ? "الرئيسية" : "Home"}
                </button>
                <button
                  onClick={() => setPreviewPath("/shop")}
                  className={cn("px-3 py-1 rounded-lg font-bold transition-all", previewPath === "/shop" ? "bg-amber-500 text-black shadow-xs" : "text-muted-foreground hover:text-foreground")}
                >
                  {isAr ? "المتجر" : "Shop"}
                </button>
                <button
                  onClick={() => setPreviewPath("/checkout")}
                  className={cn("px-3 py-1 rounded-lg font-bold transition-all", previewPath === "/checkout" ? "bg-amber-500 text-black shadow-xs" : "text-muted-foreground hover:text-foreground")}
                >
                  {isAr ? "إنهاء الطلب" : "Checkout"}
                </button>
              </div>

              <div className="flex items-center gap-1 bg-accent/60 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={cn("p-1.5 rounded-lg transition-all", previewMode === "desktop" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground")}
                  title="Desktop View"
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={cn("p-1.5 rounded-lg transition-all", previewMode === "mobile" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground")}
                  title="Mobile View"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-zinc-950 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
            <iframe
              src={previewPath}
              className={cn(
                "h-full border-0 transition-all duration-300 shadow-2xl rounded-xl bg-background",
                previewMode === "mobile" ? "w-[395px] max-h-[780px] rounded-[40px] border-4 border-zinc-800" : "w-full"
              )}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Test Store Data Modal */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              {isAr ? "تصفير بيانات الاختبار والإيرادات" : "Reset Test Orders & Revenue"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {isAr
                ? "هل أنت متأكد من تصفير جميع طلبات الاختبار، قيم المبيعات، الإيرادات وتحديثات العملاء إلى صفر (LE 0)؟ هذا الإجراء مفيد لبدء تحليلات وطلبات حقيقية جديدة."
                : "Are you sure you want to delete all test orders, revenue metrics, sales analytics, and customer order histories back to LE 0? This lets you start completely fresh for real customer orders."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={resettingData}
              onClick={() => setShowResetDialog(false)}
            >
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={resettingData}
              onClick={handleResetData}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {resettingData ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> {isAr ? "جاري التصفير..." : "Resetting..."}</>
              ) : (
                isAr ? "نعم، صفر الإيرادات والطلبات" : "Yes, Reset All Data to LE 0"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
