// ──────────────────────────────────────────────
//  pages/NotificationsPage.tsx
//
//  شغله إيه؟
//  - يعرض قائمة الإشعارات المُرسَلة للطالب
//  - كل إشعار: أيقونة جرس + العنوان + الوقت
//    + الرسالة + عدد مَن قرأه
// ──────────────────────────────────────────────
import { NOTIFS } from "../data";
import { Ic } from "../icons";

export default function NotificationsPage() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display:"flex",flexDirection:"column",gap:11 }}>
        {NOTIFS.map(n => (
          <div key={n.id} className="card" style={{ padding:"16px 18px",display:"flex",alignItems:"flex-start",gap:12 }}>
            <div style={{ width:36,height:36,borderRadius:9,background:"var(--am-d)",color:"var(--am)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <Ic.Bell />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:10 }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:13,marginBottom:2 }}>{n.title}</div>
                  <div style={{ fontSize:10,color:"var(--mu)" }}>{n.time}</div>
                </div>
                <span className="badge badge-mu">{n.target}</span>
              </div>
              <div style={{ fontSize:12,color:"var(--mu)",marginTop:6,lineHeight:1.5 }}>{n.message}</div>
              <div style={{ fontSize:11,color:"var(--ok)",display:"flex",alignItems:"center",gap:4,marginTop:8,fontWeight:600 }}>
                <Ic.Check /> Read by {n.readCount} users
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}