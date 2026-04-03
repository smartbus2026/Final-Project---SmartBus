import { useState } from "react";
import { FAQS, TICKETS } from "../data";
import { Ic } from "../icons";

const STATUS_MAP = {
  resolved: "bg-green-500/10 text-app-ok border-green-500/20",
  open: "bg-app-am-d text-app-am border-app-am-g",
  pending: "bg-app-bd2 text-app-mu border-app-bd",
};

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Left: FAQ Accordion ── */}
        <div className="rounded-2xl border border-app-bd bg-app-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2.5 font-syne text-[14px] font-extrabold uppercase tracking-wider text-app-tx">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-app-am-d text-app-am">
              <Ic.Help  />
            </div>
            Frequently Asked Questions
          </div>
          
          <div className="divide-y divide-app-bd">
            {FAQS.map((f, i) => (
              <div key={i} className="py-1">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between py-4 text-left transition-all hover:text-app-am"
                >
                  <span className="font-dm text-[13px] font-bold text-app-tx leading-tight pr-4">{f.q}</span>
                  <Ic.ChevDown 
                    
                  />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === i ? "max-h-40 pb-4 opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="text-[12px] leading-relaxed text-app-mu">{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Submit Ticket ── */}
        <div className="rounded-2xl border border-app-bd bg-app-card p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2.5 font-syne text-[14px] font-extrabold uppercase tracking-wider text-app-tx">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-app-am-d text-app-am">
              <Ic.Chat  />
            </div>
            Submit a Ticket
          </div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-300">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-app-ok">
                <Ic.Check  />
              </div>
              <h4 className="text-[15px] font-bold text-app-tx">Ticket Submitted!</h4>
              <p className="mt-1 text-[11px] text-app-mu">We'll respond to your issue within 24 hours.</p>
              <button 
                className="mt-6 cursor-pointer text-xs font-bold text-app-am underline underline-offset-4"
                onClick={() => { setSubmitted(false); setSubject(""); setDesc(""); }}
              >
                Send another report
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-app-mu">Subject</label>
                <input 
                  className="w-full rounded-xl border border-app-bd bg-app-card2 px-4 py-3 text-[13px] text-app-tx outline-none focus:border-app-am focus:ring-1 focus:ring-app-am/20 transition-all placeholder:text-app-mu2"
                  placeholder="What's the problem?" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)} 
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-app-mu">Description</label>
                <textarea 
                  className="w-full resize-none rounded-xl border border-app-bd bg-app-card2 px-4 py-3 text-[13px] text-app-tx outline-none focus:border-app-am focus:ring-1 focus:ring-app-am/20 transition-all placeholder:text-app-mu2"
                  rows={4} 
                  placeholder="Describe the issue in detail..." 
                  value={desc} 
                  onChange={e => setDesc(e.target.value)} 
                />
              </div>
              <button 
                className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-app-am py-3.5 text-[13px] font-bold text-white shadow-[0_4px_12px_var(--am-g)] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => subject.trim() && setSubmitted(true)} 
                disabled={!subject.trim()}
              >
                <Ic.Send  />
                Submit Ticket
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom: History ── */}
      <div className="rounded-2xl border border-app-bd bg-app-card p-6">
        <h3 className="mb-5 font-syne text-[13px] font-bold uppercase tracking-wider text-app-tx">Previous Tickets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TICKETS.map(t => (
            <div 
              key={t.id} 
              className="group flex items-center justify-between rounded-xl border border-app-bd2 bg-app-card2 p-4 transition-all hover:border-app-am-g cursor-pointer"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-app-tx group-hover:text-app-am transition-colors">{t.subject}</div>
                <div className="mt-0.5 text-[10px] font-medium text-app-mu">{t.id} • {t.date}</div>
              </div>
              <span className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_MAP[t.status as keyof typeof STATUS_MAP]}`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}