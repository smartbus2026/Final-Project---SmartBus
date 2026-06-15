import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Ic } from "../icons";
import Api from "../services/Api";
import socket from "../services/socket";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage({ role }: { role?: string }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await Api.get("/notifications");
        setNotifications(res.data?.data?.notifications || []);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // Real-time socket: prepend incoming notifications to state immediately
  useEffect(() => {
    const handleNewNotif = (notif: any) => {
      setNotifications(prev => [{
        _id: notif._id || Date.now().toString(),
        title: notif.title || t("topbar_newAlert"),
        message: notif.message || "",
        type: notif.type || "general",
        read: false,
        createdAt: notif.createdAt || new Date().toISOString(),
      }, ...prev]);
    };

    // Listen to both event naming conventions for full compatibility
    socket.on("newNotification", handleNewNotif);
    socket.on("new_notification", handleNewNotif);

    return () => {
      socket.off("newNotification", handleNewNotif);
      socket.off("new_notification", handleNewNotif);
    };
  }, [t]);

  const handleMarkRead = async (id: string) => {
    // Optimistic UI update
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, read: true } : n)
    );
    try {
      await Api.put(`/notifications/${id}/read`);
    } catch (err) {
      console.error("Failed to mark as read", err);
      // Revert on failure
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: false } : n)
      );
    }
  };

  const handleReadAll = async () => {
    const hasUnread = notifications.some(n => !n.read);
    if (!hasUnread) return;

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await Api.put('/notifications/read-all');
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64 text-app-mu font-syne font-bold animate-pulse">
        {t("loading_notifications")}
      </div>
    );
  }

  return (
    <div className="p-6">

      <div className="mx-auto max-w-[800px] space-y-4">

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-syne text-[15px] font-black uppercase tracking-wider text-app-tx">
            {role === "driver" ? t("driver_notifications") : t("your_notifications")}
          </h2>
          {notifications.some(n => !n.read) && (
            <button
              onClick={handleReadAll}
              className="px-4 py-2 bg-app-am/10 text-app-am text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-app-am hover:text-white transition-all shadow-sm"
            >
              {t("mark_all_read")}
            </button>
          )}
        </div>

        {notifications.map((n) => (
          <div 
            key={n._id} 
            className="group flex items-start gap-4 rounded-2xl border border-app-bd bg-app-card p-4 transition-all hover:border-app-am-g hover:bg-app-card2/50"
            onClick={() => !n.read && handleMarkRead(n._id)}
          >
            {/* Notification Icon Wrapper */}
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-am-d text-app-am shadow-sm transition-transform group-hover:scale-105 ${n.read ? "opacity-50" : ""}`}>
              <Ic.Bell  />
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              {/* Header Row: Title + Type Badge */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate font-syne text-[13.5px] font-bold text-app-tx leading-tight">
                    {n.title}
                  </h3>
                  <div className="mt-0.5 text-[10px] font-medium text-app-mu2">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <span className="shrink-0 rounded-md bg-app-bd2 px-2 py-0.5 text-[9px] font-bold text-app-mu uppercase tracking-wider">
                  {n.type}
                </span>
              </div>

              {/* Message Body */}
              <p className="mt-2 text-[12.5px] leading-relaxed text-app-mu">
                {n.message}
              </p>

              {/* Footer Row: Read Status */}
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-app-ok">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500/10">
                  <Ic.Check  />
                </div>
                <span>{n.read ? t("read_label") : t("tap_to_mark_read")}</span>
              </div>
            </div>

            {/* Optional: Hover Action Indicator */}
            <div className="hidden self-center text-app-bd group-hover:block transition-all">
               <Ic.ChevDown  />
            </div>
          </div>
        ))}

        {/* Empty State Handler */}
        {notifications.length === 0 && (
          <div className="flex flex-col items-center py-20 opacity-30 text-center">
            <Ic.Bell />
            <p className="font-syne font-bold">{t("no_notifications_yet")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
