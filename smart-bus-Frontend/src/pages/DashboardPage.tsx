import React, { useState, useEffect } from "react";
import type { Page } from "../types";
import { Ic } from "../icons";
import { useNavigate } from "react-router-dom";
import Api from "../services/Api";

export default function DashboardPage({ go }: { go?: (p: Page) => void }) {
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await Api.get("/trips");
        setTrips(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch dashboard trips:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const nextTrip = trips.length > 0 ? trips[0] : null;

  const stats = [
    {
      l: "Total Trips",
      v: trips.length.toString(),
      c: "text-app-am",
      bg: "bg-app-am-d",
      icon: <Ic.Bus />,
    },
    {
      l: "Active Now",
      v: trips.filter((t) => t.status === "active").length.toString(),
      c: "text-app-ok",
      bg: "bg-green-500/10",
      icon: <Ic.Bus />,
    },
    {
      l: "Upcoming",
      v: trips.filter((t) => t.status === "scheduled").length.toString(),
      c: "text-app-info",
      bg: "bg-blue-500/10",
      icon: <Ic.Bus />,
    },
    {
      l: "Booked Seats",
      v: nextTrip?.booked_seats?.toString() || "0",
      c: "text-app-err",
      bg: "bg-red-500/10",
      icon: <Ic.Bus />,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-app-mu font-syne animate-pulse">
        Initializing Command Center...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Stat cards (Dynamic) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.l}
            className="group rounded-2xl border border-app-bd bg-app-card p-4 transition-all hover:border-app-am-g"
          >
            <div
              className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg ${s.bg} ${s.c}`}
            >
              {s.icon}
            </div>
            <div className="font-syne text-2xl font-extrabold leading-none text-app-tx group-hover:text-app-am transition-colors">
              {s.v}
            </div>
            <div className="mt-1 text-[11px] font-medium text-app-mu">
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* ── Hero: Next Trip (Dynamic) ── */}
      {nextTrip ? (
        <div className="relative overflow-hidden rounded-2xl border border-app-bd bg-app-card p-5 lg:p-6 shadow-xl">
          <div className="pointer-events-none absolute -top-10 -right-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,var(--am-g),transparent_70%)] opacity-50" />

          <div className="mb-4 text-[10px] font-bold uppercase tracking-wider text-app-mu">
            Next Deployment
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2 font-syne text-lg font-extrabold text-app-tx">
            <Ic.Pin />
            <span className="text-app-am">
              {nextTrip.route?.name || "Route"}
            </span>
            <span className="font-normal text-app-mu mx-1">→</span>
            <span>University Station</span>
            <span
              className={`ml-auto inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                nextTrip.status === "active"
                  ? "border-app-ok/20 bg-app-ok/10 text-app-ok"
                  : "border-app-am/20 bg-app-am/10 text-app-am"
              }`}
            >
              {nextTrip.status}
            </span>
          </div>

          <div className="mb-5 grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              {
                l: "Date",
                v: new Date(nextTrip.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                }),
                a: false,
              },
              
              { 
                l: "Time Slot", 
                v: nextTrip.time_slot?.replace('_', ' ') || "N/A", 
                a: false 
              },

              {
                l: "Bus Capacity",
                v: `${nextTrip.booked_seats}/${nextTrip.total_seats}`,
                a: false,
              },
              {
                l: "Last Seen",
                v: nextTrip.status === "active" ? "Live Now" : "Scheduled",
                a: true,
              },
            ].map((item) => (
              <div
                key={item.l}
                className="rounded-xl border border-app-bd2 bg-app-card2 px-3 py-2.5"
              >
                <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-app-mu">
                  {item.l}
                </div>
                <div
                  className={`text-xs font-semibold uppercase ${item.a ? "text-app-am" : "text-app-tx"}`}
                >
                  {item.v}
                </div>
              </div>
            ))}
          </div>

          <button
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-app-am py-3 text-[13px] font-bold text-white shadow-[0_4px_14px_var(--am-g)] transition-all hover:brightness-110 active:scale-[0.98]"
            onClick={() => navigate("/track-bus")}
          >
            <Ic.Target /> Initiate Live Tracking
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-app-bd bg-app-card/50 p-12 text-center">
          <p className="text-app-mu font-syne font-bold">
            No active missions found. Ready for your first booking?
          </p>
          <button
            onClick={() => go?.("bookTrip")}
            className="mt-4 text-app-am text-xs font-black uppercase underline"
          >
            Book Now ↗
          </button>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          {
            l: "Book Trip",
            s: "Reserve Seat",
            c: "text-app-am",
            bg: "bg-app-am-d",
            p: "bookTrip",
          },
          {
            l: "My History",
            s: "Past Routes",
            c: "text-app-info",
            bg: "bg-blue-500/10",
            p: "myTrips",
          },
          {
            l: "Live Alerts",
            s: "System Up",
            c: "text-app-err",
            bg: "bg-red-500/10",
            p: "notifications",
          },
          {
            l: "Fleet Map",
            s: "Full View",
            c: "text-app-ok",
            bg: "bg-green-500/10",
            p: "routeDetails",
          },
        ].map((act) => (
          <div
            key={act.l}
            className="group cursor-pointer rounded-2xl border border-app-bd bg-app-card p-4 transition-all hover:border-app-am-g"
            onClick={() => go?.(act.p as Page)}
          >
            <div
              className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${act.bg} ${act.c}`}
            >
              <Ic.Bus />
            </div>
            <div className="font-syne text-xs font-bold text-app-tx group-hover:text-app-am transition-colors uppercase">
              {act.l}
            </div>
            <div className="mt-0.5 text-[10px] text-app-mu font-medium">
              {act.s}
            </div>
          </div>
        ))}
      </div>

      {/* ── Upcoming List (Dynamic) ── */}
      <div className="space-y-3.5 pb-10">
        <div className="flex items-center justify-between">
          <h3 className="font-syne text-[11px] font-black text-app-tx uppercase tracking-[0.2em]">
            Operational Queue
          </h3>
          <button
            className="cursor-pointer text-[10px] font-black text-app-am transition-opacity hover:opacity-80 uppercase tracking-tighter"
            onClick={() => go?.("myTrips")}
          >
            Analysis All →
          </button>
        </div>

        <div className="space-y-2.5">
          {trips.slice(0, 3).map((t) => (
            <div
              key={t._id}
              className="flex items-center justify-between rounded-2xl border border-app-bd bg-app-card p-4 transition-all hover:border-app-am-g"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-am-d text-app-am border border-app-am/10">
                  <Ic.Bus />
                </div>
                <div>
                  <div className="font-syne text-[13px] font-bold text-app-tx uppercase">
                    {t.route?.name}{" "}
                    <span className="mx-1 text-app-mu font-normal opacity-50">
                      /
                    </span>{" "}
                    {t.time_slot}
                  </div>
                  <div className="mt-0.5 text-[10px] text-app-mu font-bold uppercase tracking-tight">
                    {new Date(t.date).toDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter ${
                    t.status === "active"
                      ? "bg-app-ok/10 text-app-ok"
                      : "bg-app-mu/10 text-app-mu"
                  }`}
                >
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
