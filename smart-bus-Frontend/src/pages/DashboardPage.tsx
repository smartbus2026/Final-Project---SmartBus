import type { Page } from "../types";
import { Ic } from "../icons";
import { useNavigate } from "react-router-dom";

export default function DashboardPage({ go }: { go?: (p: Page) => void }) {  
  const TRIPS: any[] = []; 
  const next = TRIPS[0] || { from: "Home", to: "University", date: "Oct 24", pickup: "07:30 AM", bus: "B-12", departure: "07:45 AM" };

  const stats = [
    { l: "Total Trips", v: "24", c: "text-app-am", bg: "bg-app-am-d", icon: <Ic.Bus /> },
    { l: "Completed", v: "19", c: "text-app-ok", bg: "bg-green-500/10", icon: <Ic.Bus /> },
    { l: "Upcoming", v: "3", c: "text-app-info", bg: "bg-blue-500/10", icon: <Ic.Bus /> },
    { l: "Missed", v: "2", c: "text-app-err", bg: "bg-red-500/10", icon: <Ic.Bus /> },
  ];

  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      
      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.l} className="group rounded-2xl border border-app-bd bg-app-card p-4 transition-all hover:border-app-am-g">
            <div className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg ${s.bg} ${s.c}`}>
              {s.icon}
            </div>
            <div className="font-syne text-2xl font-extrabold leading-none text-app-tx group-hover:text-app-am transition-colors">
              {s.v}
            </div>
            <div className="mt-1 text-[11px] font-medium text-app-mu">{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── Hero: Next Trip ── */}
      <div className="relative overflow-hidden rounded-2xl border border-app-bd bg-app-card p-5 lg:p-6">
        <div className="pointer-events-none absolute -top-10 -right-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,var(--am-g),transparent_70%)]" />
        
        <div className="mb-4 text-[10px] font-bold uppercase tracking-wider text-app-mu">Next Trip</div>
        
        <div className="mb-5 flex flex-wrap items-center gap-2 font-syne text-lg font-extrabold text-app-tx">
          <Ic.Pin />
          <span className="text-app-am">{next.from}</span>
          <span className="font-normal text-app-mu mx-1">→</span>
          <span>{next.to}</span>
          <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-app-ok uppercase tracking-wider">
            Confirmed
          </span>
        </div>

        <div className="mb-5 grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { l: "Date", v: next.date, a: false },
            { l: "Pickup", v: next.pickup, a: false },
            { l: "Bus", v: next.bus, a: false },
            { l: "Dep.", v: next.departure, a: true },
          ].map((item) => (
            <div key={item.l} className="rounded-xl border border-app-bd2 bg-app-card2 px-3 py-2.5">
              <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-app-mu">{item.l}</div>
              <div className={`text-xs font-semibold ${item.a ? "text-app-am" : "text-app-tx"}`}>{item.v}</div>
            </div>
          ))}
        </div>

        <button 
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-app-am py-3 text-[13px] font-bold text-white shadow-[0_4px_14px_var(--am-g)] transition-all hover:brightness-110 active:scale-[0.98]"
          onClick={() => navigate('/track-bus')}
        >
          <Ic.Target /> Track My Bus
        </button>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { l: "Book Trip", s: "Register now", c: "text-app-am", bg: "bg-app-am-d", p: "bookTrip" },
          { l: "My Trips", s: "View all", c: "text-app-info", bg: "bg-blue-500/10", p: "myTrips" },
          { l: "Notifications", s: "2 new", c: "text-app-err", bg: "bg-red-500/10", p: "notifications" },
          { l: "Route Map", s: "Live view", c: "text-app-ok", bg: "bg-green-500/10", p: "routeDetails" },
        ].map((act) => (
          <div 
            key={act.l} 
            className="group cursor-pointer rounded-2xl border border-app-bd bg-app-card p-4 transition-all hover:border-app-am-g"
            onClick={() => go?.(act.p as Page)}
          >
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${act.bg} ${act.c}`}>
              <Ic.Bus />
            </div>
            <div className="font-syne text-xs font-bold text-app-tx group-hover:text-app-am transition-colors">{act.l}</div>
            <div className="mt-0.5 text-[10px] text-app-mu">{act.s}</div>
          </div>
        ))}
      </div>

      {/* ── Upcoming List ── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-syne text-[13px] font-bold text-app-tx uppercase tracking-wider">Upcoming Trips</h3>
          <button 
            className="cursor-pointer text-[11px] font-bold text-app-am transition-opacity hover:opacity-80"
            onClick={() => go?.("myTrips")}
          >
            View All →
          </button>
        </div>

        <div className="space-y-2.5">
          {TRIPS.filter(t => t.status === "upcoming").slice(0, 2).map(t => (
            <div key={t.id} className="flex items-center justify-between rounded-2xl border border-app-bd bg-app-card p-3.5 transition-all hover:border-app-am-g">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-app-am-d text-app-am">
                  <Ic.Bus />
                </div>
                <div>
                  <div className="font-syne text-[13px] font-bold text-app-tx">
                    {t.from} <span className="mx-1 text-app-mu font-normal">→</span> {t.to}
                  </div>
                  <div className="mt-0.5 text-[11px] text-app-mu font-medium">
                    {t.date} · {t.departure}
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[9px] font-bold text-app-ok uppercase tracking-wider">
                Confirmed
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}