// ──────────────────────────────────────────────
//  pages/ReportPage.tsx  (Attendance)
//
//  شغله إيه؟
//  - 4 stat cards للإدارة (registrations, occupancy, drivers, trips)
//  - Bar chart أسبوعي للتسجيلات
//  - Donut chart لنسب الحضور
//  - أشرطة تقدم يومية للـ occupancy
// ──────────────────────────────────────────────
import { REPORT_BARS, REPORT_OCCUPANCY } from "../data";

export default function ReportPage() {
  return (
    <div style={{ padding: 24 }}>
      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18 }}>
        {[
          ["Weekly Registrations","2,124","+8% vs last week","var(--am)"],
          ["Avg. Occupancy","84%","+3% improvement","var(--ok)"],
          ["Active Drivers","6","1 on leave","var(--mu)"],
          ["Total Trips","78","All on schedule","var(--ok)"],
        ].map(([l,v,s,c]) => (
          <div key={String(l)} className="card" style={{ padding:"14px 16px" }}>
            <div style={{ fontSize:11,color:"var(--mu)",marginBottom:8 }}>{String(l)}</div>
            <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:24,lineHeight:1,marginBottom:4 }}>{String(v)}</div>
            <div style={{ fontSize:11,color:String(c),fontWeight:600 }}>{String(s)}</div>
          </div>
        ))}
      </div>

      {/* Bar chart + Donut */}
      <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:16 }}>
        <div className="card" style={{ padding:"20px 22px" }}>
          <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,marginBottom:20 }}>Weekly Registrations</div>
          <div style={{ display:"flex",height:140,alignItems:"flex-end",justifyContent:"space-between",gap:6,padding:"0 4px" }}>
            {REPORT_BARS.map(b => (
              <div key={b.day} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
                <div style={{ position:"relative",width:"100%",height:`${b.heightPct}%` }}>
                  <div style={{ position:"absolute",inset:0,borderRadius:"4px 4px 0 0",background:b.accent?"var(--am)":"var(--am-d)" }} />
                  <span style={{ position:"absolute",top:-18,left:"50%",transform:"translateX(-50%)",fontSize:10,fontWeight:700,color:b.accent?"var(--am)":"var(--mu)" }}>{b.val}</span>
                </div>
                <span style={{ fontSize:10,color:b.accent?"var(--am)":"var(--mu)",fontWeight:b.accent?700:400 }}>{b.day}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding:"20px 22px" }}>
          <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,marginBottom:4 }}>Attendance</div>
          <div style={{ fontSize:11,color:"var(--mu)",marginBottom:16 }}>Today's breakdown</div>
          <div style={{ display:"flex",justifyContent:"center",marginBottom:16 }}>
            <div style={{ width:110,height:110,borderRadius:"50%",background:"conic-gradient(#10b981 0% 90%,#ef4444 90% 97%,#94a3b8 97% 100%)",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <div style={{ width:80,height:80,borderRadius:"50%",background:"var(--card)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                <span style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16 }}>90%</span>
                <span style={{ fontSize:9,color:"var(--mu)" }}>Present</span>
              </div>
            </div>
          </div>
          {[["Present","1,124 (90%)","var(--ok)"],["Absent","87 (7%)","var(--err)"],["Late","34 (3%)","var(--mu)"]].map(([l,v,c]) => (
            <div key={String(l)} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,marginBottom:8 }}>
              <div style={{ display:"flex",alignItems:"center",gap:7,color:"var(--mu)" }}>
                <span style={{ width:6,height:6,borderRadius:"50%",background:String(c) }} />{String(l)}
              </div>
              <span style={{ fontWeight:600,color:"var(--tx)" }}>{String(v)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Occupancy bars */}
      <div className="card" style={{ padding:"20px 22px" }}>
        <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,marginBottom:16 }}>Daily Occupancy Rate</div>
        <div style={{ maxWidth:600,display:"flex",flexDirection:"column",gap:12 }}>
          {REPORT_OCCUPANCY.map(o => (
            <div key={o.day} style={{ display:"flex",alignItems:"center",gap:14 }}>
              <span style={{ width:32,fontSize:11,fontWeight:700,color:"var(--ok)" }}>{o.pct}%</span>
              <div style={{ flex:1,height:6,borderRadius:4,background:"var(--card2)",overflow:"hidden" }}>
                <div style={{ height:"100%",borderRadius:4,background:"var(--ok)",opacity:.8,width:`${o.pct}%`,transition:"width .5s" }} />
              </div>
              <span style={{ width:28,fontSize:10,color:"var(--mu)",textAlign:"right" }}>{o.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}