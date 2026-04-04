import { useState } from "react";
import { Ic } from "../icons";

type Aud = "all" | "students" | "drivers" | "route";

const TMPLS = [
  { l: "Registration Reminder", t: "Registration Window Open", m: "Don't forget to register for tomorrow's bus. Window closes at 2:00 PM." },
  { l: "Trip Delay", t: "Trip Delay Notice", m: "Your bus is running ~15 minutes late. We apologize for the inconvenience." },
  { l: "Route Change", t: "Route Change Notice", m: "Your route will use an alternative road today. Please arrive 5 minutes early." },
  { l: "General Announcement", t: "Announcement", m: "" },
];

const AUD_LABEL: Record<Aud, string> = { all: "All Users", students: "Students", drivers: "Drivers", route: "Route" };
const AUD_COUNT: Record<Aud, string> = { all: "~1,200", students: "~950", drivers: "~6", route: "~300" };

export default function NewNotifPage() {
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState("");
  const [aud, setAud] = useState<Aud>("all");
  const [sent, setSent] = useState(false);

  const clearForm = () => { setTitle(""); setMsg(""); setSent(false); };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">

        {/* ── Left Column: Compose & Templates ── */}
        <div className="flex flex-col gap-4">
          
          {/* Compose Card */}
          <div className="rounded-2xl border border-app-bd bg-app-card p-5 shadow-sm">
            <h3 className="mb-4 font-syne text-[13px] font-bold uppercase tracking-wider text-app-tx">Compose</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-app-mu uppercase">Title</label>
                <input 
                  className="w-full rounded-xl border border-app-bd bg-app-card2 px-3.5 py-2.5 font-dm text-[13px] text-app-tx outline-none transition-all focus:border-app-am focus:ring-1 focus:ring-app-am/20 placeholder:text-app-mu2"
                  placeholder="Notification title..." 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-app-mu uppercase">Message</label>
                <textarea 
                  className="w-full resize-none rounded-xl border border-app-bd bg-app-card2 px-3.5 py-2.5 font-dm text-[13px] text-app-tx outline-none transition-all focus:border-app-am focus:ring-1 focus:ring-app-am/20 placeholder:text-app-mu2"
                  rows={4}
                  placeholder="Write your message..." 
                  value={msg} 
                  onChange={e => setMsg(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold text-app-mu uppercase">Audience</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["all", "students", "drivers", "route"] as Aud[]).map(a => (
                    <button 
                      key={a} 
                      onClick={() => setAud(a)} 
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-[11px] font-bold transition-all
                        ${aud === a ? "border-app-am-g bg-app-am-d text-app-am shadow-inner" : "border-app-bd bg-app-card2 text-app-mu hover:border-app-mu hover:text-app-tx"}`}
                    >
                      {AUD_LABEL[a]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-app-am py-3 text-[13px] font-bold text-white shadow-[0_4px_12px_var(--am-g)] transition-all hover:brightness-110 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                  disabled={!title || !msg}
                  onClick={() => setSent(true)}
                >
                  <Ic.Send /> Send Now
                </button>
                <button 
                  className="rounded-xl border border-app-bd px-4 py-3 text-[12px] font-bold text-app-mu transition-all hover:bg-app-bd2 hover:text-app-tx cursor-pointer"
                  onClick={clearForm}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Templates Card */}
          <div className="rounded-2xl border border-app-bd bg-app-card p-5">
            <h3 className="mb-3 font-syne text-[13px] font-bold uppercase tracking-wider text-app-tx">Quick Templates</h3>
            <div className="space-y-1">
              {TMPLS.map(t => (
                <button 
                  key={t.l} 
                  onClick={() => { setTitle(t.t); setMsg(t.m); setSent(false); }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[12px] text-app-mu transition-all hover:bg-app-am-d hover:text-app-am group"
                >
                  <Ic.Bell  />
                  <span className="font-medium">{t.l}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column: Preview ── */}
        <div className="flex flex-col rounded-2xl border border-app-bd bg-app-card p-6 shadow-sm min-h-[400px]">
          <h3 className="mb-6 font-syne text-[13px] font-bold uppercase tracking-wider text-app-tx">Preview</h3>
          
          <div className="flex flex-1 flex-col items-center justify-center">
            {sent ? (
              <div className="max-w-[300px] text-center animate-in fade-in zoom-in duration-300">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-app-ok">
                  <Ic.Check />
                </div>
                <h4 className="text-lg font-bold text-app-tx leading-tight">Sent Successfully!</h4>
                <p className="mt-1.5 text-xs text-app-mu">Your message has been delivered to <span className="font-bold text-app-tx">{AUD_COUNT[aud]}</span> active users.</p>
                <button 
                  className="mt-6 cursor-pointer text-xs font-bold text-app-am underline underline-offset-4 hover:opacity-80"
                  onClick={clearForm}
                >
                  Compose another message
                </button>
              </div>
            ) : !title && !msg ? (
              <div className="flex flex-col items-center text-center opacity-40">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-app-card2 text-app-mu">
                  <Ic.Bell  />
                </div>
                <p className="text-[13px] font-medium text-app-mu">Fill in the title and message to<br/>see how it looks for users.</p>
              </div>
            ) : (
              <div className="w-full max-w-[340px] animate-in slide-in-from-bottom-2 duration-300">
                {/* Mobile Notification Mockup */}
                <div className="rounded-[22px] border border-app-bd bg-app-card shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden">
                  <div className="flex items-center gap-2.5 border-b border-app-bd bg-app-bg2/50 px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-app-am text-white shadow-sm">
                      <Ic.Bus  />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-extrabold leading-none text-app-tx">SmartBus</div>
                      <div className="mt-1 text-[9px] font-medium text-app-mu uppercase tracking-tight">Now • App Notification</div>
                    </div>
                  </div>
                  <div className="px-4 py-4">
                    <div className="text-[14px] font-bold text-app-tx leading-tight">{title || "Title..."}</div>
                    <div className="mt-1.5 text-[12px] leading-relaxed text-app-mu">{msg || "Message details will appear here..."}</div>
                  </div>
                  <div className="flex items-center justify-between border-t border-app-bd bg-app-bg2/30 px-4 py-2.5">
                    <span className="text-[10px] font-semibold text-app-mu2 uppercase tracking-wider">Target: {AUD_LABEL[aud]}</span>
                    <span className="rounded-md bg-app-am-d px-2 py-0.5 text-[9px] font-extrabold text-app-am uppercase tracking-wider">Preview</span>
                  </div>
                </div>

                {/* Delivery Stats Summary */}
                <div className="mt-8 rounded-2xl border border-app-bd2 bg-app-card2 p-4">
                  <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-app-mu text-center">Delivery Meta</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "Recipients", v: AUD_COUNT[aud] },
                      { l: "Priority", v: "High" },
                      { l: "Status", v: "Ready" }
                    ].map(stat => (
                      <div key={stat.l} className="flex flex-col items-center rounded-xl bg-app-card p-2 border border-app-bd">
                        <div className="text-[8px] font-bold text-app-mu2 uppercase">{stat.l}</div>
                        <div className="text-[11px] font-extrabold text-app-tx">{stat.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}