import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { TripStatus } from "../types";
import { Ic } from "../icons";
import Api from "../services/Api";
import socket from "../services/socket";

const TAB_KEYS: Record<TripStatus, string> = {
  upcoming: "tab_upcoming",
  completed: "tab_completed",
  missed: "tab_missed",
  cancelled: "tab_cancelled",
};

export default function MyTripsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TripStatus>("upcoming");
  const [filterDate, setFilterDate] = useState<string>("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit modal
  const [editModal, setEditModal] = useState<{ open: boolean; booking: any | null }>({ open: false, booking: null });
  const [editRouteId, setEditRouteId] = useState("");
  const [editTimeSlot, setEditTimeSlot] = useState("");
  const [editReturnTime, setEditReturnTime] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [attendanceLoading, setAttendanceLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [bRes, rRes, sRes] = await Promise.all([
        Api.get("/bookings/my"),
        Api.get("/routes"),
        Api.get("/settings"),
      ]);

      console.log("🔥 RAW BOOKINGS RESPONSE:", bRes.data);

      // هنا إحنا بنصطاد الداتا من أي مكان الباك إند بيبعتها فيه
      let fetchedBookings = bRes.data?.data?.bookings || 
                            bRes.data?.bookings || 
                            bRes.data?.data || 
                            bRes.data || [];
                            
      // تأكيد إنها Array عشان الكود ميضربش
      if (!Array.isArray(fetchedBookings)) {
        fetchedBookings = [];
      }

      setBookings(fetchedBookings);
      setRoutes(rRes.data?.data || []);
      
      const s = sRes.data?.data?.settings || sRes.data?.settings;
      if (s) setSettings(s);
      
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Live socket: update booking status instantly when admin dispatches ──
  useEffect(() => {
    const handleBusAssigned = (payload: any) => {
      if (!payload?.bookingIds || !payload?.busDetails) return;
      setBookings(prev =>
        prev.map(b =>
          payload.bookingIds.includes(b._id)
            ? { ...b, status: "assigned", busId: payload.busDetails }
            : b
        )
      );
    };

    socket.on("bookingAssigned", handleBusAssigned);
    return () => { socket.off("bookingAssigned", handleBusAssigned); };
  }, []);

  const isWindowOpen = () => {
    if (!settings) return false;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const open  = settings.booking_open_hour  * 60 + settings.booking_open_minute;
    const close = settings.booking_close_hour * 60 + settings.booking_close_minute;
    return cur >= open && cur <= close;
  };

  const parseTimeToMinutes = (t: string): number => {
    if (!t) return 0;
    const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!m) return 0;
    let h = parseInt(m[1]);
    const min = parseInt(m[2]);
    if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
    if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
    return h * 60 + min;
  };

  const isAttendanceUnlocked = (b: any): boolean => {
    if (!settings) return false;
    const bd = new Date(b.date);
    const today = new Date();
    if (bd.toDateString() !== today.toDateString()) return false;
    const nowM = today.getHours() * 60 + today.getMinutes();
    if (b.timeSlot === "Morning") return nowM >= parseTimeToMinutes(settings.morningStartTime || "08:30 AM");
    return nowM >= parseTimeToMinutes(b.specificReturnTime || "");
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm(t("confirm_cancel_booking"))) return;
    try {
      await Api.put(`/bookings/${id}/cancel`);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || t("failed_cancel"));
    }
  };

  const handleAttendance = async (id: string, status: "completed" | "missed") => {
    setAttendanceLoading(id);
    try {
      await Api.patch(`/bookings/${id}/attendance`, { attendanceStatus: status });
      setBookings(prev =>
        prev.map(b => b._id === id
          ? { ...b, attendanceStatus: status, status, attended: status === "completed" }
          : b
        )
      );
      setToast({ message: t("trip_marked", { status: t(status) }), type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.message || t("failed_mark_attendance");
      setToast({ message: msg, type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setAttendanceLoading(null);
    }
  };

  const openEdit = (booking: any) => {
    setEditModal({ open: true, booking });
    setEditRouteId(booking.route?._id || "");
    setEditTimeSlot(booking.timeSlot || "");
    setEditReturnTime(booking.specificReturnTime || "");
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editModal.booking) return;
    setEditSaving(true);
    setEditError("");
    try {
      const payload: any = { routeId: editRouteId, timeSlot: editTimeSlot };
      if (editTimeSlot === "Return") payload.specificReturnTime = editReturnTime;
      await Api.patch(`/bookings/${editModal.booking._id}`, payload);
      setEditModal({ open: false, booking: null });
      fetchAll();
    } catch (err: any) {
      setEditError(err.response?.data?.message || t("failed_update"));
    } finally {
      setEditSaving(false);
    }
  };

  const mappedTrips = bookings.map((b) => {
    const bd = b.date ? new Date(b.date) : null;
    
    // Default to upcoming
    let currentStatus: TripStatus = "upcoming";
    
    // Explicit overrides based strictly on backend status
    if (b.status === "completed" || b.attendanceStatus === "completed") {
      currentStatus = "completed";
    } else if (b.status === "missed" || b.attendanceStatus === "missed") {
      currentStatus = "missed";
    } else if (b.status === "cancelled" || b.status === "cancelled_by_admin") {
      currentStatus = "cancelled";
    } else if (["pending", "booked", "assigned", "active", "in-progress"].includes(b.status)) {
      currentStatus = "upcoming";
    }

    return { 
      raw: b, 
      id: b._id, 
      status: currentStatus, 
      date: bd ? bd.toDateString() : t("tba"),
      from: b.route?.name || t("route"), 
      timeSlot: b.timeSlot, 
      returnTime: b.timeSlot === "Return" ? (b.specificReturnTime || t("tba")) : "N/A",
      bookingStatus: b.status, 
      attendanceStatus: b.attendanceStatus 
    };
  });

  const dateFilteredTrips = mappedTrips.filter(t => {
    if (!filterDate) return true;
    return t.raw.date && new Date(t.raw.date).toISOString().split('T')[0] === filterDate;
  });

  const counts = {
    upcoming:  dateFilteredTrips.filter(t => t.status === "upcoming").length,
    completed: dateFilteredTrips.filter(t => t.status === "completed").length,
    missed:    dateFilteredTrips.filter(t => t.status === "missed").length,
    cancelled: dateFilteredTrips.filter(t => t.status === "cancelled").length,
  };

  const list = dateFilteredTrips.filter(t => t.status === tab);

  const renderBadge = (s: string) => {
    const base = "inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider";
    if (s === "pending" || s === "booked") return <span className={`${base} bg-blue-500/10 text-blue-400 border-blue-500/20`}>⏳ {t(s === "booked" ? "booked" : "pending")}</span>;
    if (s === "assigned")  return <span className={`${base} bg-app-am/10 text-app-am border-app-am/20`}>🚌 {t("bus_assigned")}</span>;
    if (s === "active")    return <span className={`${base} bg-app-ok/10 text-app-ok border-app-ok/20`}>✓ {t("badge_active")}</span>;
    if (s === "completed") return <span className={`${base} bg-app-ok/10 text-app-ok border-app-ok/20`}>✓ {t("badge_done")}</span>;
    if (s === "missed")    return <span className={`${base} bg-red-500/10 text-red-400 border-red-500/20`}>✗ {t("missed")}</span>;
    return <span className={`${base} bg-neutral-500/10 text-neutral-400 border-neutral-500/20`}>{t("cancelled")}</span>;
  };

  if (isLoading) return (
    <div className="p-6 flex justify-center items-center h-64 text-app-mu font-syne font-bold animate-pulse">
      {t("loading_trips")}
    </div>
  );

  return (
    <div className="p-6 animate-in fade-in duration-500 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`px-5 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-md
            ${toast.type === "success" ? "bg-app-ok/20 border-app-ok/30 text-app-ok" : "bg-red-500/20 border-red-500/30 text-red-400"}`}>
            {toast.type === "success" ? <Ic.Check size={18} /> : <Ic.X size={18} />}
            <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Filters & Tab Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        {/* Tab Bar */}
        <div className="flex w-fit gap-0.5 rounded-xl border border-app-bd bg-app-card2 p-0.5 shadow-inner">
          {(["upcoming", "completed", "missed", "cancelled"] as TripStatus[]).map((tabKey) => (
            <button key={tabKey} onClick={() => setTab(tabKey)}
              className={`cursor-pointer rounded-lg px-5 py-2 text-xs font-bold transition-all
                ${tab === tabKey ? "bg-app-card text-app-am border border-app-bd shadow-sm" : "text-app-mu hover:text-app-tx"}`}>
              {t(TAB_KEYS[tabKey])}
              <span className="ml-1.5 opacity-40 text-[10px]">({counts[tabKey]})</span>
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-app-card2 border border-app-bd rounded-xl px-4 py-2 text-xs text-app-tx outline-none focus:border-app-am transition-all cursor-pointer"
          />
          {filterDate && (
            <button 
              onClick={() => setFilterDate("")}
              className="p-2 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
              title={t("clear_filter", "Clear")}
            >
              <Ic.X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-5">
        {list.map((trip) => {
          const unlocked = isAttendanceUnlocked(trip.raw);
          const alreadyMarked = trip.attendanceStatus === "completed" || trip.attendanceStatus === "missed";
          const windowOpen = isWindowOpen();

          return (
            <div key={trip.id} className={`group rounded-2xl border bg-app-card p-6 transition-all hover:shadow-xl
              ${trip.status === "completed" ? "border-blue-500/20 hover:border-blue-500/40" :
                trip.status === "missed"    ? "border-red-500/20 hover:border-red-500/40" :
                trip.status === "cancelled" ? "border-neutral-500/20 hover:border-neutral-500/40 opacity-75" :
                "border-app-bd hover:border-app-am/30"}`}>

              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-app-mu2 flex items-center gap-1.5 uppercase tracking-tighter">
                  <Ic.Calendar size={12} /> {trip.date}
                </span>
                {renderBadge(trip.bookingStatus)}
              </div>

              <div className="mb-5 flex items-center gap-2 font-syne text-[15px] font-black text-app-tx">
                <span className="text-app-am"><Ic.Pin size={16} /></span>
                <span className="truncate">{trip.from}</span>
                <span className="font-normal text-app-mu mx-1 opacity-30">→</span>
                <span>{t("campus")}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="rounded-xl border border-app-bd bg-app-card2/50 px-3 py-3 shadow-inner">
                  <div className="mb-1 text-[8px] font-black uppercase tracking-widest text-app-mu">{t("slot")}</div>
                  <div className="text-[11px] font-bold text-app-tx">{trip.timeSlot}</div>
                </div>
                <div className="rounded-xl border border-app-bd bg-app-card2/50 px-3 py-3 shadow-inner">
                  <div className="mb-1 text-[8px] font-black uppercase tracking-widest text-app-mu">{t("return")}</div>
                  <div className={`text-[11px] font-bold ${trip.timeSlot === "Return" ? "text-app-am" : "text-app-mu2"}`}>{trip.returnTime}</div>
                </div>
              </div>

              {trip.status === "upcoming" && (
                <div className="space-y-2">

                  {alreadyMarked ? (
                    <div className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest border
                      ${trip.attendanceStatus === "completed" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                      {trip.attendanceStatus === "completed" ? <><Ic.Check size={12} /> {t("trip_completed_label")}</> : <><Ic.X size={12} /> {t("marked_as_missed")}</>}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleAttendance(trip.id, "completed")} disabled={!unlocked || attendanceLoading === trip.id}
                        title={!unlocked ? t("unlock_after_start") : ""}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-green-500/20 bg-green-500/10 py-2.5 text-[10px] font-black text-app-ok transition-all hover:bg-green-500 hover:text-white uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed">
                        <Ic.Check size={12} /> {attendanceLoading === trip.id ? t("saving") : t("btn_completed")}
                      </button>
                      <button onClick={() => handleAttendance(trip.id, "missed")} disabled={!unlocked || attendanceLoading === trip.id}
                        title={!unlocked ? t("unlock_after_start") : ""}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 py-2.5 text-[10px] font-black text-yellow-400 transition-all hover:bg-yellow-500 hover:text-white uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed">
                        <Ic.X size={12} /> {attendanceLoading === trip.id ? t("saving") : t("missed")}
                      </button>
                    </div>
                  )}

                  {["pending", "booked"].includes(trip.bookingStatus) ? (
                    <div className="flex gap-2">
                      <button onClick={() => windowOpen && openEdit(trip.raw)} disabled={!windowOpen}
                        title={!windowOpen ? t("only_during_window") : t("edit_booking_title")}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-app-am/20 bg-app-am/10 py-2.5 text-[10px] font-black text-app-am transition-all hover:bg-app-am hover:text-black uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed">
                        ✎ {t("edit")}
                      </button>
                      <button onClick={() => handleCancel(trip.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 py-2.5 text-[10px] font-black text-app-err transition-all hover:bg-red-500 hover:text-white uppercase tracking-widest">
                        <Ic.X size={12} /> {t("cancel")}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest border border-app-bd/50 bg-app-card2/30 text-app-mu">
                      <Ic.Info size={12} /> Edit disabled (Bus Assigned)
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {list.length === 0 && (
        <div className="mt-24 flex flex-col items-center text-center opacity-40">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-app-card2 text-app-mu shadow-inner">
            <Ic.Route size={32} />
          </div>
          <h3 className="font-syne text-lg font-bold text-app-tx uppercase tracking-tight">{t("no_trips_in_tab", { tab: t(TAB_KEYS[tab]) })}</h3>
          <p className="text-xs text-app-mu mt-1">{t("no_bookings_in_category")}</p>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-app-card border border-app-bd rounded-2xl p-7 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-syne text-base font-black text-app-tx uppercase tracking-tight">{t("edit_booking")}</h3>
              <button onClick={() => setEditModal({ open: false, booking: null })} className="text-app-mu hover:text-app-tx">
                <Ic.X size={18} />
              </button>
            </div>

            {editError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-app-mu mb-2">{t("route")}</label>
                <select className="custom-select" value={editRouteId} onChange={e => setEditRouteId(e.target.value)}
                  className="w-full bg-app-card2 border border-app-bd rounded-xl px-4 py-3 text-sm text-app-tx outline-none focus:border-app-am appearance-none cursor-pointer">
                  <option value="">{t("select_route_placeholder")}</option>
                  {routes.map((r: any) => <option key={r._id} value={r._id} className="bg-app-card">{r.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-app-mu mb-2">{t("select_time_slot")}</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["Morning", "Return"] as const).map(slot => (
                    <button key={slot} onClick={() => { setEditTimeSlot(slot); if (slot === "Morning") setEditReturnTime(""); }}
                      className={`py-3 rounded-xl font-bold text-sm border transition-all
                        ${editTimeSlot === slot ? "bg-app-am/10 border-app-am text-app-am" : "bg-app-card2 border-app-bd text-app-mu hover:border-app-am/50"}`}>
                      {slot === "Morning" ? t("morning") : t("return")}
                    </button>
                  ))}
                </div>
              </div>

              {editTimeSlot === "Return" && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-[10px] font-bold uppercase text-app-mu mb-2">{t("return_time")}</label>
                  <select className="custom-select" value={editReturnTime} onChange={e => setEditReturnTime(e.target.value)}
                    className="w-full bg-app-card2 border border-app-bd rounded-xl px-4 py-3 text-sm text-app-tx outline-none focus:border-app-am appearance-none cursor-pointer">
                    <option value="">{t("choose_time_placeholder")}</option>
                    {(settings?.returnTimeOptions || []).map((rt: string) => (
                      <option key={rt} value={rt} className="bg-app-card">{rt}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditModal({ open: false, booking: null })}
                className="flex-1 py-3 rounded-xl border border-app-bd text-app-mu text-[11px] font-black uppercase tracking-widest hover:text-app-tx transition-all">
                {t("cancel")}
              </button>
              <button onClick={handleEditSave}
                disabled={editSaving || !editRouteId || !editTimeSlot || (editTimeSlot === "Return" && !editReturnTime)}
                className="flex-1 py-3 rounded-xl bg-app-am text-black text-[11px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {editSaving ? t("saving") : t("save_changes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}