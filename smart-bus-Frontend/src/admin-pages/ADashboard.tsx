import React, { useState, useEffect } from 'react';
import { Ic } from '../icons';
import Api from '../services/Api';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalStudents: 0,
    activeTripsCount: 0,
    totalRoutes: 0,
    totalBookings: 0,
    trips: [] as any[],
    tickets: [] as any[],
    routesList: [] as any[]
  });

  // ── Demand aggregation state ──
  const [demandDate, setDemandDate] = useState<"today" | "tomorrow">("tomorrow");
  const [demands, setDemands] = useState<any[]>([]);
  const [demandLoading, setDemandLoading] = useState(true);

  // ── Dispatch State ──
  const [buses, setBuses] = useState<any[]>([]);
  const [returnTimes, setReturnTimes] = useState<string[]>([]);
  const [dispatchForm, setDispatchForm] = useState<{ busId: string; timeSlot: string; specificReturnTime?: string; routeIds: string[] }>({
    busId: "",
    timeSlot: "Morning",
    specificReturnTime: "",
    routeIds: []
  });
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchMessage, setDispatchMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, tripsRes, routesRes, bookingsRes, supportRes, settingsRes] = await Promise.all([
          Api.get('/users').catch(() => ({ data: [] })),
          Api.get('/trips').catch(() => ({ data: { data: [] } })),
          Api.get('/routes').catch(() => ({ data: { data: [] } })),
          Api.get('/bookings').catch(() => ({ data: { data: [] } })),
          Api.get('/support').catch(() => ({ data: { data: { tickets: [] } } })),
          Api.get('/settings').catch(() => ({ data: { data: { settings: {} } } }))
        ]);

        const users = usersRes.data || [];
        const trips = tripsRes.data?.data || tripsRes.data || [];
        const routes = routesRes.data?.data || routesRes.data || [];
        const bookings = bookingsRes.data?.data || bookingsRes.data || [];
        const supportTickets = supportRes.data?.data?.tickets || supportRes.data?.tickets || [];
        const fetchedSettings = settingsRes.data?.data?.settings || settingsRes.data?.settings || {};

        if (fetchedSettings.return_times) {
          setReturnTimes(fetchedSettings.return_times);
        }

        const studentCount = Array.isArray(users) ? users.filter((u: any) => u.role === 'student').length : 0;
        const activeTripsList = Array.isArray(trips) ? trips.filter((t: any) => t.status === 'active') : [];

        // Filter for today's trips for the table
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaysTrips = Array.isArray(trips) ? trips.filter((t: any) => {
          if (!t.date) return false;
          const d = new Date(t.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        }) : [];

        const pendingTickets = supportTickets.filter((t: any) => t.status === 'open' || t.status === 'pending');

        setData({
          totalStudents: studentCount,
          activeTripsCount: activeTripsList.length,
          totalRoutes: Array.isArray(routes) ? routes.length : 0,
          totalBookings: Array.isArray(bookings) ? bookings.length : 0,
          trips: todaysTrips.slice(0, 5),
          tickets: pendingTickets.slice(0, 5),
          routesList: Array.isArray(routes) ? routes : []
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // ── Fetch Buses Dynamically ──
  const fetchBuses = async () => {
    try {
      const busesRes = await Api.get('/tracking/buses');
      setBuses(busesRes.data?.data?.buses || busesRes.data?.buses || busesRes.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch buses", err);
    }
  };

  useEffect(() => {
    fetchBuses();
    // Poll every 5 seconds to ensure newly created buses appear instantly
    const interval = setInterval(fetchBuses, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch demands whenever tab changes ──
  useEffect(() => {
    const fetchDemands = async () => {
      setDemandLoading(true);
      try {
        const target = new Date();
        if (demandDate === "tomorrow") target.setDate(target.getDate() + 1);
        const dateStr = target.toISOString().split("T")[0];
        const res = await Api.get(`/bookings/admin/demand?date=${dateStr}`);
        setDemands(res.data?.data?.demands || []);
      } catch (err) {
        console.error("Failed to fetch demands", err);
        setDemands([]);
      } finally {
        setDemandLoading(false);
      }
    };
    fetchDemands();
  }, [demandDate]);

  const handleResolveTicket = async (id: string) => {
    try {
      await Api.put(`/support/${id}/status`, { status: "resolved" });
      setData(prev => ({
        ...prev,
        tickets: prev.tickets.filter((t: any) => t._id !== id)
      }));
    } catch (err) {
      console.error("Failed to resolve ticket", err);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchForm.busId || dispatchForm.routeIds.length === 0) {
      setDispatchMessage({ type: "error", text: "Please select a bus and at least one route." });
      return;
    }
    if (dispatchForm.timeSlot === "Return" && !dispatchForm.specificReturnTime) {
      setDispatchMessage({ type: "error", text: "Please select a specific return time for Return trips." });
      return;
    }

    setDispatchLoading(true);
    setDispatchMessage({ type: "", text: "" });

    try {
      const targetDate = new Date();
      if (demandDate === "tomorrow") targetDate.setDate(targetDate.getDate() + 1);

      const payload: any = {
        busId: dispatchForm.busId,
        date: targetDate.toISOString().split("T")[0],
        timeSlot: dispatchForm.timeSlot,
        routeIds: dispatchForm.routeIds
      };

      if (dispatchForm.timeSlot === "Return" && dispatchForm.specificReturnTime) {
        payload.specificReturnTime = dispatchForm.specificReturnTime;
      }

      await Api.post('/bookings/admin/dispatch', payload);

      setDispatchMessage({ type: "success", text: "Bus assigned successfully and students notified!" });
      setDispatchForm(prev => ({ ...prev, routeIds: [], busId: "", specificReturnTime: "" }));
      
      // Refresh demands instantly
      setDemandDate(prev => prev);
    } catch (err: any) {
      setDispatchMessage({ type: "error", text: err.response?.data?.message || "Failed to dispatch bus." });
    } finally {
      setDispatchLoading(false);
    }
  };

  const stats = [
    {
      title: "Total Students",
      value: loading ? "..." : data.totalStudents.toLocaleString(),
      trend: "Registered accounts",
      icon: <Ic.Users />
    },
    {
      title: "Active Trips",
      value: loading ? "..." : data.activeTripsCount.toString(),
      trend: "Currently en route",
      icon: <Ic.Bus />
    },
    {
      title: "Available Routes",
      value: loading ? "..." : data.totalRoutes.toString(),
      trend: "Active service paths",
      icon: <Ic.Pin />
    },
    {
      title: "Total Bookings",
      value: loading ? "..." : data.totalBookings.toLocaleString(),
      trend: "System wide",
      icon: <Ic.Calendar />
    },
  ];

  const statusStyle: Record<string, string> = {
    active: "bg-app-ok/10 text-app-ok border border-app-ok/20",
    pending: "bg-app-bd text-app-mu border border-app-bd",
    completed: "bg-app-am/10 text-app-am border border-app-am/20",
    cancelled: "bg-red-500/10 text-red-500 border border-red-500/20",
  };

  const statusLabel: Record<string, string> = {
    active: "Active",
    pending: "Not Started",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <div className="p-6 space-y-6 bg-app-bg text-app-tx min-h-screen">
      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-app-card rounded-2xl p-6 border border-app-bd hover:border-app-am/40 transition-all group shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-app-mu uppercase tracking-widest">{stat.title}</p>
              <div className="w-10 h-10 rounded-xl bg-app-am/10 flex items-center justify-center text-app-am transition-transform group-hover:scale-110">
                {stat.icon}
              </div>
            </div>
            <h3 className="text-3xl font-black text-app-tx mb-1 tracking-tight">{stat.value}</h3>
            <p className="text-[10px] font-bold text-app-ok">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* ── Live Booking Demands ── */}
      <div className="bg-app-card rounded-2xl border border-app-bd shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-app-bd">
          <div>
            <h3 className="text-[11px] font-black text-app-tx uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-app-am animate-pulse inline-block" />
              Live Booking Demands
            </h3>
            <p className="text-[10px] text-app-mu mt-0.5">Pending student bookings grouped by route & time slot</p>
          </div>
          {/* Date tabs */}
          <div className="flex gap-1 bg-app-card2 border border-app-bd rounded-xl p-1">
            {(["today", "tomorrow"] as const).map(d => (
              <button key={d} onClick={() => setDemandDate(d)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                  ${demandDate === d ? "bg-app-am text-black shadow-sm" : "text-app-mu hover:text-app-tx"}`}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {demandLoading ? (
          <div className="p-10 flex flex-col items-center gap-3 text-app-mu">
            <div className="w-8 h-8 border-2 border-app-bd border-t-app-am rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Loading demands...</p>
          </div>
        ) : demands.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-app-mu opacity-50">
            <Ic.Calendar size={32} />
            <p className="text-[11px] font-black uppercase tracking-widest">No pending demands for this date</p>
            <p className="text-[10px]">Students haven't submitted booking requests yet.</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {demands.map((d: any, i: number) => {
              const isHigh   = d.totalStudents > 45;
              const isMedium = d.totalStudents > 30 && !isHigh;
              const slotLabel = d.timeSlot === "Return" && d.specificReturnTime
                ? `Return — ${d.specificReturnTime}`
                : d.timeSlot;

              return (
                <div key={i} className="rounded-xl border border-app-bd bg-app-card p-4 transition-all hover:border-app-bd/80">
                  
                  {/* Top row: Status Badge (if high demand) */}
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-lg font-semibold text-app-tx truncate pr-2">
                      {d.routeName}
                    </h4>
                    
                    {(isHigh || isMedium) && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap
                        ${isHigh   ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                     "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}`}>
                        {isHigh ? "Overloaded" : "High Demand"}
                      </span>
                    )}
                  </div>

                  {/* TimeSlot */}
                  <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-app-card2/50 text-app-mu text-sm font-medium">
                    <Ic.Clock size={14} />
                    <span>{slotLabel}</span>
                  </div>

                  {/* Student count & capacity bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-2 text-sm text-app-tx font-medium">
                      <span className="text-app-mu">Booked</span>
                      <span>{d.totalStudents} <span className="text-xs text-app-mu">/ 45</span></span>
                    </div>
                    
                    {/* Minimal Capacity bar */}
                    <div className="h-1.5 bg-app-card2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700
                          ${isHigh ? "bg-red-400" : isMedium ? "bg-yellow-400" : "bg-app-am"}`}
                        style={{ width: `${Math.min((d.totalStudents / 45) * 100, 100)}%` }}
                      />
                    </div>

                    {/* Multi-bus warning */}
                    {isHigh && (
                      <div className="mt-3 text-xs text-red-400 font-medium flex items-center gap-1.5">
                        <Ic.Bus size={12} /> Requires {Math.ceil(d.totalStudents / 45)} buses
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Dispatch Form ── */}
      <div className="bg-app-card rounded-2xl border border-app-bd shadow-sm overflow-hidden p-6 mt-6">
        <h3 className="text-[11px] font-black text-app-tx uppercase tracking-widest mb-4">Assign Bus & Dispatch</h3>
        <form onSubmit={handleDispatch} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Bus Selection */}
          <div>
            <label className="block text-[10px] text-app-mu uppercase font-bold mb-2 tracking-widest">Select Bus</label>
            <select 
              value={dispatchForm.busId}
              onChange={(e) => setDispatchForm(prev => ({ ...prev, busId: e.target.value }))}
              className="w-full bg-app-bg text-app-tx text-sm border border-app-bd rounded-xl p-3 focus:outline-none focus:border-app-am"
            >
              <option value="">-- Choose Bus --</option>
              {buses.map(b => (
                <option key={b._id} value={b._id}>{b.busCode} (Cap: {b.capacity || 45})</option>
              ))}
            </select>
          </div>

          {/* TimeSlot Selection */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] text-app-mu uppercase font-bold mb-2 tracking-widest">Time Slot</label>
              <select 
                value={dispatchForm.timeSlot}
                onChange={(e) => setDispatchForm(prev => ({ ...prev, timeSlot: e.target.value, specificReturnTime: "" }))}
                className="w-full bg-app-bg text-app-tx text-sm border border-app-bd rounded-xl p-3 focus:outline-none focus:border-app-am"
              >
                <option value="Morning">Morning</option>
                <option value="Return">Return</option>
              </select>
            </div>
            
            {dispatchForm.timeSlot === "Return" && (
              <div className="flex-1">
                <label className="block text-[10px] text-app-mu uppercase font-bold mb-2 tracking-widest">
                  Return Time <span className="text-red-400">*</span>
                </label>
                <select 
                  required
                  value={dispatchForm.specificReturnTime}
                  onChange={(e) => setDispatchForm(prev => ({ ...prev, specificReturnTime: e.target.value }))}
                  className={`w-full bg-app-bg text-app-tx text-sm border rounded-xl p-3 focus:outline-none focus:border-app-am ${
                    !dispatchForm.specificReturnTime ? 'border-red-500/40' : 'border-app-bd'
                  }`}
                >
                  <option value="" disabled>-- Select Return Time --</option>
                  <option value="3:30 PM">3:30 PM</option>
                  <option value="7:00 PM">7:00 PM</option>
                </select>
                {!dispatchForm.specificReturnTime && (
                  <p className="text-[9px] text-red-400 font-bold mt-1 uppercase tracking-widest">Required for Return trips</p>
                )}
              </div>
            )}
          </div>

          {/* Multi-select Routes */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] text-app-mu uppercase font-bold mb-2 tracking-widest">Select Target Routes</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-app-bg border border-app-bd rounded-xl">
              {data.routesList.map(r => {
                const isSelected = dispatchForm.routeIds.includes(r._id);
                return (
                  <button
                    type="button"
                    key={r._id}
                    onClick={() => setDispatchForm(prev => ({
                      ...prev,
                      routeIds: isSelected 
                        ? prev.routeIds.filter(id => id !== r._id) 
                        : [...prev.routeIds, r._id]
                    }))}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                      isSelected ? "bg-app-am text-white border-app-am" : "bg-app-card border-app-bd text-app-mu hover:border-app-am/50"
                    }`}
                  >
                    {r.name}
                  </button>
                );
              })}
              {data.routesList.length === 0 && <span className="text-xs text-app-mu">Loading routes...</span>}
            </div>
          </div>

          {/* Submit */}
          <div className="lg:col-span-4 flex items-center justify-between pt-2 border-t border-app-bd">
            <div className="text-sm font-medium">
              {dispatchMessage.text && (
                <span className={dispatchMessage.type === "error" ? "text-red-400" : "text-app-ok"}>
                  {dispatchMessage.text}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={dispatchLoading}
              className="bg-app-am text-black px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[11px] hover:bg-app-am/90 transition-all disabled:opacity-50"
            >
              {dispatchLoading ? "Dispatching..." : "Assign Bus & Notify"}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending Tickets Widget (Occupies 1 column, Today's Trips occupies 2) */}
        <div className="bg-app-card rounded-2xl border border-app-bd shadow-sm overflow-hidden lg:col-span-1 h-fit">
          <div className="flex justify-between items-center px-6 py-4 border-b border-app-bd">
            <h3 className="text-[11px] font-black text-app-tx uppercase tracking-widest">Pending Tickets</h3>
            <button className="text-[10px] font-black text-app-am hover:underline tracking-wider" onClick={() => window.location.href = '/admin/support'}>View All</button>
          </div>
          <div className="divide-y divide-app-bd">
            {loading ? (
              <div className="p-6 text-center text-xs text-app-mu">Loading tickets...</div>
            ) : data.tickets.length === 0 ? (
              <div className="p-6 text-center text-xs text-app-mu">No pending tickets</div>
            ) : (
              data.tickets.map((t: any, i) => (
                <div key={t._id || i} className="px-6 py-4 hover:bg-app-card2/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[12px] font-bold text-app-tx">{t.subject}</p>
                    <button
                      onClick={() => handleResolveTicket(t._id)}
                      className="px-2 py-1 bg-app-ok/10 text-app-ok text-[9px] font-black uppercase tracking-widest rounded hover:bg-app-ok hover:text-white transition-colors cursor-pointer"
                    >
                      Resolve
                    </button>
                  </div>
                  <p className="text-[10px] text-app-mu mb-2 line-clamp-2">{t.description}</p>
                  <p className="text-[9px] font-bold text-app-mu2 uppercase">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Today's Trips ── */}
        <div className="bg-app-card rounded-2xl border border-app-bd shadow-sm overflow-hidden lg:col-span-2">
          <div className="flex justify-between items-center px-6 py-4 border-b border-app-bd">
            <h3 className="text-[11px] font-black text-app-tx uppercase tracking-widest">Today's Trips</h3>
            <div className="flex gap-2">
              <button className="text-[10px] font-black text-app-mu border border-app-bd px-4 py-1.5 rounded-lg hover:border-app-am hover:text-app-tx transition-all">
                Filter
              </button>
              <button className="text-[10px] font-black text-app-mu border border-app-bd px-4 py-1.5 rounded-lg hover:border-app-am hover:text-app-tx transition-all flex items-center gap-1.5">
                <Ic.Download size={12} /> Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-app-bd bg-app-bg/50">
                  {["Trip ID", "Route", "Driver", "Time", "Seats", "Status"].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-app-mu uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-app-bd">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-xs text-app-mu">Loading trips...</td>
                  </tr>
                ) : data.trips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-xs text-app-mu">No trips scheduled for today</td>
                  </tr>
                ) : (
                  data.trips.map((trip: any) => (
                    <tr key={trip._id} className="hover:bg-app-card2/40 transition-colors group">
                      <td className="px-6 py-4 text-[12px] font-black text-app-tx font-mono">{trip._id.slice(-6).toUpperCase()}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-[12px] font-medium text-app-mu">
                          <span className="text-app-am"><Ic.Pin size={14} /></span>
                          {trip.route?.name || "Unknown Route"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[12px] font-medium text-app-tx">{trip.driver?.name || "Unassigned"}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-[12px] text-app-mu">
                          <Ic.Clock size={12} /> {trip.time_slot}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[12px] font-bold text-app-tx">{trip.booked_seats || 0}/{trip.total_seats || 40}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusStyle[trip.status] || statusStyle.pending}`}>
                          {statusLabel[trip.status] || "Pending"}
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
    </div>
  );
};

export default AdminDashboard;