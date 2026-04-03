import { useState } from "react";
import { useLocation } from "react-router-dom";
import type { Theme } from "../types";
import { Ic } from "../icons";
import { NOTIFS } from "../data";

const META: Record<string, { title: string; sub: string }> = {
  "/dashboard":      { title: "Dashboard",      sub: "Welcome back, Noha" },
  "/book-trip":      { title: "Book Trip",      sub: "Reserve your seat for tomorrow" },
  "/my-trips":       { title: "My Trips",       sub: "Manage your weekly transportation" },
  "/route-details":  { title: "Route Details",  sub: "View routes and schedules" },
  "/track-bus":      { title: "Track Bus",      sub: "Live bus location and ETA" },
  "/attendance":     { title: "Attendance",     sub: "Your trip history and stats" },
  "/notifications":  { title: "Notifications",  sub: "Alerts and updates" },
  "/route-chat":     { title: "Route Chat",     sub: "Chat with your route group" },
  "/support":        { title: "Support",        sub: "Help center & tickets" },
  "/settings":       { title: "My Profile",     sub: "Manage your personal information" },
};

export default function Topbar({ theme, setTheme, onMenu }: { theme: Theme; setTheme: (t: Theme) => void; onMenu: () => void }) {
  const [nd, setNd] = useState(false); 
  const [ud, setUd] = useState(false); 
  const location = useLocation();

  const { title, sub } = META[location.pathname] || { title: "SmartBus", sub: "Student Portal" };

  const closeDrops = () => { setNd(false); setUd(false); };

  // Shared classes for dropdowns
  const dropClass = "absolute right-0 mt-3 overflow-hidden rounded-2xl border border-app-bd/50 bg-app-card shadow-2xl animate-in fade-in zoom-in duration-200";

  return (
    <header 
      className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-app-bd/40 bg-app-bg/80 px-6 backdrop-blur-xl md:px-10"
      onClick={closeDrops}
    >
      {/* ── Left: Page Info ── */}
      <div className="flex items-center gap-5">
        <button 
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-app-bd/50 text-app-mu transition-all hover:bg-app-card2 hover:text-app-tx lg:hidden"
          onClick={(e) => { e.stopPropagation(); onMenu(); }}
        >
          <Ic.Hamburger size={20} />
        </button>
        <div className="select-none">
          <h2 className="font-syne text-lg font-extrabold tracking-tight text-app-tx md:text-xl">{title}</h2>
          <p className="hidden text-[11px] font-medium text-app-mu md:block">{sub}</p>
        </div>
      </div>

      {/* ── Right: Actions ── */}
      <div className="flex items-center gap-4 md:gap-6" onClick={(e) => e.stopPropagation()}>
        
        {/* Modern Minimal Search */}
        <div className="hidden items-center gap-3 rounded-xl border border-app-bd/30 bg-app-card2/40 px-4 py-2.5 transition-all focus-within:border-app-am/40 focus-within:bg-app-card2 lg:flex w-64 group">
          <Ic.Search size={16} className="text-app-mu group-focus-within:text-app-am transition-colors" />
          <input 
            placeholder="Quick search..." 
            className="bg-transparent text-[13px] font-medium outline-none placeholder:text-app-mu2 text-app-tx w-full"
          />
        </div>

        {/* Theme Toggle */}
        <button 
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-app-bd/30 bg-app-card2/40 text-app-mu transition-all hover:border-app-am/30 hover:text-app-am"
          onClick={() => setTheme()}
        >
          {theme === "dark" ? <Ic.Sun size={18} /> : <Ic.Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-app-bd/30 transition-all hover:bg-app-card2 ${nd ? 'border-app-am/40 text-app-am bg-app-card2' : 'text-app-mu'}`}
            onClick={() => { setNd(!nd); setUd(false); }}
          >
            <Ic.Bell size={18} />
            <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-app-am shadow-[0_0_8px_var(--am-g)]" />
          </button>

          {nd && (
            <div className={`${dropClass} w-85`}>
              <div className="flex items-center justify-between border-b border-app-bd/40 p-4 bg-app-card2/30">
                <span className="font-syne text-[13px] font-bold text-app-tx uppercase tracking-wider">Alerts</span>
                <span className="rounded-lg bg-app-am/10 px-2 py-0.5 text-[9px] font-black text-app-am border border-app-am/20">2 NEW</span>
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {NOTIFS.slice(0, 3).map((n) => (
                  <div key={n.id} className="group flex gap-3 border-b border-app-bd/20 p-4 last:border-0 hover:bg-app-card2/50 cursor-pointer transition-colors">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-app-am opacity-40 group-hover:opacity-100 transition-opacity" />
                    <div className="space-y-1">
                      <div className="text-[12px] font-bold text-app-tx">{n.title}</div>
                      <div className="text-[10px] leading-relaxed text-app-mu line-clamp-2">{n.message}</div>
                      <div className="text-[9px] font-bold text-app-mu2 uppercase">{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full border-t border-app-bd/30 py-3 text-center text-[11px] font-black uppercase tracking-widest text-app-am hover:bg-app-am hover:text-white transition-all">
                See All Notifications
              </button>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <div 
            className="group flex items-center gap-3 cursor-pointer rounded-xl p-1 transition-all"
            onClick={() => { setUd(!ud); setNd(false); }}
          >
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-app-bd/50 group-hover:border-app-am transition-colors">
              <img src={`https://ui-avatars.com/api/?name=Noha+Khalil&background=f9b233&color=fff&bold=true`} alt="Avatar" className="p-0.5 rounded-full" />
            </div>
            <Ic.ChevDown size={14} className={`text-app-mu transition-transform duration-300 ${ud ? 'rotate-180 text-app-am' : 'group-hover:text-app-tx'}`} />
          </div>

          {ud && (
            <div className={`${dropClass} w-52 py-2`}>
              <div className="px-4 py-2 mb-1">
                <p className="text-[13px] font-bold text-app-tx">Noha Khalil</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-app-mu2">STU-7241</p>
              </div>
              <div className="h-[1px] bg-app-bd/30 mx-2 mb-1" />
              <button className="flex w-full items-center gap-3 px-4 py-2.5 text-[12px] font-bold text-app-mu hover:bg-app-card2 hover:text-app-am transition-all">
                <Ic.User size={16} /> Profile
              </button>
              <button className="flex w-full items-center gap-3 px-4 py-2.5 text-[12px] font-bold text-app-mu hover:bg-app-card2 hover:text-app-am transition-all">
                <Ic.Gear size={16} /> Settings
              </button>
              <div className="h-[1px] bg-app-bd/30 mx-2 my-1" />
              <button className="flex w-full items-center gap-3 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-app-err hover:bg-app-err/10 transition-all">
                <Ic.Logout size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}