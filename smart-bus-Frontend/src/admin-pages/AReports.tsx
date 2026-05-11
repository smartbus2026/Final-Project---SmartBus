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

interface TodayBooking {
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

const AdminReport: React.FC = () => {
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [allBookings, setAllBookings] = useState<TodayBooking[]>([]);
  const [allTrips, setAllTrips] = useState<TripInfo[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "present" | "absent" | "pending">("all");

  const fetchDashboard = async () => {
    try {
      const res = await Api.get('/reports/dashboard-stats');
      setDashData(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await Api.get("/bookings/stats");
      setAttendance(res.data.data.attendance);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await Api.get("/bookings");
      setAllBookings(res.data.data?.bookings || []);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrips = async () => {
    try {
      const res = await Api.get("/trips");
      setAllTrips(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch trips", err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchStats();
    fetchBookings();
    fetchTrips();
  }, []);

  const handleCloseTrip = async (tripId: string) => {
    if (!window.confirm("Are you sure you want to end this trip? All pending students will be marked as absent.")) return;
    try {
      await Api.patch(`/bookings/trip/${tripId}/close`);
      fetchStats();
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to close trip");
    }
  };

  const timeSlotLabel = (slot: string) => {
    const map: Record<string, string> = {
      morning: "Morning",
      return_1530: "3:30 PM",
      return_1900: "7:00 PM",
    };
    return map[slot] || slot;
  };

  // فلتر الـ bookings بناءً على الـ trip المختار
  const bookingsForTrip = selectedTripId === "all"
    ? allBookings
    : allBookings.filter(b => b.trip?._id === selectedTripId);

  const filteredBookings = bookingsForTrip.filter(b => {
    if (filter === "present") return b.attended === true;
    if (filter === "absent") return b.status === "missed";
    if (filter === "pending") return !b.attended && b.status !== "missed" && b.status !== "cancelled";
    return b.status !== "cancelled";
  });

  if (isLoading || !dashData) {
    return (
      <div className="flex-1 bg-app-bg text-app-tx p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-app-bd border-t-app-am rounded-full animate-spin"></div>
          <div className="animate-pulse text-app-mu font-black uppercase tracking-widest text-[10px]">Loading Analytics Data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">

      {/* ── Top Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: "Total Students", value: dashData.totalUsers.toString(), trend: "Registered users", icon: <Ic.Users /> },
          { title: "Active Trips", value: dashData.activeTrips.toString(), trend: "Buses currently en route", icon: <Ic.Bus /> },
          { title: "Today Present", value: attendance?.present?.toString() ?? "0", trend: `${attendance?.presentPct ?? 0}% attendance rate`, icon: <Ic.Check /> },
          { title: "Total Bookings", value: dashData.totalBookings.toString(), trend: `${attendance?.pending ?? 0} pending today`, icon: <Ic.Chart /> },
        ].map((stat, i) => (
          <div key={i} className="bg-app-card rounded-2xl p-6 border border-app-bd shadow-sm hover:border-app-am/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-app-mu uppercase tracking-widest">{stat.title}</p>
              <div className="w-10 h-10 rounded-xl bg-app-am/10 flex items-center justify-center text-app-am">
                {stat.icon}
              </div>
            </div>
            <h3 className="text-3xl font-black text-app-tx mb-1">{stat.value}</h3>
            <p className="text-[10px] font-bold text-app-ok">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* ── Attendance + Students Table ── */}
      <div className="rounded-2xl border border-app-bd bg-app-card p-6">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Donut Chart */}
          <div className="lg:w-64 shrink-0">
            <h3 className="font-syne text-[13px] font-bold uppercase tracking-wider text-app-tx">Attendance</h3>
            <p className="mb-6 text-[10px] font-medium text-app-mu">Overall breakdown</p>
            <div className="mb-6 flex justify-center">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full shadow-lg"
                style={{
                  background: `conic-gradient(var(--ok) 0% ${attendance?.presentPct ?? 0}%, var(--err) ${attendance?.presentPct ?? 0}% ${(attendance?.presentPct ?? 0) + (attendance?.absentPct ?? 0)}%, var(--mu) ${(attendance?.presentPct ?? 0) + (attendance?.absentPct ?? 0)}% 100%)`
                }}>
                <div className="flex h-[74%] w-[74%] flex-col items-center justify-center rounded-full bg-app-card border border-app-bd/50">
                  <span className="font-syne text-xl font-black text-app-tx leading-none">{attendance?.presentPct ?? 0}%</span>
                  <span className="mt-0.5 text-[8px] font-bold uppercase text-app-mu">Present</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { l: "Present", v: `${attendance?.present ?? 0} (${attendance?.presentPct ?? 0}%)`, c: "bg-app-ok" },
                { l: "Absent",  v: `${attendance?.absent  ?? 0} (${attendance?.absentPct  ?? 0}%)`, c: "bg-app-err" },
                { l: "Pending", v: `${attendance?.pending ?? 0} (${attendance?.pendingPct ?? 0}%)`, c: "bg-app-mu" },
              ].map((item) => (
                <div key={item.l} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 font-medium text-app-mu">
                    <span className={`h-2 w-2 rounded-full ${item.c}`} /> {item.l}
                  </div>
                  <span className="font-bold text-app-tx">{item.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block w-px bg-app-bd shrink-0" />

          {/* Students Table */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="font-syne text-[13px] font-bold uppercase tracking-wider text-app-tx">Students Attendance</h3>

              {/* Trip Selector + End Trip Button */}
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={selectedTripId}
                  onChange={e => { setSelectedTripId(e.target.value); setFilter("all"); }}
                  className="bg-app-card2 border border-app-bd rounded-xl px-3 py-2 text-[11px] font-bold text-app-tx outline-none focus:border-app-am appearance-none cursor-pointer"
                >
                  <option value="all">All Trips</option>
                  {allTrips.map(t => (
                    <option key={t._id} value={t._id}>
                      {new Date(t.date).toDateString()} — {timeSlotLabel(t.time_slot)} {t.route?.name ? `(${t.route.name})` : ""}
                    </option>
                  ))}
                </select>

                {selectedTripId !== "all" && (
                  <button
                    onClick={() => handleCloseTrip(selectedTripId)}
                    className="bg-red-500/10 text-app-err border border-red-500/20 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                  >
                    End Trip
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 mb-5 w-fit rounded-xl border border-app-bd bg-app-card2 p-0.5">
              {([
                { key: "all",     label: "All",     count: bookingsForTrip.filter(b => b.status !== "cancelled").length },
                { key: "present", label: "Present", count: bookingsForTrip.filter(b => b.attended).length },
                { key: "absent",  label: "Absent",  count: bookingsForTrip.filter(b => b.status === "missed").length },
                { key: "pending", label: "Pending", count: bookingsForTrip.filter(b => !b.attended && b.status !== "missed" && b.status !== "cancelled").length },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`cursor-pointer rounded-lg px-4 py-1.5 text-[11px] font-bold transition-all
                    ${filter === t.key ? "bg-app-card text-app-am border border-app-bd shadow-sm" : "text-app-mu hover:text-app-tx"}`}
                >
                  {t.label}
                  <span className="ml-1 opacity-40 text-[10px]">({t.count})</span>
                </button>
              ))}
            </div>

            {filteredBookings.length === 0 ? (
              <p className="text-center text-app-mu text-xs py-8 font-bold uppercase">No students found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-app-bd">
                      {["Student", "Route", "Seat", "Time Slot", "Status"].map(h => (
                        <th key={h} className="pb-3 text-left text-[10px] font-black uppercase tracking-widest text-app-mu">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-bd">
                    {filteredBookings.map((b) => (
                      <tr key={b._id}
                        className={`group transition-colors hover:bg-app-card2/50
                          ${b.attended ? "border-l-2 border-app-ok" : b.status === "missed" ? "border-l-2 border-app-err" : ""}`}
                      >
                        <td className="py-3 pr-4">
                          <div className="font-bold text-app-tx text-[12px]">{b.user?.name || "—"}</div>
                          <div className="text-[10px] text-app-mu">{b.user?.email || "—"}</div>
                        </td>
                        <td className="py-3 pr-4 text-[12px] font-medium text-app-mu">{b.trip?.route?.name || "—"}</td>
                        <td className="py-3 pr-4 text-[12px] font-bold text-app-tx">#{b.seat_number}</td>
                        <td className="py-3 pr-4 text-[11px] font-medium text-app-mu uppercase">
                          {timeSlotLabel(b.trip?.time_slot)}
                        </td>
                        <td className="py-3">
                          {b.attended ? (
                            <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase bg-green-500/10 text-app-ok border border-green-500/20">✓ Present</span>
                          ) : b.status === "missed" ? (
                            <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase bg-red-500/10 text-app-err border border-red-500/20">✗ Absent</span>
                          ) : (
                            <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase bg-app-card2 text-app-mu border border-app-bd">Pending</span>
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
      </div>

    </div>
  );
};

export default AdminReport;