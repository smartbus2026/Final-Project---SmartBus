// ──────────────────────────────────────────────
//  pages/SupportPage.tsx
//
//  شغله إيه؟
//  - جزء يسار: FAQ accordion (اضغط السؤال يفتح الجواب)
//  - جزء يمين: فورم إرسال تذكرة دعم
//  - أسفل: قائمة التذاكر السابقة مع حالة كل تذكرة
// ──────────────────────────────────────────────
import { useState } from "react";
import { FAQS, TICKETS } from "../data";
import { Ic } from "../icons";

const STATUS_BADGE: Record<string,string> = {
  resolved: "badge-g",
  open:     "badge-a",
  pending:  "badge-mu",
};

export default function SupportPage() {
  const [openFaq,  setOpenFaq]  = useState<number | null>(0);
  const [subject,  setSubject]  = useState("");
  const [desc,     setDesc]     = useState("");
  const [submitted,setSubmitted]= useState(false);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>

        {/* ── FAQ ── */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,marginBottom:18,display:"flex",alignItems:"center",gap:8 }}>
            <Ic.Help /> Frequently Asked Questions
          </div>
          {FAQS.map((f, i) => (
            <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? "1px solid var(--bd)" : "none" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ display:"flex",width:"100%",justifyContent:"space-between",alignItems:"center",padding:"13px 0",background:"none",border:"none",cursor:"pointer",color:"var(--tx)",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,textAlign:"left",gap:10 }}
              >
                {f.q}
                <span style={{ transform:openFaq===i?"rotate(180deg)":"none",transition:"transform .25s",color:"var(--mu)",flexShrink:0 }}><Ic.ChevDown /></span>
              </button>
              {openFaq === i && (
                <div style={{ fontSize:12,color:"var(--mu)",lineHeight:1.6,paddingBottom:13 }}>{f.a}</div>
              )}
            </div>
          ))}
        </div>

        {/* ── Submit ticket ── */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,marginBottom:18,display:"flex",alignItems:"center",gap:8 }}>
            <Ic.Chat /> Submit a Ticket
          </div>
          {submitted ? (
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,padding:"40px 0",textAlign:"center" }}>
              <div style={{ width:48,height:48,borderRadius:"50%",background:"rgba(16,185,129,.1)",display:"flex",alignItems:"center",justifyContent:"center" }}><Ic.Check /></div>
              <div style={{ fontWeight:700,fontSize:14 }}>Ticket Submitted!</div>
              <div style={{ fontSize:12,color:"var(--mu)" }}>We'll respond within 24 hours.</div>
              <button className="btn btn-am" onClick={() => { setSubmitted(false); setSubject(""); setDesc(""); }}>Send Another</button>
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <div>
                <label className="fl">Subject</label>
                <input className="fi" placeholder="Brief description of your issue..." value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div>
                <label className="fl">Description</label>
                <textarea className="fi" rows={5} style={{ resize:"none" }} placeholder="More details..." value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
              <button className="btn btn-am" style={{ width:"100%" }} onClick={() => subject.trim() && setSubmitted(true)} disabled={!subject.trim()}>
                <Ic.Send /> Submit Ticket
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Previous tickets ── */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,marginBottom:16 }}>Your Tickets</div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          {TICKETS.map(t => (
            <div key={t.id} className="ci" style={{ padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer" }}>
              <div>
                <div style={{ fontSize:13,fontWeight:600,color:"var(--tx)",marginBottom:3 }}>{t.subject}</div>
                <div style={{ fontSize:11,color:"var(--mu)" }}>{t.id} · {t.date}</div>
              </div>
              <span className={`badge ${STATUS_BADGE[t.status]}`}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}