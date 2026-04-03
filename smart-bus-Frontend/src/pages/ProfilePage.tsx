// ──────────────────────────────────────────────
//  pages/ProfilePage.tsx  (Settings)
//
//  شغله إيه؟
//  - بطاقة Avatar مع اسم الطالب وحالته
//  - فورم Personal Info (الاسم، الإيميل، التليفون)
//  - فورم Route Preferences (الخط، نقطة الركوب)
//  - فورم Security (تغيير الباسورد)
//  - زرار Save يحوّل لـ "Saved!" لمدة 2.5 ثانية
// ──────────────────────────────────────────────
import { useState } from "react";
import { Ic } from "../icons";

interface Form {
  firstName: string; lastName: string; email: string; phone: string;
  route: string; pickup: string;
  curPass: string; newPass: string; confPass: string;
}

export default function ProfilePage() {
  const [form, setForm] = useState<Form>({
    firstName:"Sara", lastName:"Ahmed", email:"sara@uni.edu", phone:"79 123 4567",
    route:"r1", pickup:"p2", curPass:"", newPass:"", confPass:"",
  });
  const [saved, setSaved] = useState(false);
  const s = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const FI = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div><label className="fl">{label}</label><input className="fi" {...props} /></div>
  );

  return (
    <div style={{ padding:24, maxWidth:860, margin:"0 auto" }}>

      {/* ── Avatar card ── */}
      <div className="card" style={{ padding:"22px 24px",marginBottom:16,display:"flex",alignItems:"center",gap:22 }}>
        <div style={{ width:76,height:76,borderRadius:"50%",background:"var(--am-d)",color:"var(--am)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:800,fontFamily:"'Syne',sans-serif",border:"3px solid var(--card)",flexShrink:0 }}>S</div>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,marginBottom:4 }}>Sara Ahmed</div>
          <div style={{ fontSize:12,color:"var(--mu)",marginBottom:8 }}>STU-001 · Frontend &amp; CrossPlatform</div>
          <span className="badge badge-g">
            <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--ok)" }} /> Active Account
          </span>
        </div>
      </div>

      {/* ── Form card ── */}
      <div className="card" style={{ padding:"22px 24px" }}>

        {/* Personal Info */}
        <div style={{ borderBottom:"1px solid var(--bd)",paddingBottom:20,marginBottom:20 }}>
          <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:8 }}><Ic.User />Personal Information</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 20px" }}>
            <FI label="First Name" value={form.firstName} onChange={s("firstName")} />
            <FI label="Last Name"  value={form.lastName}  onChange={s("lastName")} />
            <FI label="Email" type="email" value={form.email} onChange={s("email")} />
            <div>
              <label className="fl">Phone</label>
              <div style={{ display:"flex" }}>
                <div style={{ display:"flex",alignItems:"center",padding:"0 10px",background:"var(--card2)",border:"1px solid var(--bd)",borderRight:"none",borderRadius:"10px 0 0 10px",fontSize:12,color:"var(--mu)",fontWeight:600,flexShrink:0 }}>+962</div>
                <input className="fi" style={{ borderRadius:"0 10px 10px 0" }} value={form.phone} onChange={s("phone")} />
              </div>
            </div>
          </div>
        </div>

        {/* Route Preferences */}
        <div style={{ borderBottom:"1px solid var(--bd)",paddingBottom:20,marginBottom:20 }}>
          <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:8 }}><Ic.Map />Route Preferences</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 20px" }}>
            <div>
              <label className="fl">Primary Route</label>
              <select className="fi" value={form.route} onChange={s("route")}>
                <option value="r1">Aqaleem → Stadium</option>
                <option value="r2">Seil → Stadium</option>
                <option value="r3">City Center → Stadium</option>
              </select>
            </div>
            <div>
              <label className="fl">Default Pickup</label>
              <select className="fi" value={form.pickup} onChange={s("pickup")}>
                <option value="p1">Aqaleem Gate</option>
                <option value="p2">Al-Rawda Square</option>
                <option value="p3">Seil Junction</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,marginBottom:16,display:"flex",alignItems:"center",gap:8 }}><Ic.Shield />Security &amp; Password</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 20px" }}>
            <div style={{ gridColumn:"1/-1",maxWidth:360 }}>
              <FI label="Current Password" type="password" placeholder="••••••••" value={form.curPass} onChange={s("curPass")} />
            </div>
            <FI label="New Password"     type="password" placeholder="Leave blank to keep" value={form.newPass}  onChange={s("newPass")} />
            <FI label="Confirm Password" type="password" placeholder="Confirm new password" value={form.confPass} onChange={s("confPass")} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ borderTop:"1px solid var(--bd)",paddingTop:16,display:"flex",justifyContent:"flex-end",gap:10 }}>
          <button className="btn btn-ghost">Discard</button>
          <button className="btn btn-am" onClick={save}>
            {saved ? <><Ic.Check />Saved!</> : <><Ic.Save />Save Profile</>}
          </button>
        </div>
      </div>
    </div>
  );
}