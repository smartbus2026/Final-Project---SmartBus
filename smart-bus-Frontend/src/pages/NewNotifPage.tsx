// ──────────────────────────────────────────────
//  pages/NewNotifPage.tsx  (Route Chat / Compose)
//
//  شغله إيه؟
//  - فورم كتابة إشعار جديد (عنوان + رسالة + الجمهور)
//  - Quick Templates: اضغط template يملّي الفورم تلقائي
//  - Preview: بتشوف شكل الإشعار قبل ما ترسله
//  - لما تضغط Send: بيظهر رسالة نجاح
// ──────────────────────────────────────────────
import { useState } from "react";
import { Ic } from "../icons";

type Aud = "all" | "students" | "drivers" | "route";

const TMPLS = [
  { l:"Registration Reminder", t:"Registration Window Open",  m:"Don't forget to register for tomorrow's bus. Window closes at 2:00 PM." },
  { l:"Trip Delay",            t:"Trip Delay Notice",          m:"Your bus is running ~15 minutes late. We apologize for the inconvenience." },
  { l:"Route Change",          t:"Route Change Notice",        m:"Your route will use an alternative road today. Please arrive 5 minutes early." },
  { l:"General Announcement",  t:"Announcement",               m:"" },
];

const AUD_LABEL: Record<Aud, string> = { all:"All Users", students:"Students", drivers:"Drivers", route:"Route" };
const AUD_COUNT: Record<Aud, string> = { all:"~1,200", students:"~950", drivers:"~6", route:"~300" };

export default function NewNotifPage() {
  const [title, setTitle] = useState("");
  const [msg,   setMsg]   = useState("");
  const [aud,   setAud]   = useState<Aud>("all");
  const [sent,  setSent]  = useState(false);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display:"grid",gridTemplateColumns:"300px 1fr",gap:16 }}>

        {/* ── Left: Compose + Templates ── */}
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,marginBottom:16 }}>Compose</div>
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              <div><label className="fl">Title</label><input className="fi" placeholder="Notification title..." value={title} onChange={e=>setTitle(e.target.value)}/></div>
              <div><label className="fl">Message</label><textarea className="fi" rows={5} style={{resize:"none"}} placeholder="Write your message..." value={msg} onChange={e=>setMsg(e.target.value)}/></div>
              <div>
                <label className="fl">Audience</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {(["all","students","drivers","route"] as Aud[]).map(a=>(
                    <button key={a} onClick={()=>setAud(a)} className="btn" style={{fontSize:11,padding:"7px 10px",background:aud===a?"var(--am-d)":"var(--card2)",color:aud===a?"var(--am)":"var(--mu)",border:`1px solid ${aud===a?"var(--am-g)":"var(--bd)"}`}}>
                      {AUD_LABEL[a]}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:8,paddingTop:4}}>
                <button className="btn btn-am" style={{flex:1,fontSize:12}} disabled={!title||!msg} onClick={()=>setSent(true)}><Ic.Send/>Send Now</button>
                <button className="btn btn-ghost" style={{padding:"9px 14px"}} onClick={()=>{setTitle("");setMsg("");}}>Clear</button>
              </div>
            </div>
          </div>

          <div className="card" style={{padding:20}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,marginBottom:12}}>Quick Templates</div>
            {TMPLS.map(t=>(
              <button key={t.l} onClick={()=>{setTitle(t.t);setMsg(t.m);}}
                style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"9px 6px",background:"none",border:"none",cursor:"pointer",color:"var(--mu)",fontSize:12,textAlign:"left",borderRadius:8,transition:"all .12s",fontFamily:"'DM Sans',sans-serif"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color="var(--am)";(e.currentTarget as HTMLElement).style.background="var(--am-d)"}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color="var(--mu)";(e.currentTarget as HTMLElement).style.background="none"}}
              >
                <Ic.Bell/>{t.l}
              </button>
            ))}
          </div>
        </div>

        {/* ── Right: Preview ── */}
        <div className="card" style={{padding:22}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,marginBottom:16}}>Preview</div>
          {sent ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,padding:"60px 0",textAlign:"center"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(16,185,129,.1)",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Check/></div>
              <div style={{fontWeight:700,fontSize:15}}>Sent Successfully!</div>
              <div style={{fontSize:12,color:"var(--mu)"}}>Delivered to {AUD_COUNT[aud]} users.</div>
              <button className="btn btn-am" onClick={()=>{setSent(false);setTitle("");setMsg("");}}>Send Another</button>
            </div>
          ) : !title && !msg ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,padding:"60px 0",textAlign:"center"}}>
              <Ic.Bell/><div style={{fontSize:12,color:"var(--mu)"}}>Start composing to preview</div>
            </div>
          ) : (
            <div>
              <div style={{maxWidth:320,margin:"0 auto"}}>
                <div className="card" style={{overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderBottom:"1px solid var(--bd)"}}>
                    <div style={{width:32,height:32,borderRadius:8,background:"var(--am)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}><Ic.Bus/></div>
                    <div><div style={{fontSize:11,fontWeight:700}}>SmartBus</div><div style={{fontSize:9,color:"var(--mu)"}}>now</div></div>
                  </div>
                  <div style={{padding:"12px 14px"}}>
                    <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{title||"Title..."}</div>
                    <div style={{fontSize:11,color:"var(--mu)",lineHeight:1.5}}>{msg||"Message..."}</div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"10px 14px",borderTop:"1px solid var(--bd)"}}>
                    <span style={{fontSize:10,color:"var(--mu)"}}>To: {AUD_LABEL[aud]}</span>
                    <span className="badge badge-a" style={{fontSize:9}}>Preview</span>
                  </div>
                </div>
              </div>
              <div className="ci" style={{padding:"14px 16px",marginTop:16}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--mu)",letterSpacing:".08em",textTransform:"uppercase",marginBottom:10}}>Delivery Summary</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[["Recipients",AUD_COUNT[aud]],["Channel","In-App"],["Status","Ready"]].map(([l,v])=>(
                    <div key={String(l)} style={{background:"var(--card2)",borderRadius:9,padding:"10px",textAlign:"center"}}>
                      <div style={{fontSize:9,color:"var(--mu)",textTransform:"uppercase",marginBottom:4}}>{String(l)}</div>
                      <div style={{fontSize:12,fontWeight:700}}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}