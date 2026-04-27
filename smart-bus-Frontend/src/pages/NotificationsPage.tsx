import { useState, useEffect } from "react";
import { Ic } from "../icons";
import Api from "../services/Api";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await Api.get("/notifications");
        setNotifications(res.data || []);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await Api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64 text-app-mu font-syne font-bold animate-pulse">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="p-6">
      
      <div className="mx-auto max-w-[800px] space-y-3">
        
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
                <span>{n.read ? "Read" : "Tap to mark as read"}</span>
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
            <p className="font-syne font-bold">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}