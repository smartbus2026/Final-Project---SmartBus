// ──────────────────────────────────────────────
//  pages/RouteDetailsPage.tsx
//
//  شغله إيه؟
//  - يعرض كل الخطوط المتاحة
//  - كل خط: اسمه + المحطات كـ timeline مرئي
//  - تفاصيل السائق + وقت الانطلاق
// ──────────────────────────────────────────────
import { ROUTES } from "../data";
import { Ic } from "../icons";

export default function RouteDetailsPage() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:14 }}>
        {ROUTES.map(r => (
          <div key={r.name} className="card" style={{ padding: 20 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
              <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14 }}>{r.name}</div>
              <span className="badge badge-a">{r.bus}</span>
            </div>
            {/* Timeline */}
            {r.stops.map((stop, i) => {
              const isLast = i === r.stops.length - 1;
              const isEnd  = i === 0 || isLast;
              return (
                <div key={stop} style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"center" }}>
                    <div style={{ width:8,height:8,borderRadius:"50%",flexShrink:0,
                      background:isEnd?"var(--am)":"var(--mu)",
                      border:isEnd?"none":"2px solid var(--mu)" }} />
                    {!isLast && <div style={{ width:1,height:22,background:"var(--bd)" }} />}
                  </div>
                  <div style={{ fontSize:12,color:isEnd?"var(--tx)":"var(--mu)",fontWeight:isEnd?600:400,paddingBottom:isLast?0:22 }}>
                    {stop}
                  </div>
                </div>
              );
            })}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14 }}>
              <div className="ci" style={{ padding:"9px 11px" }}>
                <div style={{ fontSize:9,color:"var(--mu)",fontWeight:700,textTransform:"uppercase",marginBottom:4 }}>Driver</div>
                <div style={{ fontSize:11,fontWeight:600,color:"var(--tx)" }}>{r.driver}</div>
              </div>
              <div className="ci" style={{ padding:"9px 11px" }}>
                <div style={{ fontSize:9,color:"var(--mu)",fontWeight:700,textTransform:"uppercase",marginBottom:4 }}>Departure</div>
                <div style={{ fontSize:12,fontWeight:600,color:"var(--am)" }}>{r.time}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}