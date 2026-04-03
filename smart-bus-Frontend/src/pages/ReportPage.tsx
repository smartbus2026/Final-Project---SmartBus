import { REPORT_BARS, REPORT_OCCUPANCY } from "../data";

export default function ReportPage() {
  return (
    <div className="p-6 space-y-5">
      
      {/* ── Top Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: "Weekly Registrations", v: "2,124", s: "+8% vs last week", c: "text-app-am" },
          { l: "Avg. Occupancy", v: "84%", s: "+3% improvement", c: "text-app-ok" },
          { l: "Active Drivers", v: "6", s: "1 on leave", c: "text-app-mu" },
          { l: "Total Trips", v: "78", s: "All on schedule", c: "text-app-ok" },
        ].map((stat) => (
          <div key={stat.l} className="group rounded-2xl border border-app-bd bg-app-card p-4 transition-all hover:border-app-am-g">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-app-mu">{stat.l}</div>
            <div className="font-syne text-2xl font-extrabold text-app-tx group-hover:text-app-am transition-colors">{stat.v}</div>
            <div className={`mt-1.5 text-[10px] font-bold ${stat.c}`}>{stat.s}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        
        {/* Bar Chart: Weekly Registrations */}
        <div className="rounded-2xl border border-app-bd bg-app-card p-6">
          <h3 className="mb-8 font-syne text-[13px] font-bold uppercase tracking-wider text-app-tx">Weekly Registrations</h3>
          <div className="flex h-40 items-end justify-between gap-2 px-2">
            {REPORT_BARS.map((b) => (
              <div key={b.day} className="group relative flex flex-1 flex-col items-center gap-3">
                {/* Bar */}
                <div className="relative w-full overflow-hidden rounded-t-lg transition-all duration-500 hover:brightness-110" 
                     style={{ height: `${b.heightPct}%` }}>
                  <div className={`absolute inset-0 ${b.accent ? "bg-app-am shadow-[0_0_15px_var(--am-g)]" : "bg-app-am-d"}`} />
                  {/* Tooltip value on top of bar */}
                  <span className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold ${b.accent ? "text-app-am scale-110" : "text-app-mu"}`}>
                    {b.val}
                  </span>
                </div>
                {/* Day Label */}
                <span className={`text-[10px] font-bold uppercase tracking-tighter ${b.accent ? "text-app-am" : "text-app-mu"}`}>
                  {b.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut Chart: Attendance */}
        <div className="rounded-2xl border border-app-bd bg-app-card p-6">
          <h3 className="font-syne text-[13px] font-bold uppercase tracking-wider text-app-tx">Attendance</h3>
          <p className="mb-6 text-[10px] font-medium text-app-mu">Today's live breakdown</p>
          
          {/* Donut Implementation */}
          <div className="mb-6 flex justify-center">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full shadow-lg"
                 style={{ background: "conic-gradient(var(--ok) 0% 90%, var(--err) 90% 97%, var(--mu) 97% 100%)" }}>
              {/* Inner Hole */}
              <div className="flex h-[74%] w-[74%] flex-col items-center justify-center rounded-full bg-app-card border border-app-bd/50">
                <span className="font-syne text-xl font-black text-app-tx leading-none">90%</span>
                <span className="mt-0.5 text-[8px] font-bold uppercase text-app-mu">Present</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {[
              { l: "Present", v: "1,124 (90%)", c: "bg-app-ok" },
              { l: "Absent", v: "87 (7%)", c: "bg-app-err" },
              { l: "Late", v: "34 (3%)", c: "bg-app-mu" }
            ].map((item) => (
              <div key={item.l} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 font-medium text-app-mu">
                  <span className={`h-2 w-2 rounded-full ${item.c}`} /> {item.l}
                </div>
                <span className="font-bold text-app-tx">{item.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Occupancy Bars ── */}
      <div className="rounded-2xl border border-app-bd bg-app-card p-6">
        <h3 className="mb-6 font-syne text-[13px] font-bold uppercase tracking-wider text-app-tx">Daily Occupancy Rate</h3>
        <div className="max-w-2xl space-y-4">
          {REPORT_OCCUPANCY.map((o) => (
            <div key={o.day} className="flex items-center gap-4 group">
              <span className="w-8 text-[11px] font-black text-app-ok">{o.pct}%</span>
              
              <div className="relative flex-1 h-2 rounded-full bg-app-card2 border border-app-bd/30 overflow-hidden">
                {/* Progress Fill */}
                <div 
                  className="h-full rounded-full bg-app-ok shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-700 ease-out group-hover:brightness-110"
                  style={{ width: `${o.pct}%` }} 
                />
              </div>
              
              <span className="w-10 text-[10px] font-bold text-app-mu text-right uppercase tracking-tighter">
                {o.day}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}