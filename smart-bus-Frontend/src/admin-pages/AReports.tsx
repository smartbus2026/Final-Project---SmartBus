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

  // كل الـ dates المتاحة
  const availableDates = Array.from(
    new Set(allTrips.map(t => new Date(t.date).toDateString()))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // الـ trips بتاعت الـ date المختارة
  const tripsForDate = selectedDate === "all"
    ? allTrips
    : allTrips.filter(t => new Date(t.date).toDateString() === selectedDate);

  // reset trip لما يتغير الـ date
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTripId("all");
    setFilter("all");
  };

  // الـ bookings بناءً على الـ selections
  const bookingsForSelection = allBookings.filter(b => {
    if (b.status === "cancelled") return false;
    if (selectedDate !== "all" && new Date(b.trip?.date).toDateString() !== selectedDate) return false;
    if (selectedTripId !== "all" && b.trip?._id !== selectedTripId) return false;
    return true;
  });

  const filteredBookings = bookingsForSelection.filter(b => {
    if (filter === "present") return b.attended === true;
    if (filter === "absent") return b.status === "missed";
    if (filter === "pending") return !b.attended && b.status !== "missed";
    return true;
  });

  // الـ trip المختارة
  const selectedTrip = allTrips.find(t => t._id === selectedTripId);
  const hasPending = bookingsForSelection.some(b => !b.attended && b.status !== "missed" && b.status !== "cancelled");

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
          { title: "Total Students", value: dashData.totalUsers, icon: <Ic.Users />, color: "text-app-am", bg: "bg-app-am/10" },
          { title: "Total Present", value: attendance?.present ?? 0, icon: <Ic.Check />, color: "text-app-ok", bg: "bg-green-500/10" },
          { title: "Total Absent", value: attendance?.absent ?? 0, icon: <Ic.X />, color: "text-app-err", bg: "bg-red-500/10" },
          { title: "Pending", value: attendance?.pending ?? 0, icon: <Ic.Clock />, color: "text-app-mu", bg: "bg-app-card2" },
        ].map((s, i) => (
          <div key={i} className="bg-app-card rounded-2xl p-5 border border-app-bd hover:border-app-am/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-app-mu">{s.title}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>{s.icon}</div>
            </div>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="mt-2 h-1 w-full bg-app-card2 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${s.bg.replace('/10', '')}`}
                style={{ width: `${attendance?.total ? Math.round((Number(s.value) / attendance.total) * 100) : 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Panel ── */}
      <div className="bg-app-card rounded-2xl border border-app-bd overflow-hidden">

        {/* Header + Filters */}
        <div className="p-5 border-b border-app-bd space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="font-syne text-[15px] font-black uppercase tracking-wider text-app-tx">
              Attendance Management
            </h2>

            {/* End Trip Button */}
            {selectedTripId !== "all" && hasPending && (
              <button
                onClick={() => handleCloseTrip(selectedTripId)}
                disabled={closingTrip === selectedTripId}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {closingTrip === selectedTripId ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Ic.X size={14} />
                )}
                End Trip — Mark Pending as Absent
              </button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3">
            {/* Date Picker */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-app-mu">Date</span>
              <select
                value={selectedDate}
                onChange={e => handleDateChange(e.target.value)}
                className="bg-app-card2 border border-app-bd rounded-xl px-3 py-2 text-[12px] font-bold text-app-tx outline-none focus:border-app-am appearance-none cursor-pointer min-w-[160px]"
              >
                <option value="all">All Dates</option>
                {availableDates.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Trip Picker */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-app-mu">Trip</span>
              <select
                value={selectedTripId}
                onChange={e => { setSelectedTripId(e.target.value); setFilter("all"); }}
                className="bg-app-card2 border border-app-bd rounded-xl px-3 py-2 text-[12px] font-bold text-app-tx outline-none focus:border-app-am appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="all">All Trips</option>
                {tripsForDate.map(t => (
                  <option key={t._id} value={t._id}>
                    {timeSlotLabel(t.time_slot)} {t.route?.name ? `— ${t.route.name}` : ""} {t.bus_number ? `(${t.bus_number})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Trip Info */}
            {selectedTrip && (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-app-mu">Occupancy</span>
                <div className="bg-app-card2 border border-app-bd rounded-xl px-3 py-2 text-[12px] font-bold text-app-tx min-w-[120px]">
                  <span className="text-app-am">{selectedTrip.booked_seats}</span>
                  <span className="text-app-mu"> / {selectedTrip.total_seats} seats</span>
                </div>
              </div>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1 w-fit rounded-xl border border-app-bd bg-app-card2 p-0.5">
            {([
              { key: "all",     label: "All",     count: bookingsForSelection.length },
              { key: "present", label: "Present", count: bookingsForSelection.filter(b => b.attended).length },
              { key: "absent",  label: "Absent",  count: bookingsForSelection.filter(b => b.status === "missed").length },
              { key: "pending", label: "Pending", count: bookingsForSelection.filter(b => !b.attended && b.status !== "missed").length },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all
                  ${filter === t.key ? "bg-app-card text-app-am border border-app-bd shadow-sm" : "text-app-mu hover:text-app-tx"}`}
              >
                {t.label}
                <span className={`ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                  t.key === "present" ? "bg-green-500/10 text-app-ok" :
                  t.key === "absent" ? "bg-red-500/10 text-app-err" :
                  t.key === "pending" ? "bg-app-am/10 text-app-am" :
                  "opacity-40"
                }`}>{t.count}</span>
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
                {filteredBookings.map((b) => (
                  <tr key={b._id}
                    className={`transition-colors hover:bg-app-card2/40
                      ${b.attended ? "border-l-[3px] border-app-ok" :
                        b.status === "missed" ? "border-l-[3px] border-app-err" :
                        "border-l-[3px] border-transparent"}`}
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