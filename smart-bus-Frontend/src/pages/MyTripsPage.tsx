// ──────────────────────────────────────────────
//  pages/MyTripsPage.tsx
//
//  شغله إيه؟
//  - تابز 3: Upcoming / Completed / Missed
//  - كل كارت: تاريخ + خط + pickup + bus + return
//  - Upcoming  → زرار Cancel (أحمر)
//  - Completed → زرار View Details (ghost)
//  - Missed    → بدون زرار (badge أحمر Cancelled)
// ──────────────────────────────────────────────
import { useState } from "react";
import type { TripStatus } from "../types";
import { TRIPS } from "../data";
import { Ic } from "../icons";

export default function MyTripsPage() {
  const [tab, setTab] = useState<TripStatus>("upcoming");
  const counts = {
    upcoming:  TRIPS.filter(t => t.status === "upcoming").length,
    completed: TRIPS.filter(t => t.status === "completed").length,
    missed:    TRIPS.filter(t => t.status === "missed").length,
  };
  const list = TRIPS.filter(t => t.status === tab);

  const badge = (s: TripStatus) =>
    s === "upcoming"  ? <span className="badge badge-g">Confirmed</span>  :
    s === "completed" ? <span className="badge badge-b">Completed</span>  :
                        <span className="badge badge-r">Cancelled</span>;

  return (
    <div style={{ padding: 24 }}>
      <div className="tabs">
        {(["upcoming","completed","missed"] as TripStatus[]).map(t => (
          <div key={t} className={`tab${tab === t ? " act" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t]})
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))", gap:14 }}>
        {list.map(t => (
          <div key={t.id} className="card" style={{ padding:"18px 20px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
              <span style={{ fontSize:12,color:"var(--mu)" }}>{t.date}</span>
              {badge(t.status)}
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:7,marginBottom:13 }}>
              <Ic.Pin /><span style={{ color:"var(--am)" }}>{t.from}</span>
              <span style={{ color:"var(--mu)",fontWeight:400 }}>→</span>{t.to}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9 }}>
              {[["Pickup",t.pickup,false],["Bus",t.bus,false],["Return",t.returnTime,true]].map(([l,v,a]) => (
                <div key={String(l)} className="ci" style={{ padding:"9px 11px" }}>
                  <div style={{ fontSize:9,color:"var(--mu)",fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",marginBottom:4 }}>{String(l)}</div>
                  <div style={{ fontSize:12,fontWeight:600,color:a?"var(--am)":"var(--tx)" }}>{String(v)}</div>
                </div>
              ))}
            </div>
            {t.status === "upcoming"  && <button className="btn btn-err"   style={{ width:"100%",marginTop:13,fontSize:11 }}><Ic.X /> Cancel Booking</button>}
            {t.status === "completed" && <button className="btn btn-ghost" style={{ width:"100%",marginTop:13,fontSize:11 }}>View Details</button>}
          </div>
        ))}
      </div>
    </div>
  );
}