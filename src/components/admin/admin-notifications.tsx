"use client";

import * as React from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  ShoppingCart,
  PackageX,
  Star,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAdminT } from "@/components/admin/admin-i18n";
import { toast } from "sonner";
import type { AdminSection } from "@/components/admin/admin-shell";

type NotificationItem = {
  id: string;
  type: "order" | "inventory" | "review" | "return" | "system";
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  timeAr: string;
  timeEn: string;
  read: boolean;
  targetSection: AdminSection;
};

// Notifications start empty — real notifications will be generated
// by actual orders, inventory changes, and customer reviews.
const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export function AdminNotifications({
  onJumpSection,
}: {
  onJumpSection?: (s: AdminSection) => void;
}) {
  const { isAr, dir } = useAdminT();
  const [notifications, setNotifications] =
    React.useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Fetch real order notifications, low inventory alerts & return requests
  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [ordersRes, productsRes, returnsRes] = await Promise.all([
          fetch("/api/admin/orders?limit=15"),
          fetch("/api/admin/products"),
          fetch("/api/admin/returns?limit=15"),
        ]);

        const items: NotificationItem[] = [];

        if (ordersRes.ok) {
          const { orders } = await ordersRes.json();
          if (orders && Array.isArray(orders)) {
            orders.forEach((o: any) => {
              const name = o.shipping_address?.first_name || o.email || "Customer";
              const dateObj = new Date(o.placed_at || o.created_at || Date.now());
              const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              items.push({
                id: `order-${o.id}`,
                type: "order",
                titleAr: `طلب جديد #${o.order_number}`,
                titleEn: `New Order #${o.order_number}`,
                descAr: `طلب بقيمة LE ${o.total?.toLocaleString()} من ${name} (${o.status})`,
                descEn: `Order worth LE ${o.total?.toLocaleString()} by ${name} (${o.status})`,
                timeAr: timeStr,
                timeEn: timeStr,
                read: false,
                targetSection: "orders",
              });
            });
          }
        }

        if (productsRes.ok) {
          const { products } = await productsRes.json();
          if (products && Array.isArray(products)) {
            products.filter((p: any) => (p.inventory ?? 0) <= 5).forEach((p: any) => {
              items.push({
                id: `low-stock-${p.id}`,
                type: "inventory",
                titleAr: `تنبيه مخزون منخفض: ${p.name}`,
                titleEn: `Low Stock Alert: ${p.name}`,
                descAr: `المتبقي فقط ${p.inventory} قطعة في المخزن!`,
                descEn: `Only ${p.inventory} units remaining in stock!`,
                timeAr: "الآن",
                timeEn: "Now",
                read: false,
                targetSection: "inventory",
              });
            });
          }
        }

        if (returnsRes.ok) {
          const { returns } = await returnsRes.json();
          if (returns && Array.isArray(returns)) {
            returns
              .filter((r: any) => r.status === "pending" || r.status === "reviewing")
              .forEach((r: any) => {
                const dateObj = new Date(r.created_at || Date.now());
                const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                items.push({
                  id: `return-${r.id}`,
                  type: "return",
                  titleAr: `طلب مرتجع جديد #${r.order_number ?? r.id.slice(0, 8)}`,
                  titleEn: `New Return Request #${r.order_number ?? r.id.slice(0, 8)}`,
                  descAr: `${r.reason ? r.reason + " — " : ""}الحالة: ${r.status}`,
                  descEn: `${r.reason ? r.reason + " — " : ""}Status: ${r.status}`,
                  timeAr: timeStr,
                  timeEn: timeStr,
                  read: false,
                  targetSection: "returns",
                });
              });
          }
        }

        if (isMounted && items.length > 0) {
          setNotifications(items);
        }
      } catch (err) {
        console.error("Failed to load admin notifications", err);
      }
    };

    load();
    const interval = setInterval(load, 30_000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    toast.success(isAr ? "تم تحديد كافة الإشعارات كمقروءة" : "Marked all as read");
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success(isAr ? "تم مسح جميع الإشعارات" : "Cleared all notifications");
  };

  const handleItemClick = (item: NotificationItem) => {
    setNotifications((list) =>
      list.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (onJumpSection) {
      onJumpSection(item.targetSection);
    }
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="h-4 w-4 text-emerald-500" />;
      case "inventory":
        return <PackageX className="h-4 w-4 text-amber-500" />;
      case "review":
        return <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />;
      case "return":
        return <RotateCcw className="h-4 w-4 text-indigo-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-white/10 shadow-xs hover:shadow-md hover:scale-105 hover:bg-white dark:hover:bg-zinc-800 hover:border-amber-500/40 dark:hover:border-amber-400/40 transition-all duration-200 text-foreground relative"
          aria-label="Notifications"
        >
          <Bell className="h-[1.15rem] w-[1.15rem] text-muted-foreground group-hover:text-foreground transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-[10px] flex items-center justify-center shadow-md animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isAr ? "start" : "end"}
        className="w-80 sm:w-96 p-0 shadow-2xl border border-border bg-popover rounded-2xl overflow-hidden"
      >
        <div className="p-4 bg-card border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            <h3 className="font-bold text-sm text-foreground">
              {isAr ? "مركز الإشعارات التفاعلي" : "Notifications Center"}
            </h3>
            {unreadCount > 0 && (
              <Badge className="bg-amber-500 text-black font-bold text-[10px] px-2">
                {unreadCount} {isAr ? "جديد" : "new"}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={markAllRead}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title={isAr ? "تحديد الكل كمرئي" : "Mark all read"}
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAll}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                title={isAr ? "مسح الكل" : "Clear all"}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              {isAr ? "لا توجد إشعارات حالياً ✨" : "No notifications yet ✨"}
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "p-3.5 flex items-start gap-3 cursor-pointer hover:bg-accent/40 transition-colors relative group",
                  !item.read && "bg-amber-500/5 dark:bg-amber-500/10"
                )}
              >
                {!item.read && (
                  <span className="absolute top-4 right-2 w-2 h-2 rounded-full bg-amber-500" />
                )}
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0 border border-border/40 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-bold text-foreground truncate">
                      {isAr ? item.titleAr : item.titleEn}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                      {isAr ? item.timeAr : item.timeEn}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
