import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Theme } from "../types";
import { Ic } from "../icons";
import Api from "../services/Api";

const META: Record<string, { title: string; sub: string }> = {
  "/dashboard":          { title: "Dashboard",        sub: "Welcome back" },
  "/book-trip":          { title: "Book Trip",         sub: "Reserve your seat for tomorrow" },
  "/my-trips":           { title: "My Trips",          sub: "Manage your weekly transportation" },
  "/track-bus":          { title: "Track Bus",         sub: "Live bus location and ETA" },
  "/settings":           { title: "My Profile",        sub: "Manage your personal information" },
  "/admin/dashboard":    { title: "Dashboard",         sub: "Overview of today's operations" },
  "/admin/users":        { title: "Users Management",  sub: "Manage students and drivers" },
  "/admin/routes":       { title: "Manage Routes",     sub: "Configure bus routes" },
  "/admin/settings":     { title: "Settings",          sub: "Global system configuration" },
  "/admin/support":      { title: "Support Inbox",     sub: "View and manage student tickets" },
};

interface Props {
  theme: Theme;
  setTheme: () => void;
  onMenu: () => void;
  role: "student" | "admin" | null;
}

interface NotifItem {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Topbar({ theme, setTheme, onMenu, role }: Props) {
  const [nd, setNd] = useState(false);
  const [ud, setUd] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = role === "admin";

  const { title, sub } = META[location.pathname] || {
    title: "SmartBus",
    sub: isAdmin ? "Admin Panel" : "Student Portal",
  };

  // ── Live user profile ──────────────────────────────────────────────────────
  const [user, setUser] = useState({
    name: isAdmin ? "Admin" : "...",
    id: isAdmin ? "ADM-001" : "STU-???",
    initials: isAdmin ? "A" : "?",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    Api.get("/users/profile")
      .then((res) => {
        const u = res.data;
        const initials = (u.name || "?")
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        setUser({
          name: u.name || "User",
          id: u.student_id || (isAdmin ? "ADM-001" : u._id?.slice(-6) || "N/A"),
          initials,
        });
      })
      .catch(() => {});
  }, []);

  // ── Live notifications ─────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState<NotifItem[]>([]);

  const fetchNotifs = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await Api.get("/notifications");
      setNotifs(res.data || []);
    } catch {}
  }, []);

  // Fetch on mount and every 60 seconds
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    try {
      await Api.put(`/notifications/${id}/read`);
      setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const closeDrops = () => { setNd(false); setUd(false); };
  const dropClass = "absolute right-0 mt-3 overflow-hidden rounded-2xl border border-app-bd/50 bg-app-card shadow-2xl animate-in fade-in zoom-in duration-200";

  return (
    <header
      className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-app-bd/40 bg-app-bg/80 px-6 backdrop-blur-xl md:px-10"
      onClick={closeDrops}
    >
      {/* ── Left: Title & Mobile Menu ── */}
      <div className="flex items-center gap-5">
        <button
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-app-bd/50 text-app-mu transition-all hover:bg-app-card2 hover:text-app-tx lg:hidden"
          onClick={(e) => { e.stopPropagation(); onMenu(); }}
        >
          <Ic.Hamburger />
        </button>
        <div className="select-none">
          <div className="flex items-center gap-2">
            <h2 className="font-syne text-lg font-extrabold tracking-tight text-app-tx md:text-xl">
              {title}
            </h2>
            {isAdmin && (
              <span className="text-[9px] font-black uppercase tracking-widest bg-app-am/10 text-app-am border border-app-am/20 px-2 py-0.5 rounded-md">
                Admin
              </span>
            )}
          </div>
          <p className="hidden text-[11px] font-medium text-app-mu md:block">{sub}</p>
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-4 md:gap-6" onClick={(e) => e.stopPropagation()}>
        
        {/* Search */}
        <div className="hidden items-center gap-3 rounded-xl border border-app-bd/30 bg-app-card2/40 px-4 py-2.5 transition-all focus-within:border-app-am/40 focus-within:bg-app-card2 lg:flex w-64">
          <Ic.Search />
          <input
            placeholder={isAdmin ? "Search users, routes..." : "Quick search..."}
            className="bg-transparent text-[13px] font-medium outline-none placeholder:text-app-mu2 text-app-tx w-full"
          />
        </div>

        {/* Theme Toggle */}
        <button
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-app-bd/30 bg-app-card2/40 text-app-mu transition-all hover:border-app-am/30 hover:text-app-am"
          onClick={setTheme}
        >
          {theme === "dark" ? <Ic.Sun /> : <Ic.Moon />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-app-bd/30 transition-all hover:bg-app-card2 ${nd ? "border-app-am/40 text-app-am bg-app-card2" : "text-app-mu"}`}
            onClick={() => { setNd(!nd); setUd(false); }}
          >
            <Ic.Bell />
            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-app-am text-[9px] font-black text-white shadow-[0_0_8px_var(--am-g)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
            {unreadCount === 0 && (
              <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-app-am/40" />
            )}
          </button>

          {nd && (
            <div className={`${dropClass} w-80`}>
              <div className="flex items-center justify-between border-b border-app-bd/40 p-4 bg-app-card2/30">
                <span className="font-syne text-[13px] font-bold text-app-tx uppercase tracking-wider">
                  {isAdmin ? "System Alerts" : "Alerts"}
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-lg bg-app-am/10 px-2 py-0.5 text-[9px] font-black text-app-am border border-app-am/20">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifs.length === 0 ? (
                  <p className="p-6 text-center text-[11px] text-app-mu font-bold opacity-50">
                    No notifications
                  </p>
                ) : (
                  notifs.slice(0, 5).map((n) => (
                    <div
                      key={n._id}
                      className={`group flex gap-3 border-b border-app-bd/20 p-4 last:border-0 hover:bg-app-card2/50 cursor-pointer transition-colors ${n.read ? "opacity-60" : ""}`}
                      onClick={() => handleMarkRead(n._id)}
                    >
                      <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full transition-opacity ${n.read ? "bg-app-mu opacity-30" : "bg-app-am opacity-100"}`} />
                      <div className="space-y-1">
                        <div className="text-[12px] font-bold text-app-tx">{n.title}</div>
                        <div className="text-[10px] leading-relaxed text-app-mu line-clamp-2">{n.message}</div>
                        <div className="text-[9px] font-bold text-app-mu2 uppercase">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => { navigate(isAdmin ? "/admin/notifications" : "/notifications"); setNd(false); }}
                className="w-full border-t border-app-bd/30 py-3 text-center text-[11px] font-black uppercase tracking-widest text-app-am hover:bg-app-am hover:text-white transition-all"
              >
                See All Notifications
              </button>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <div
            className="group flex items-center gap-3 cursor-pointer rounded-xl p-1 transition-all"
            onClick={() => { setUd(!ud); setNd(false); }}
          >
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-app-bd/50 group-hover:border-app-am transition-colors bg-app-am-d flex items-center justify-center">
              <span className="font-syne text-sm font-black text-app-am">{user.initials}</span>
            </div>
            <div className="transition-transform duration-200" style={{ transform: ud ? "rotate(180deg)" : "rotate(0)" }}>
               <Ic.ChevDown />
            </div>
          </div>

          {ud && (
            <div className={`${dropClass} w-52 py-2`}>
              <div className="px-4 py-2 mb-1">
                <p className="text-[13px] font-bold text-app-tx">{user.name}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-app-mu2">{user.id}</p>
              </div>
              <div className="h-[1px] bg-app-bd/30 mx-2 mb-1" />

              {/* Profile Button (For Students) */}
              {!isAdmin && (
                <button
                  onClick={() => { navigate("/settings"); setUd(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-[12px] font-bold text-app-mu hover:bg-app-card2 hover:text-app-am transition-all"
                >
                  <Ic.User /> Profile
                </button>
              )}

              {/* Settings Button (Dynamic Route) */}
              <button
                onClick={() => { navigate(isAdmin ? "/admin/settings" : "/settings"); setUd(false); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-[12px] font-bold text-app-mu hover:bg-app-card2 hover:text-app-am transition-all"
              >
                <Ic.Gear /> Settings
              </button>

              <div className="h-[1px] bg-app-bd/30 mx-2 my-1" />

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-app-err hover:bg-app-err/10 transition-all"
              >
                <Ic.Logout /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}