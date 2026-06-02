import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Page } from "../types";
import { Ic } from "../icons";
import { useNavigate } from "react-router-dom";
import Api from "../services/Api";

function statusKey(status: string): string {
  const map: Record<string, string> = {
    pending: "pending",
    assigned: "assigned",
    active: "active",
    "in-progress": "in_progress",
    in_progress: "in_progress",
    completed: "completed",
    cancelled: "cancelled",
    missed: "missed",
  };
  return map[status] ?? status;
}

export default function DashboardPage({ go }: { go?: (p: Page) => void }) {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await Api.get("/bookings/my");
        const bookingsArray = res.data?.data?.bookings || res.data?.data || res.data || [];
        setBookings(Array.isArray(bookingsArray) ? bookingsArray : []);
      } catch (err) {
        console.error("Failed to fetch dashboard bookings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const todayStr = new Date().toDateString();
  const activeTrips = bookings
    .filter(b => b.date && new Date(b.date).toDateString() === todayStr && (b.status === "pending" || b.status === "assigned"))
    .slice(0, 2);

  const stats = [
    { l: t("stat_total_demands"), v: bookings.length.toString(), icon: <Ic.Route size={18} />, c: "text-app-am", bg: "bg-app-am/10" },
    { l: t("stat_assigned"), v: bookings.filter(b => b.status === "assigned" || b.status === "active" || b.status === "in-progress" || b.status === "in_progress").length.toString(), icon: <Ic.Check size={18} />, c: "text-app-ok", bg: "bg-app-ok/10" },
    { l: t("stat_pending"), v: bookings.filter(b => b.status === "pending").length.toString(), icon: <Ic.Calendar size={18} />, c: "text-blue-400", bg: "bg-blue-500/10" },
    { l: t("stat_cancelled"), v: bookings.filter(b => b.status === "cancelled").length.toString(), icon: <Ic.X size={18} />, c: "text-red-400", bg: "bg-red-500/10" },
  ];

  const quickActions = [
    { l: t("book_new_trip"), i: <Ic.Bus size={18} />, c: "text-app-am", bg: "bg-app-am/10", border: "hover:border-app-am/40", p: "/book-trip" },
    { l: t("nav_routeDetails"), i: <Ic.Map size={18} />, c: "text-app-ok", bg: "bg-app-ok/10", border: "hover:border-app-ok/40", p: "/route-details" },
    { l: t("nav_myTrips"), i: <Ic.Calendar size={18} />, c: "text-blue-400", bg: "bg-blue-500/10", border: "hover:border-blue-500/40", p: "/my-trips" },
    { l: t("nav_notifications"), i: <Ic.Bell size={18} />, c: "text-red-400", bg: "bg-red-500/10", border: "hover:border-red-500/40", p: "/notifications" },
  ];

  const formatTimeSlot = (trip: { timeSlot?: string; specificReturnTime?: string }) => {
    if (trip.timeSlot === "Return" && trip.specificReturnTime) {
      return `${trip.specificReturnTime} ${t("dashboard_return_suffix")}`;
    }
    return trip.timeSlot || t("tba");
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-app-bg text-app-tx flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-app-bd border-t-app-am rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-app-mu animate-pulse">{t("loading_dashboard")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-app-bg text-app-tx min-h-screen animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <p className="text-[9px] text-app-mu font-black tracking-[0.3em] uppercase mb-1">{t("topbar_studentPortal")}</p>
          <h1 className="text-2xl font-black uppercase tracking-tight">{t("my_dashboard")}</h1>
        </div>
        <button
          onClick={() => navigate("/book-trip")}
          className="bg-app-am text-white dark:text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-app-am/20 flex items-center gap-2 w-fit"
        >
          <Ic.Bus size={14} /> {t("book_new_trip")}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.l} className="bg-app-card border border-app-bd rounded-2xl p-5 hover:border-app-am/40 transition-all group shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-app-mu uppercase tracking-widest">{s.l}</p>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bg} ${s.c} transition-transform group-hover:scale-110`}>
                {s.icon}
              </div>
            </div>
            <div className={`text-3xl font-black tracking-tight ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">

        <div className="space-y-6">

          {activeTrips.length > 0 ? (
            <div className="space-y-4">
              {activeTrips.map((trip) => (
                <div key={trip._id} className="bg-app-card border border-app-bd rounded-2xl overflow-hidden shadow-sm hover:border-app-am/30 transition-all">
                  <div className="flex justify-between items-center px-6 py-4 border-b border-app-bd bg-app-am/5">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                        trip.status === "assigned"
                          ? "bg-app-am/10 text-app-am border-app-am/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>
                        {t(statusKey(trip.status))}
                      </span>
                      <h2 className="text-[13px] font-black uppercase tracking-tight">
                        {trip.route?.name || t("dashboard_selected_route")}
                      </h2>
                    </div>
                    {trip.status === "assigned" && (
                      <button
                        onClick={() => navigate("/track-bus")}
                        className="hidden sm:flex items-center gap-2 bg-app-bg border border-app-bd px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-app-mu hover:text-app-tx hover:border-app-am transition-all"
                      >
                        <Ic.Target size={12} /> {t("track_live")}
                      </button>
                    )}
                  </div>

                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: t("date"), value: trip.date ? new Date(trip.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : t("tba") },
                      { label: t("dashboard_time_slot"), value: formatTimeSlot(trip), highlight: true },
                      { label: t("status"), value: t(statusKey(trip.status || "pending")) },
                      { label: t("route"), value: trip.route?.name || t("tba") },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="block text-[9px] text-app-mu font-black uppercase tracking-widest">{item.label}</label>
                        <p className={`text-[13px] font-black uppercase ${item.highlight ? "text-app-am" : "text-app-tx"}`}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-app-card border border-dashed border-app-bd rounded-2xl p-10 text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-app-bg rounded-full flex items-center justify-center mb-4 text-app-mu opacity-40">
                <Ic.Bus size={28} />
              </div>
              <h3 className="text-[12px] font-black uppercase tracking-widest text-app-tx mb-2">{t("no_active_trips")}</h3>
              <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest max-w-xs leading-relaxed">
                {t("no_active_trips_hint_seat")}
              </p>
            </div>
          )}

          <div className="bg-app-card border border-app-bd rounded-2xl overflow-hidden shadow-sm">
            <div className="flex justify-between items-center px-6 py-4 border-b border-app-bd">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-app-tx flex items-center gap-2">
                <span className="text-app-am"><Ic.Calendar size={14} /></span> {t("recent_bookings")}
              </h3>
              <button
                onClick={() => navigate("/my-trips")}
                className="text-[10px] text-app-am font-black uppercase tracking-widest hover:underline"
              >
                {t("dashboard_view_all")}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-app-bd bg-app-bg/50">
                    {[t("route"), t("dashboard_table_time_date"), t("dashboard_table_seat"), t("status")].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-app-mu uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-bd">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-[10px] font-black text-app-mu uppercase tracking-widest">
                        {t("no_bookings_yet")}
                      </td>
                    </tr>
                  ) : (
                    bookings.slice(0, 4).map((b) => (
                      <tr key={b._id} className="hover:bg-app-card2/40 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-2 text-[12px] font-bold text-app-tx">
                            <span className="text-app-am"><Ic.Route size={14} /></span>
                            {b.route?.name || t("unknown_route")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[11px] text-app-mu font-medium uppercase">
                          {formatTimeSlot(b)}
                          {b.date ? ` • ${new Date(b.date).toLocaleDateString("en-GB")}` : ""}
                        </td>
                        <td className="px-6 py-4 text-[12px] font-black text-app-tx">
                          —
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            b.status === "active" || b.status === "in-progress" || b.status === "in_progress" ? "bg-app-ok/10 text-app-ok border-app-ok/20" :
                            b.status === "assigned"   ? "bg-app-am/10 text-app-am border-app-am/20" :
                            b.status === "pending"    ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                            b.status === "cancelled"  ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                                        "bg-app-bd text-app-mu border-app-bd"
                          }`}>
                            {t(statusKey(b.status))}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">

          <div className="bg-app-card border border-app-bd rounded-2xl p-5 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-app-mu mb-4 pb-3 border-b border-app-bd">
              {t("quick_actions")}
            </h3>
            <div className="space-y-2">
              {quickActions.map((act) => (
                <button
                  key={act.l}
                  onClick={() => navigate(act.p)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border border-app-bd bg-app-bg transition-all group ${act.border}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${act.bg} ${act.c}`}>
                    {act.i}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-app-tx group-hover:text-app-am transition-colors">
                    {act.l}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-app-card border border-app-bd rounded-2xl p-5 shadow-sm hover:border-app-am/30 transition-all">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-app-bd">
              <div className="w-8 h-8 rounded-lg bg-app-am/10 flex items-center justify-center text-app-am shrink-0">
                <Ic.Shield size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-app-mu">{t("system_status")}</p>
                <p className="text-[11px] font-black uppercase text-app-tx">{t("all_operations_normal")}</p>
              </div>
              <span className="ml-auto w-2 h-2 rounded-full bg-app-ok animate-pulse shrink-0" />
            </div>
            <p className="text-[10px] text-app-mu font-medium leading-relaxed">
              {t("dashboard_deadline_note", { time: "1:00 PM" })}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
