import { useState } from "react";
import type { TripStatus } from "../types";
// import { TRIPS } from "../data"; 
import { Ic } from "../icons";

export default function MyTripsPage() {
  const [tab, setTab] = useState<TripStatus>("upcoming");

  const TRIPS: any[] = []; 

  const counts = {
    upcoming: TRIPS.filter(t => t.status === "upcoming").length,
    completed: TRIPS.filter(t => t.status === "completed").length,
    missed: TRIPS.filter(t => t.status === "missed").length,
  };

  const list = TRIPS.filter(t => t.status === tab);

  const renderBadge = (s: TripStatus) => {
    const base = "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider";
    if (s === "upcoming") return <span className={`${base} bg-green-500/10 text-app-ok border-green-500/20`}>Confirmed</span>;
    if (s === "completed") return <span className={`${base} bg-blue-500/10 text-app-info border-blue-500/20`}>Completed</span>;
    return <span className={`${base} bg-red-500/10 text-app-err border-red-500/20`}>Cancelled</span>;
  };

  return (
    <div className="p-6">
      {/* Tabs System */}
      <div className="flex w-fit gap-0.5 rounded-xl border border-app-bd bg-app-card2 p-0.5 mb-5">
        {(["upcoming", "completed", "missed"] as TripStatus[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold transition-all
              ${tab === t 
                ? "bg-app-card text-app-tx border border-app-bd shadow-sm" 
                : "text-app-mu hover:text-app-tx"}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)} 
            <span className="ml-1.5 opacity-60 text-[10px]">({counts[t]})</span>
          </button>
        ))}
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-3.5">
        {list.map((t) => (
          <div key={t.id} className="group rounded-2xl border border-app-bd bg-app-card p-5 transition-all hover:border-app-am-g">
            
            {/* Card Header */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-app-mu">{t.date}</span>
              {renderBadge(t.status)}
            </div>

            {/* Route Info */}
            <div className="mb-4 flex items-center gap-1.5 font-syne text-[14px] font-bold text-app-tx">
              <Ic.Pin  />
              <span className="text-app-am">{t.from}</span>
              <span className="font-normal text-app-mu mx-1">→</span>
              <span>{t.to}</span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: "Pickup", value: t.pickup, highlight: false },
                { label: "Bus", value: t.bus, highlight: false },
                { label: "Return", value: t.returnTime, highlight: true },
              ].map((item) => (
                <div key={item.label} className="rounded-[10px] border border-app-bd2 bg-app-card2 px-3 py-2.5">
                  <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-app-mu">
                    {item.label}
                  </div>
                  <div className={`text-[12px] font-semibold ${item.highlight ? "text-app-am" : "text-app-tx"}`}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            {t.status === "upcoming" && (
              <button className="mt-3.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-red-500/15 bg-red-500/5 py-2.5 text-[11px] font-bold text-app-err transition-all hover:bg-app-err hover:text-white">
                <Ic.X  /> Cancel Booking
              </button>
            )}
            
            {t.status === "completed" && (
              <button className="mt-3.5 w-full cursor-pointer rounded-xl border border-app-bd bg-transparent py-2.5 text-[11px] font-bold text-app-mu transition-all hover:bg-app-card2 hover:text-app-tx">
                View Details
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Empty State (Optional) */}
      {list.length === 0 && (
        <div className="mt-20 flex flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-app-card2 text-app-mu2">
            <Ic.Route  />
          </div>
          <h3 className="text-sm font-bold text-app-tx">No trips found</h3>
          <p className="text-xs text-app-mu mt-1">There are no {tab} trips at the moment.</p>
        </div>
      )}
    </div>
  );
}