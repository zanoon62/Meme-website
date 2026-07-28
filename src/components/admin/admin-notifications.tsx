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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuTitle,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAdminT } from "@/components/admin/admin-i18n";
import { toast } from "sonner";
import type { AdminSection } from "@/components/admin/admin-shell";

type NotificationItem = {
  id: string;
  type: "order" | "inventory" | "review" | "system";
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  timeAr: string;
  timeEn: string;
  read: boolean;
  targetSection: AdminSection;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "order",
    titleAr: "طلب جديد #1048",
    titleEn: "New Order #1048",
    descAr: "تم استلام طلب بقيمة 18,500 ج.م من سارة أحمد",
    descEn: "Order placed for 18,500 EGP by Sarah Ahmed",
    timeAr: "منذ 3 دقائق",
    timeEn: "3 mins ago",
    read: false,
    targetSection: "orders",
  },
  {
    id: "notif-2",
    type: "inventory",
    titleAr: "تنبيه مخزون منخفض",
    titleEn: "Low Stock Alert",
    descAr: "فستان بليزر أسود فاخر متبقي منه 2 قطعة فقط بالمخزون",
    descEn: "Noir Tailored Blazer Dress has only 2 units left",
    timeAr: "منذ 15 دقيقة",
    timeEn: "15 mins ago",
    read: false,
    targetSection: "inventory",
  },
  {
    id: "notif-3",
    type: "review",
    titleAr: "تقييم جديد ⭐⭐⭐⭐⭐",
    titleEn: "New 5-Star Review ⭐⭐⭐⭐⭐",
    descAr: "قام عميل بكتابة تعليق مميز على هودي الكشمير الفاخر",
    descEn: "Client left a stellar review on Cashmere Hoodie",
    timeAr: "منذ ساعتين",
    timeEn: "2 hours ago",
    read: false,
    targetSection: "reviews",
  },
  {
    id: "notif-4",
    type: "system",
    titleAr: "تحديث النظام بنجاح",
    titleEn: "System Updated",
    descAr: "تم تفعيل جدول المقاسات الذكي ورفع الصور المباشر",
    descEn: "Smart size charts & file uploader activated",
    timeAr: "منذ 4 ساعات",
    timeEn: "4 hours ago",
    read: true,
    targetSection: "dashboard",
  },
];

export function AdminNotifications({
  onJumpSection,
}: {
  onJumpSection?: (s: AdminSection) => void;
}) {
  const { isAr, dir } = useAdminT();
  const [notifications, setNotifications] =
    React.useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

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
      default:
        return <Sparkles className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu dir={dir}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full relative hover:bg-accent transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center shadow-sm animate-pulse">
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
