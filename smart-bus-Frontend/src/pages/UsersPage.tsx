// ──────────────────────────────────────────────
//  pages/UsersPage.tsx  (Admin Users)
//
//  شغله إيه؟
//  - تابز: All / Students / Drivers مع عداد
//  - Search bar بيفلتر بالاسم أو الإيميل
//  - جدول فيه: الاسم، الإيميل+تليفون، الدور، الحالة، تاريخ الانضمام
//  - كل صف فيه dropdown بـ 3 أكشنز (View / Edit / Activate-Deactivate)
//  - Pagination بسيطة في الأسفل
// ──────────────────────────────────────────────
import { useState } from "react";
import { USERS } from "../data";
import { Ic } from "../icons";

type Tab = "all" | "students" | "drivers";

const ROLE_BADGE: Record<string, string> = {
  Student: "badge-g",
  Driver:  "badge-a",
};

export default function UsersPage() {
  const [tab,  setTab]  = useState<Tab>("all");
  const [q,    setQ]    = useState("");
  const [menu, setMenu] = useState<string | null>(null);

  const list = USERS.filter(u => {
    const matchTab =
      tab === "all" ||
      (tab === "students" && u.role === "Student") ||
      (tab === "drivers"  && u.role === "Driver");
    const matchQ =
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase());
    return matchTab && matchQ;
  });

  const counts = {
    all:      USERS.length,
    students: USERS.filter(u => u.role === "Student").length,
    drivers:  USERS.filter(u => u.role === "Driver").length,
  };

  return (
    <div style={{ padding: 24 }}>

      {/* ── Top row: tabs + actions ── */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10 }}>
        <div className="tabs" style={{ margin:0 }}>
          {(["all","students","drivers"] as Tab[]).map(t => (
            <div key={t} className={`tab${tab === t ? " act" : ""}`} onClick={() => setTab(t)}>
              {t === "all" ? "All Users" : t === "students" ? "Students" : "Drivers"} ({counts[t]})
            </div>
          ))}
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button className="btn btn-am"    style={{ fontSize:12 }}><Ic.Plus />   Add User</button>
          <button className="btn btn-ghost" style={{ fontSize:12 }}><Ic.Download />Export</button>
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div style={{ display:"flex",gap:8,marginBottom:14 }}>
        <div style={{ flex:1,position:"relative" }}>
          <span style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--mu)",pointerEvents:"none" }}>
            <Ic.Search />
          </span>
          <input
            className="fi" style={{ paddingLeft:40 }}
            placeholder="Search by name or email..."
            value={q} onChange={e => setQ(e.target.value)}
          />
        </div>
        <button className="btn btn-ghost" style={{ fontSize:12 }}><Ic.Filter /> Filters</button>
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",minWidth:720,borderCollapse:"collapse",fontSize:13,textAlign:"left" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--bd)",background:"var(--card2)" }}>
                {["User","Contact","Role","Status","Joined",""].map(h => (
                  <th key={h} style={{ padding:"12px 18px",fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--mu)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding:"40px 18px",textAlign:"center",fontSize:13,color:"var(--mu)" }}>
                    No users found
                  </td>
                </tr>
              )}
              {list.map(u => (
                <tr
                  key={u.id}
                  style={{ borderBottom:"1px solid var(--bd2)",transition:"background .1s",cursor:"default" }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--bd2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ""}
                >
                  {/* User */}
                  <td style={{ padding:"13px 18px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                      <div className={`${u.avatarColor}`} style={{ width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0 }}>
                        {u.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight:600,color:"var(--tx)" }}>{u.name}</div>
                        <div style={{ fontSize:11,color:"var(--mu)" }}>{u.id}</div>
                      </div>
                    </div>
                  </td>
                  {/* Contact */}
                  <td style={{ padding:"13px 18px",fontSize:11,color:"var(--mu)" }}>
                    <div style={{ marginBottom:3 }}>✉ {u.email}</div>
                    <div>📞 {u.phone}</div>
                  </td>
                  {/* Role */}
                  <td style={{ padding:"13px 18px" }}>
                    <span className={`badge ${ROLE_BADGE[u.role]}`}>{u.role}</span>
                  </td>
                  {/* Status */}
                  <td style={{ padding:"13px 18px" }}>
                    <span style={{ display:"flex",alignItems:"center",gap:6,fontWeight:600,color:"var(--tx)",whiteSpace:"nowrap" }}>
                      <span style={{ width:6,height:6,borderRadius:"50%",background:u.status === "Active" ? "var(--ok)" : "var(--mu)" }} />
                      {u.status}
                    </span>
                  </td>
                  {/* Joined */}
                  <td style={{ padding:"13px 18px",color:"var(--mu)",fontSize:12,whiteSpace:"nowrap" }}>{u.joined}</td>
                  {/* Actions */}
                  <td style={{ padding:"13px 18px",position:"relative" }}>
                    <button
                      onClick={() => setMenu(menu === u.id ? null : u.id)}
                      style={{ background:"none",border:"none",cursor:"pointer",color:"var(--mu)",padding:"4px 8px",borderRadius:6 }}
                    >
                      <Ic.Dots />
                    </button>
                    {menu === u.id && (
                      <div className="drop" style={{ width:150,right:4,top:"100%" }} onClick={e => e.stopPropagation()}>
                        <div className="u-items">
                          {["View Profile","Edit User", u.status === "Active" ? "Deactivate" : "Activate"].map(a => (
                            <button
                              key={a}
                              className={`u-item${a === "Deactivate" ? " red" : ""}`}
                              onClick={() => setMenu(null)}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 18px",borderTop:"1px solid var(--bd)" }}>
          <span style={{ fontSize:11,color:"var(--mu)" }}>Showing {list.length} of {USERS.length} users</span>
          <div style={{ display:"flex",gap:4 }}>
            {["←","1","2","→"].map(p => (
              <button
                key={p}
                style={{ width:28,height:28,borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",background:p==="1"?"var(--am)":"var(--card2)",color:p==="1"?"#fff":"var(--mu)" }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}