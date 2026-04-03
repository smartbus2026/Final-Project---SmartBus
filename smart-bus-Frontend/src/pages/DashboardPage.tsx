// ──────────────────────────────────────────────
//  pages/DashboardPage.tsx
//
//  شغله إيه؟
//  - 4 stat cards (إجمالي، مكتمل، قادم، فايت)
//  - بطاقة الرحلة القادمة مع Track button
//  - 4 quick action cards
//  - آخر رحلتين قادمتين
// ──────────────────────────────────────────────
import type { Page } from "../types";
import { TRIPS } from "../data";
import { Ic } from "../icons";

export default function DashboardPage({ go }: { go: (p: Page) => void }) {
  const next = TRIPS[0];
  const stats = [
    { l:"Total Trips", v:"24", c:"var(--am)",   bg:"var(--am-d)"           },
    { l:"Completed",   v:"19", c:"var(--ok)",   bg:"rgba(16,185,129,.1)"   },
    { l:"Upcoming",    v:"3",  c:"var(--info)",  bg:"rgba(59,130,246,.1)"  },
    { l:"Missed",      v:"2",  c:"var(--err)",   bg:"rgba(239,68,68,.1)"   },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* ── Stat cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {stats.map(s => (
          <div key={s.l} className="card" style={{ padding:"14px 16px" }}>
            <div style={{ width:30,height:30,borderRadius:8,background:s.bg,color:s.c,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10 }}><Ic.Bus /></div>
            <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:22,lineHeight:1,marginBottom:3 }}>{s.v}</div>
            <div style={{ fontSize:11,color:"var(--mu)" }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── Hero: next trip ── */}
      <div className="card" style={{ padding:"20px 22px",marginBottom:20,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-40,right:-30,width:160,height:160,background:"radial-gradient(circle,var(--am-g),transparent 70%)",borderRadius:"50%",pointerEvents:"none" }} />
        <div style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--mu)",marginBottom:14 }}>Next Trip</div>
        <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,display:"flex",alignItems:"center",gap:8,marginBottom:16 }}>
          <Ic.Pin /><span style={{ color:"var(--am)" }}>{next.from}</span>
          <span style={{ color:"var(--mu)",fontWeight:400,fontSize:14 }}>→</span>{next.to}
          <span className="badge badge-g" style={{ marginLeft:"auto" }}>Confirmed</span>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16 }}>
          {[["Date",next.date,false],["Pickup",next.pickup,false],["Bus",next.bus,false],["Dep.",next.departure,true]].map(([l,v,a]) => (
            <div key={String(l)} className="ci" style={{ padding:"10px 12px" }}>
              <div style={{ fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",marginBottom:4 }}>{String(l)}</div>
              <div style={{ fontSize:12,fontWeight:600,color:a?"var(--am)":"var(--tx)" }}>{String(v)}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-am" style={{ width:"100%" }} onClick={() => go("trackBus")}><Ic.Target /> Track My Bus</button>
      </div>

      {/* ── Quick actions ── */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20 }}>
        {[
          ["Book Trip",      "Register now", "var(--am)",  "var(--am-d)",          "bookTrip"     ],
          ["My Trips",       "View all",     "var(--info)","rgba(59,130,246,.1)",  "myTrips"      ],
          ["Notifications",  "2 new",        "var(--err)", "rgba(239,68,68,.1)",   "notifications"],
          ["Route Map",      "Live view",    "var(--ok)",  "rgba(16,185,129,.1)",  "routeDetails" ],
        ].map(([l,s,c,bg,p]) => (
          <div key={String(l)} className="card" style={{ padding:16,cursor:"pointer" }} onClick={() => go(String(p) as Page)}>
            <div style={{ width:32,height:32,borderRadius:8,background:String(bg),color:String(c),display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8 }}><Ic.Bus /></div>
            <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:12 }}>{String(l)}</div>
            <div style={{ fontSize:10,color:"var(--mu)",marginTop:2 }}>{String(s)}</div>
          </div>
        ))}
      </div>

      {/* ── Upcoming list ── */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13 }}>Upcoming Trips</div>
        <span style={{ fontSize:11,color:"var(--am)",fontWeight:600,cursor:"pointer" }} onClick={() => go("myTrips")}>View All →</span>
      </div>
      {TRIPS.filter(t => t.status === "upcoming").slice(0, 2).map(t => (
        <div key={t.id} className="card" style={{ padding:"13px 18px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:36,height:36,borderRadius:9,background:"var(--am-d)",color:"var(--am)",display:"flex",alignItems:"center",justifyContent:"center" }}><Ic.Bus /></div>
            <div>
              <div style={{ fontWeight:700,fontSize:13,fontFamily:"'Syne',sans-serif" }}>{t.from} → {t.to}</div>
              <div style={{ fontSize:11,color:"var(--mu)",marginTop:2 }}>{t.date} · {t.departure}</div>
            </div>
          </div>
          <span className="badge badge-g">Confirmed</span>
        </div>
      ))}
    </div>
  );
}