import React, { useState, useEffect } from 'react';
import { Ic } from '../icons';
import Api from '../services/Api';

interface AttendanceData {
  present: number;
  absent: number;
  pending: number;
  total: number;
  presentPct: number;
  absentPct: number;
  pendingPct: number;
}

interface Booking {
  _id: string;
  user: { name: string; email: string };
  trip: { _id: string; time_slot: string; route?: { name: string }; date: string };
  seat_number: number;
  attended: boolean;
  status: string;
}

interface DashboardData {
  totalUsers: number;
  totalTrips: number;
  activeTrips: number;
  totalBookings: number;
  utilizationRate: number;
  recentActivity: any[];
}

interface TripInfo {
  _id: string;
  date: string;
  time_slot: string;
  route?: { name: string };
  bus_number?: string;
  total_seats: number;
  booked_seats: number;
}

const timeSlotLabel = (slot: string) => {
  const map: Record<string, string> = {
    morning: "Morning",
    return_1530: "3:30 PM",
    return_1900: "7:00 PM",
  };
  return map[slot] || slot;
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Calendar Component ──────────────────────────────────────────────────────
interface CalendarPickerProps {
  tripDates: Set<string>;          // "YYYY-MM-DD" strings that have trips
  tripDateStats: Record<string, { present: number; absent: number; pending: number }>;
  selectedDate: string;            // "YYYY-MM-DD" or "all"
  onSelect: (date: string) => void;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  tripDates,
  tripDateStats,
  selectedDate,
  onSelect,
}) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const toKey = (d: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const isToday = (d: number) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  return (
    <div className="bg-app-card2 rounded-2xl border border-app-bd p-4 w-full max-w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-7 h-7 rounded-lg bg-app-card border border-app-bd flex items-center justify-center text-app-mu hover:text-app-tx hover:border-app-am/30 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="text-[12px] font-black uppercase tracking-widest text-app-tx">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 rounded-lg bg-app-card border border-app-bd flex items-center justify-center text-app-mu hover:text-app-tx hover:border-app-am/30 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-app-mu py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const key = toKey(day);
          const hasTrip = tripDates.has(key);
          const stats = tripDateStats[key];
          const isSelected = selectedDate === key;
          const _isToday = isToday(day);

          return (
            <button
              key={day}
              disabled={!hasTrip}
              onClick={() => onSelect(isSelected ? "all" : key)}
              className={`
                relative aspect-square rounded-xl flex flex-col items-center justify-center text-[11px] font-bold transition-all
                ${!hasTrip ? "text-app-mu2 cursor-default opacity-30" : "cursor-pointer"}
                ${isSelected
                  ? "bg-app-am text-white border border-app-am shadow-lg shadow-app-am/20"
                  : hasTrip
                    ? "bg-app-card border border-app-bd hover:border-app-am/40 text-app-tx"
                    : ""}
                ${_isToday && !isSelected ? "ring-1 ring-app-am/50 ring-offset-1 ring-offset-app-card2" : ""}
              `}
            >
              <span>{day}</span>
              {/* Status dots */}
              {hasTrip && stats && (
                <div className="flex gap-[2px] mt-[2px]">
                  {stats.present > 0 && (
                    <span className={`w-[4px] h-[4px] rounded-full ${isSelected ? "bg-white/70" : "bg-app-ok"}`} />
                  )}
                  {stats.absent > 0 && (
                    <span className={`w-[4px] h-[4px] rounded-full ${isSelected ? "bg-white/70" : "bg-app-err"}`} />
                  )}
                  {stats.pending > 0 && (
                    <span className={`w-[4px] h-[4px] rounded-full ${isSelected ? "bg-white/70" : "bg-app-am"}`} />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-app-bd flex-wrap">
        {[
          { color: "bg-app-ok", label: "Present" },
          { color: "bg-app-err", label: "Absent" },
          { color: "bg-app-am", label: "Pending" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <span className={`w-[5px] h-[5px] rounded-full ${l.color}`} />
            <span className="text-[9px] font-bold text-app-mu uppercase tracking-wide">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const AdminReport: React.FC = () => {
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allTrips, setAllTrips] = useState<TripInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedTripId, setSelectedTripId] = useState<string>("all");
  const [filter, setFilter] = useState<"all" | "present" | "absent" | "pending">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [closingTrip, setClosingTrip] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const fetchAll = async () => {
    try {
      const [dashRes, statsRes, bookingsRes, tripsRes] = await Promise.all([
        Api.get('/reports/dashboard-stats'),
        Api.get("/bookings/stats"),
        Api.get("/bookings"),
        Api.get("/trips"),
      ]);
      setDashData(dashRes.data);
      setAttendance(statsRes.data.data.attendance);
      setAllBookings(bookingsRes.data.data?.bookings || []);
      setAllTrips(tripsRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCloseTrip = async (tripId: string) => {
    if (!window.confirm("End this trip? All pending students will be marked absent.")) return;
    setClosingTrip(tripId);
    try {
      await Api.patch(`/bookings/trip/${tripId}/close`);
      await fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to close trip");
    } finally {
      setClosingTrip(null);
    }
  };

  // ── Build calendar data ────────────────────────────────────────────────────
  // Set of all dates that have at least one trip
  const tripDates = new Set(
    allTrips.map(t => t.date.slice(0, 10))
  );

  // Per-date attendance stats (from bookings)
  const tripDateStats: Record<string, { present: number; absent: number; pending: number }> = {};
  allBookings.forEach(b => {
    if (b.status === "cancelled") return;
    const key = b.trip?.date?.slice(0, 10);
    if (!key) return;
    if (!tripDateStats[key]) tripDateStats[key] = { present: 0, absent: 0, pending: 0 };
    if (b.attended) tripDateStats[key].present++;
    else if (b.status === "missed") tripDateStats[key].absent++;
    else tripDateStats[key].pending++;
  });

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTripId("all");
    setFilter("all");
    if (date !== "all") setShowCalendar(false);
  };

  const tripsForDate = selectedDate === "all"
    ? allTrips
    : allTrips.filter(t => t.date.slice(0, 10) === selectedDate);

  const bookingsForSelection = allBookings.filter(b => {
    if (b.status === "cancelled") return false;
    if (selectedDate !== "all" && b.trip?.date?.slice(0, 10) !== selectedDate) return false;
    if (selectedTripId !== "all" && b.trip?._id !== selectedTripId) return false;
    return true;
  });

  const filteredBookings = bookingsForSelection.filter(b => {
    if (filter === "present") return b.attended === true;
    if (filter === "absent") return b.status === "missed";
    if (filter === "pending") return !b.attended && b.status !== "missed";
    return true;
  });

  const selectedTrip = allTrips.find(t => t._id === selectedTripId);
  const pendingCount = bookingsForSelection.filter(
    b => !b.attended && b.status !== "missed" && b.status !== "cancelled"
  ).length;

  // Format selected date for display
  const selectedDateLabel = selectedDate === "all"
    ? "All Dates"
    : new Date(selectedDate + "T12:00:00").toLocaleDateString("en", {
        weekday: "short", month: "short", day: "numeric", year: "numeric"
      });

  if (isLoading || !dashData) {
    return (
      <div className="flex-1 bg-app-bg text-app-tx p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-app-bd border-t-app-am rounded-full animate-spin" />
          <div className="animate-pulse text-app-mu font-black uppercase tracking-widest text-[10px]">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Students", value: dashData.totalUsers,       icon: <Ic.Users />,  color: "text-app-am",  bg: "bg-app-am/10",      pct: 100 },
          { title: "Total Present",  value: attendance?.present ?? 0,  icon: <Ic.Check />,  color: "text-app-ok",  bg: "bg-green-500/10",   pct: attendance?.presentPct ?? 0 },
          { title: "Total Absent",   value: attendance?.absent ?? 0,   icon: <Ic.X />,      color: "text-app-err", bg: "bg-red-500/10",     pct: attendance?.absentPct ?? 0 },
          { title: "Pending",        value: attendance?.pending ?? 0,  icon: <Ic.Clock />,  color: "text-app-mu",  bg: "bg-app-card2",      pct: attendance?.pendingPct ?? 0 },
        ].map((s, i) => (
          <div key={i} className="bg-app-card rounded-2xl p-5 border border-app-bd hover:border-app-am/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-app-mu">{s.title}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>{s.icon}</div>
            </div>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="mt-2 h-1 w-full bg-app-card2 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${
                i === 1 ? "bg-app-ok" : i === 2 ? "bg-app-err" : i === 3 ? "bg-app-mu" : "bg-app-am"
              }`} style={{ width: `${s.pct}%` }} />
            </div>
            <div className="mt-1 text-[9px] font-bold text-app-mu2">{s.pct}%</div>
          </div>
        ))}
      </div>

      {/* ── Main Panel ── */}
      <div className="bg-app-card rounded-2xl border border-app-bd overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-app-bd">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
            <div>
              <h2 className="font-syne text-[15px] font-black uppercase tracking-wider text-app-tx">
                Attendance Management
              </h2>
              <p className="text-[10px] text-app-mu font-bold mt-0.5">
                {bookingsForSelection.length} students · {bookingsForSelection.filter(b => b.attended).length} present · {bookingsForSelection.filter(b => b.status === "missed").length} absent · {pendingCount} pending
              </p>
            </div>

            {selectedTripId !== "all" && pendingCount > 0 && (
              <button
                onClick={() => handleCloseTrip(selectedTripId)}
                disabled={closingTrip === selectedTripId}
                className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
              >
                {closingTrip === selectedTripId ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Ic.X size={13} />
                )}
                End Trip · Mark {pendingCount} as Absent
              </button>
            )}

            {selectedTripId !== "all" && pendingCount === 0 && bookingsForSelection.length > 0 && (
              <div className="flex items-center gap-2 bg-green-500/10 text-app-ok px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest border border-green-500/20">
                <Ic.Check size={13} /> Trip Closed
              </div>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3 mb-4 items-end">

            {/* ── Calendar Date Picker ── */}
            <div className="flex flex-col gap-1 relative">
              <span className="text-[9px] font-black uppercase tracking-widest text-app-mu">Date</span>

              {/* Trigger button */}
              <button
                onClick={() => setShowCalendar(v => !v)}
                className={`flex items-center gap-2 bg-app-card2 border rounded-xl px-3 py-2 text-[12px] font-bold outline-none transition-all min-w-[180px] ${
                  showCalendar ? "border-app-am text-app-tx" : "border-app-bd text-app-tx hover:border-app-am/40"
                }`}
              >
                <Ic.Calendar size={13} className="text-app-mu shrink-0" />
                <span className="flex-1 text-left truncate">{selectedDateLabel}</span>
                {selectedDate !== "all" && (
                  <span
                    onClick={e => { e.stopPropagation(); handleDateSelect("all"); }}
                    className="text-app-mu hover:text-app-err transition-colors cursor-pointer"
                  >
                    <Ic.X size={11} />
                  </span>
                )}
                <Ic.ChevronDown size={11} className={`text-app-mu transition-transform ${showCalendar ? "rotate-180" : ""}`} />
              </button>

              {/* Calendar dropdown */}
              {showCalendar && (
                <div className="absolute top-full left-0 mt-2 z-50 shadow-xl shadow-black/20">
                  <CalendarPicker
                    tripDates={tripDates}
                    tripDateStats={tripDateStats}
                    selectedDate={selectedDate}
                    onSelect={handleDateSelect}
                  />
                </div>
              )}
            </div>

            {/* Trip select */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-app-mu">Trip</span>
              <select
                value={selectedTripId}
                onChange={e => { setSelectedTripId(e.target.value); setFilter("all"); }}
                className="bg-app-card2 border border-app-bd rounded-xl px-3 py-2 text-[12px] font-bold text-app-tx outline-none focus:border-app-am appearance-none cursor-pointer min-w-[220px]"
              >
                <option value="all">All Trips</option>
                {tripsForDate.map(t => {
                  const tripPending = allBookings.filter(
                    b => b.trip?._id === t._id && !b.attended && b.status !== "missed" && b.status !== "cancelled"
                  ).length;
                  return (
                    <option key={t._id} value={t._id}>
                      {timeSlotLabel(t.time_slot)} — {t.route?.name || "?"} {tripPending > 0 ? `(${tripPending} pending)` : "✓"}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Occupancy */}
            {selectedTrip && (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-app-mu">Seats</span>
                <div className="bg-app-card2 border border-app-bd rounded-xl px-3 py-2 text-[12px] font-bold text-app-tx">
                  <span className="text-app-am">{selectedTrip.booked_seats}</span>
                  <span className="text-app-mu"> / {selectedTrip.total_seats}</span>
                </div>
              </div>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1 w-fit rounded-xl border border-app-bd bg-app-card2 p-0.5">
            {([
              { key: "all",     label: "All",     count: bookingsForSelection.length,                                         color: "" },
              { key: "present", label: "Present", count: bookingsForSelection.filter(b => b.attended).length,                 color: "bg-green-500/10 text-app-ok" },
              { key: "absent",  label: "Absent",  count: bookingsForSelection.filter(b => b.status === "missed").length,      color: "bg-red-500/10 text-app-err" },
              { key: "pending", label: "Pending", count: pendingCount,                                                        color: "bg-app-am/10 text-app-am" },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all
                  ${filter === t.key ? "bg-app-card text-app-am border border-app-bd shadow-sm" : "text-app-mu hover:text-app-tx"}`}
              >
                {t.label}
                <span className={`ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-md ${t.color || "opacity-40"}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-40">
            <Ic.Users size={32} />
            <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-app-mu">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-app-bd bg-app-card2/30">
                  {["Student", "Route", "Seat", "Time Slot", "Date", "Status"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-app-mu">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-app-bd">
                {filteredBookings.map(b => (
                  <tr
                    key={b._id}
                    className={`transition-colors hover:bg-app-card2/40
                      ${b.attended ? "border-l-[3px] border-app-ok" :
                        b.status === "missed" ? "border-l-[3px] border-app-err" :
                        "border-l-[3px] border-app-am/30"}`}
                  >
                    <td className="px-5 py-3">
                      <div className="font-bold text-app-tx text-[12px]">{b.user?.name || "—"}</div>
                      <div className="text-[10px] text-app-mu">{b.user?.email || "—"}</div>
                    </td>
                    <td className="px-5 py-3 text-[12px] font-medium text-app-mu">{b.trip?.route?.name || "—"}</td>
                    <td className="px-5 py-3 text-[12px] font-black text-app-tx">#{b.seat_number}</td>
                    <td className="px-5 py-3 text-[11px] font-medium text-app-mu uppercase">{timeSlotLabel(b.trip?.time_slot)}</td>
                    <td className="px-5 py-3 text-[11px] font-medium text-app-mu">{new Date(b.trip?.date).toDateString()}</td>
                    <td className="px-5 py-3">
                      {b.attended ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-green-500/10 text-app-ok border border-green-500/20">
                          <Ic.Check size={10} /> Present
                        </span>
                      ) : b.status === "missed" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-red-500/10 text-app-err border border-red-500/20">
                          <Ic.X size={10} /> Absent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-app-am/10 text-app-am border border-app-am/20">
                          <Ic.Clock size={10} /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReport;