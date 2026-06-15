import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Ic } from '../icons';
import Api from '../services/Api';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
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
  const [demandDate, setDemandDate] = useState<string>("tomorrow");
  const [demands, setDemands] = useState<any[]>([]);
  const [demandLoading, setDemandLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<"Morning" | "Return">("Morning");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // ── Tomorrow's Bookings (Demands) filter state ──
  const [filterShift, setFilterShift] = useState<"morning" | "return">("morning");
  const [filterTime, setFilterTime] = useState<string>("3:30");

  // ── Dispatch State ──
  const [buses, setBuses] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [returnTimes, setReturnTimes] = useState<string[]>([]);
  const [dispatchForm, setDispatchForm] = useState<{ timeSlot: string; specificReturnTime?: string; routeIds: string[] }>({
    timeSlot: "Morning",
    specificReturnTime: "",
    routeIds: []
  });
  const [assignments, setAssignments] = useState([{ busId: "", driverId: "" }]);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchMessage, setDispatchMessage] = useState({ type: "", text: "" });

  // ── Today's Trips State ──
  const [assignedTrips, setAssignedTrips] = useState<any[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripFilter, setTripFilter] = useState({
    routeId: "",
    timeSlot: "",
    specificReturnTime: ""
  });

  // ── AI Proposal State ──
  const [pendingProposal, setPendingProposal] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [proposalLoading, setProposalLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedAssignments, setEditedAssignments] = useState<any[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);

  const handleGenerateAI = async () => {
    // Validate: return shift requires a time
    if (filterShift === "return" && !filterTime) {
      alert("Please select a return time before generating a dispatch plan.");
      return;
    }
    setGeneratingAI(true);
    try {
      // Always target tomorrow
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
      const formattedDate = targetDate.toISOString().split("T")[0];

      await Api.post('/admin/dispatch/generate', {
        targetDate: formattedDate,
        shift: filterShift,                                   // 'morning' | 'return'
        time: filterShift === 'return' ? filterTime : null   // e.g. '3:30' | null
      });

      // Refresh proposal panel using the same shift
      const capitalizedShift = filterShift.charAt(0).toUpperCase() + filterShift.slice(1);
      fetchPendingProposal(capitalizedShift);
    } catch (err: any) {
      console.error("Failed to generate AI proposal", err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Failed to generate AI proposal.";
      alert(`AI Engine Notice:\n${errorMsg}`);
    } finally {
      setGeneratingAI(false);
    }
  };

  const fetchPendingProposal = async (overrideType?: string) => {
    try {
      const activeType = overrideType || tripFilter.timeSlot || 'Morning';
      const res = await Api.get(`/admin/proposals/pending?tripType=${activeType}`);
      console.log("RAW API RESPONSE (fetchPendingProposal):", res.data);
      const proposals = res.data?.data || [];
      if (proposals.length > 0) {
        setPendingProposal(proposals[0]);
        setEditedAssignments(proposals[0].assignments);
      } else {
        setPendingProposal(null);
      }
    } catch (err) {
      console.error("Failed to fetch pending proposals", err);
    }
  };

  useEffect(() => {
    fetchPendingProposal();
  }, [tripFilter.timeSlot]);

  useEffect(() => {
    if (!pendingProposal) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const deadline = new Date(pendingProposal.deadline).getTime();
      const diff = deadline - now;
      if (diff <= 0) {
        setTimeRemaining(t("deadline_passed") || "Deadline Passed");
        clearInterval(interval);
      } else {
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${h}h ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingProposal, t]);

  const handleApproveProposal = async () => {
    const finalAssignments = editMode ? editedAssignments : pendingProposal.assignments;
    const invalid = finalAssignments.some((a: any) => !a.busId || !a.driverId);
    
    if (invalid) {
      alert("Validation Error: You MUST assign a physical Bus and Driver to each group before confirming the AI plan.");
      if (!editMode) setEditMode(true);
      return;
    }

    setProposalLoading(true);
    try {
      await Api.post(`/admin/proposals/${pendingProposal._id}/approve`, {
        assignments: finalAssignments
      });
      setPendingProposal(null);
      setEditMode(false);
      fetchAssignedTrips();
    } catch (err: any) {
      console.error("Failed to approve proposal", err);
      alert(err.response?.data?.message || "Failed to confirm assignments.");
    } finally {
      setProposalLoading(false);
    }
  };

  const handleSaveEdits = async () => {
    setProposalLoading(true);
    try {
      await Api.put(`/admin/proposals/${pendingProposal._id}/edit`, { assignments: editedAssignments });
      setEditMode(false);
      fetchPendingProposal();
    } catch (err) {
      console.error("Failed to save edits", err);
    } finally {
      setProposalLoading(false);
    }
  };

 const fetchAssignedTrips = async () => {
  setTripsLoading(true);
  try {
    const res = await Api.get('/bookings/admin/assigned-trips');
    console.log("RAW API RESPONSE (fetchAssignedTrips):", res.data);
    
    let rawData = res.data?.data?.assignedTrips || 
                  res.data?.assignedTrips || 
                  res.data?.trips ||             // <-- ضيفي ده هنا
                  res.data?.data?.trips ||        // <-- وضيفي ده للأمان
                  res.data?.data;    
    if (!Array.isArray(rawData)) {
        console.warn("API Warning: Expected an array but got:", typeof rawData, rawData);
        rawData = []; 
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 3. الفلتر دلوقتي آمن 100%
    const filteredData = rawData.filter((t: any) => {
      const d = new Date(t.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
    
    setAssignedTrips(filteredData);
  } catch (err) {
    console.error("Failed to fetch assigned trips", err);
  } finally {
    setTripsLoading(false);
  }
};

  useEffect(() => {
    fetchAssignedTrips();
  }, []);

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
        const activeTripsList = Array.isArray(trips) ? trips.filter((t: any) => t.status === 'active' || t.status === 'in-progress' || t.status === 'in_progress') : [];

        const pendingTickets = supportTickets.filter((t: any) => t.status === 'open' || t.status === 'pending');

        setData({
          totalStudents: studentCount,
          activeTripsCount: activeTripsList.length,
          totalRoutes: Array.isArray(routes) ? routes.length : 0,
          totalBookings: Array.isArray(bookings) ? bookings.length : 0,
          trips: [], // Migrated to assignedTrips state
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

  const fetchDrivers = async () => {
    try {
      const driversRes = await Api.get('/admin/drivers');
      setDrivers(driversRes.data || []);
    } catch (err) {
      console.error("Failed to fetch drivers", err);
    }
  };

  useEffect(() => {
    fetchBuses();
    fetchDrivers();
    // Poll every 5 seconds to ensure newly created buses appear instantly
    const interval = setInterval(fetchBuses, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Fetch demands whenever tab changes ──
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

  useEffect(() => {
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
    
    // Validate assignments: every row must have both a busId and a driverId
    const hasInvalidAssignments = assignments.some(a => !a.busId || !a.driverId);
    if (hasInvalidAssignments || dispatchForm.routeIds.length === 0) {
      setDispatchMessage({ type: "error", text: t("dispatch_validation") });
      return;
    }

    if (dispatchForm.timeSlot === "Return" && !dispatchForm.specificReturnTime) {
      setDispatchMessage({ type: "error", text: t("dispatch_return_required") });
      return;
    }

    setDispatchLoading(true);
    setDispatchMessage({ type: "", text: "" });

    try {
      const targetDate = new Date();
      if (demandDate === "tomorrow") targetDate.setDate(targetDate.getDate() + 1);

      const payload: any = {
        assignments: assignments,
        date: targetDate.toISOString().split("T")[0],
        timeSlot: dispatchForm.timeSlot,
        routeIds: dispatchForm.routeIds
      };

      if (dispatchForm.timeSlot === "Return" && dispatchForm.specificReturnTime) {
        payload.specificReturnTime = dispatchForm.specificReturnTime;
      }

      await Api.post('/bookings/admin/dispatch', payload);

      setDispatchMessage({ type: "success", text: t("dispatch_success") });
      setDispatchForm(prev => ({ ...prev, routeIds: [], specificReturnTime: "" }));
      setAssignments([{ busId: "", driverId: "" }]);
      
      // Refresh demands and trips instantly
      fetchDemands();
      fetchAssignedTrips();
    } catch (err: any) {
      setDispatchMessage({ type: "error", text: err.response?.data?.message || t("dispatch_failed") });
    } finally {
      setDispatchLoading(false);
    }
  };

  const stats = [
    {
      title: t("total_students"),
      value: loading ? "..." : data.totalStudents.toLocaleString(),
      trend: t("stat_registered_accounts"),
      icon: <Ic.Users />
    },
    {
      title: t("active_trips"),
      value: loading ? "..." : data.activeTripsCount.toString(),
      trend: t("stat_currently_en_route"),
      icon: <Ic.Bus />
    },
    {
      title: t("available_routes"),
      value: loading ? "..." : data.totalRoutes.toString(),
      trend: t("stat_active_service_paths"),
      icon: <Ic.Pin />
    },
    {
      title: t("total_bookings"),
      value: loading ? "..." : data.totalBookings.toLocaleString(),
      trend: t("stat_system_wide"),
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
    active: t("active"),
    pending: t("not_started"),
    completed: t("completed"),
    cancelled: t("cancelled"),
  };

  return (
    <div className="p-6 space-y-6 bg-app-bg text-app-tx min-h-screen">
      {/* ── AI Proposal Alert & Preview ── */}
      {pendingProposal && (
        <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl p-6 shadow-sm mb-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <Ic.Info /> AI Bus Assignment Proposal
              </h2>
              <p className="text-sm font-bold text-app-tx mt-1">
                For {pendingProposal.tripType} on {new Date(pendingProposal.targetDate).toDateString()}
              </p>
            </div>
            <div className="bg-amber-500/20 px-4 py-2 rounded-lg flex flex-col items-end text-end">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Auto-Approve Deadline</p>
              <p className="text-2xl font-black text-app-tx tabular-nums">{timeRemaining}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {(editMode ? editedAssignments : pendingProposal.assignments).map((assignment: any, index: number) => (
              <div key={index} className="bg-app-bg border border-app-bd rounded-xl p-4 shadow-sm">
                <div className="flex flex-col gap-2 mb-3 border-b border-app-bd pb-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-black text-app-tx">Bus {assignment.busNumber}</h4>
                    <span className="text-[10px] font-bold text-app-mu uppercase tracking-wider">{assignment.studentBookings.length} Students</span>
                  </div>
                  {editMode && (
                    <div className="flex gap-2">
                      <select className="flex-1 bg-app-bg border border-app-bd text-[10px] p-1 rounded custom-select"
                        value={assignment.busId || ""}
                        onChange={(e) => {
                          const newAssignments = [...editedAssignments];
                          newAssignments[index].busId = e.target.value;
                          setEditedAssignments(newAssignments);
                        }}
                      >
                        <option value="">Select Bus</option>
                        {buses.map(b => <option key={b._id} value={b._id}>{b.busCode}</option>)}
                      </select>
                      <select className="flex-1 bg-app-bg border border-app-bd text-[10px] p-1 rounded custom-select"
                        value={assignment.driverId || ""}
                        onChange={(e) => {
                          const newAssignments = [...editedAssignments];
                          newAssignments[index].driverId = e.target.value;
                          setEditedAssignments(newAssignments);
                        }}
                      >
                        <option value="">Select Driver</option>
                        {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <ul className="space-y-2 max-h-40 overflow-y-auto pe-2 no-scrollbar">
                  {assignment.studentBookings.map((booking: any, bIdx: number) => (
                    <li key={booking._id || bIdx} className="text-[11px] font-medium text-app-tx flex justify-between items-center p-1.5 hover:bg-app-card2 rounded">
                      <span className="truncate flex-1" title={booking.user?.name}>{booking.user?.name || "Unknown"}</span>
                      <span className="text-[9px] text-app-am bg-app-am/10 px-1.5 py-0.5 rounded font-bold ms-2 shrink-0">{booking.route?.name || "No Route"}</span>
                    </li>
                  ))}
                  {assignment.studentBookings.length === 0 && (
                    <p className="text-[10px] text-app-mu text-center py-2">No students</p>
                  )}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end mt-2">
            {editMode ? (
              <>
                <button
                  onClick={() => { setEditMode(false); setEditedAssignments(pendingProposal.assignments); }}
                  className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-app-card2 text-app-tx hover:bg-app-bd transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdits}
                  disabled={proposalLoading}
                  className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-app-am text-white hover:bg-app-am/80 transition disabled:opacity-50"
                >
                  {proposalLoading ? "Saving..." : "Save Modifications"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-app-card2 text-app-tx hover:bg-app-bd transition"
                >
                  Modify Assignments
                </button>
                <button
                  onClick={handleApproveProposal}
                  disabled={proposalLoading}
                  className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-app-ok text-white hover:bg-app-ok/80 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {proposalLoading ? "Approving..." : "Confirm AI Mapping"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
              {t("live_booking_demands")}
            </h3>
            <p className="text-[10px] text-app-mu mt-0.5">{t("admin_demands_subtitle")}</p>
          </div>
          <div className="flex gap-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateAI}
                disabled={generatingAI}
                className="bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg transition-all shadow-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
              >
                {generatingAI ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Configuring...
                  </span>
                ) : (
                  <>
                    <Ic.Grid size={14} className="text-amber-200" />
                    Generate Auto-Assign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {demandLoading ? (
          <div className="p-10 flex flex-col items-center gap-3 text-app-mu">
            <div className="w-8 h-8 border-2 border-app-bd border-t-app-am rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">{t("loading_demands")}</p>
          </div>
        ) : demands.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-app-mu opacity-50">
            <Ic.Calendar size={32} />
            <p className="text-[11px] font-black uppercase tracking-widest">{t("no_pending_demands")}</p>
            <p className="text-[10px]">{t("no_demands_hint")}</p>
          </div>
        ) : (
          <>
            {/* ── Shift / Time Filter Bar (above demand cards) ── */}
            <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-app-bd bg-app-bg/40">
              <span className="text-[10px] font-black text-app-mu uppercase tracking-widest shrink-0">Filter:</span>

              {/* Shift toggle */}
              <div className="flex bg-app-card2 border border-app-bd rounded-lg overflow-hidden h-[32px]">
                <button
                  onClick={() => setFilterShift("morning")}
                  className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    filterShift === "morning"
                      ? "bg-app-am text-white"
                      : "text-app-mu hover:bg-app-card hover:text-app-tx"
                  }`}
                >
                  Morning
                </button>
                <button
                  onClick={() => { setFilterShift("return"); setFilterTime("3:30"); }}
                  className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest border-l border-app-bd transition-colors ${
                    filterShift === "return"
                      ? "bg-app-am text-white"
                      : "text-app-mu hover:bg-app-card hover:text-app-tx"
                  }`}
                >
                  Return
                </button>
              </div>

              {/* Time dropdown — only if Return is selected */}
              {filterShift === "return" && (
                <select
                  value={filterTime}
                  onChange={e => setFilterTime(e.target.value)}
                  className="custom-select bg-app-card text-app-tx text-[10px] font-bold uppercase tracking-widest border border-app-bd rounded-lg px-3 h-[32px] focus:outline-none focus:border-app-am min-w-[110px]"
                >
                  <option value="3:30">3:30 PM</option>
                  <option value="7:00">7:00 PM</option>
                </select>
              )}
            </div>

            {/* ── Demand Cards Grid ── */}
            {(() => {
              const displayedDemands = demands.filter((d: any) => {
                const shiftMatch = (d.timeSlot || "").toLowerCase() === filterShift;
                const timeMatch =
                  filterShift === "morning" ||
                  (d.specificReturnTime || "").toLowerCase().startsWith(filterTime);
                return shiftMatch && timeMatch;
              });

              if (displayedDemands.length === 0) {
                return (
                  <div className="p-10 flex flex-col items-center gap-3 text-app-mu opacity-60">
                    <Ic.Filter size={28} />
                    <p className="text-[11px] font-black uppercase tracking-widest">
                      No bookings found for the selected shift/time.
                    </p>
                    <p className="text-[10px] text-app-mu2">
                      Try switching to a different shift or time slot.
                    </p>
                  </div>
                );
              }

              return (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedDemands.map((d: any, i: number) => {
              const isHigh   = d.totalStudents > 45;
              const isMedium = d.totalStudents > 30 && !isHigh;
              const slotLabel = d.timeSlot === "Return" && d.specificReturnTime
                ? t("return_slot_prefix", { time: d.specificReturnTime })
                : d.timeSlot === "Morning" ? t("morning") : d.timeSlot === "Return" ? t("return") : d.timeSlot;

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
                        {isHigh ? t("overloaded") : t("high_demand")}
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
                      <span className="text-app-mu">{t("booked")}</span>
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
                        <Ic.Bus size={12} /> {t("requires_buses", { count: Math.ceil(d.totalStudents / 45) })}
                      </div>
                    )}
                  </div>
                </div>
              );
                  })}
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* ── Dispatch Form ── */}
      <div className="bg-app-card rounded-2xl border border-app-bd shadow-sm overflow-hidden p-6 mt-6">
        <h3 className="text-[11px] font-black text-app-tx uppercase tracking-widest mb-4">{t("assign_bus_dispatch")}</h3>
        <form onSubmit={handleDispatch} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Dynamic Bus & Driver Assignments */}
          <div className="lg:col-span-2 space-y-4">
            <label className="block text-[10px] text-app-mu uppercase font-bold mb-2 tracking-widest">{t("assign_buses_drivers")}</label>
            {assignments.map((assignment, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-center gap-3 bg-app-bg border border-app-bd rounded-xl p-3 relative">
                <div className="w-full">
                  <select className="custom-select" 
                    value={assignment.busId}
                    onChange={(e) => {
                      const newAssignments = [...assignments];
                      newAssignments[index].busId = e.target.value;
                      setAssignments(newAssignments);
                    }}
                    className="w-full bg-app-card text-app-tx text-sm border border-app-bd rounded-lg p-2.5 focus:outline-none focus:border-app-am appearance-none cursor-pointer"
                  >
                    <option value="">{t("choose_bus")}</option>
                    {buses.map(b => (
                      <option key={b._id} value={b._id}>{b.busCode} ({t("cap_label")}: {b.capacity || 45})</option>
                    ))}
                  </select>
                </div>
                <div className="w-full">
                  <select className="custom-select" 
                    value={assignment.driverId}
                    onChange={(e) => {
                      const newAssignments = [...assignments];
                      newAssignments[index].driverId = e.target.value;
                      setAssignments(newAssignments);
                    }}
                    className="w-full bg-app-card text-app-tx text-sm border border-app-bd rounded-lg p-2.5 focus:outline-none focus:border-app-am appearance-none cursor-pointer"
                  >
                    <option value="">{t("choose_driver")}</option>
                    {drivers.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newAssignments = assignments.filter((_, i) => i !== index);
                      setAssignments(newAssignments);
                    }}
                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors absolute -right-2 -top-2 sm:static sm:right-auto sm:top-auto bg-app-card sm:bg-transparent border border-app-bd sm:border-none shadow-sm sm:shadow-none"
                    title={t("remove_assignment")}
                  >
                    <Ic.Trash size={16} />
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => setAssignments([...assignments, { busId: "", driverId: "" }])}
              className="text-[11px] font-bold text-app-am uppercase tracking-wider flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-app-am/10 transition-colors mt-2"
            >
              <Ic.Plus size={14} /> {t("add_another_bus")}
            </button>
          </div>

          {/* TimeSlot Selection */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] text-app-mu uppercase font-bold mb-2 tracking-widest">{t("time_slot")}</label>
              <select className="custom-select" 
                value={dispatchForm.timeSlot}
                onChange={(e) => setDispatchForm(prev => ({ ...prev, timeSlot: e.target.value, specificReturnTime: "" }))}
                className="w-full bg-app-bg text-app-tx text-sm border border-app-bd rounded-xl p-3 focus:outline-none focus:border-app-am appearance-none cursor-pointer"
              >
                <option value="Morning">{t("morning")}</option>
                <option value="Return">{t("return")}</option>
              </select>
            </div>
            
            {dispatchForm.timeSlot === "Return" && (
              <div className="flex-1">
                <label className="block text-[10px] text-app-mu uppercase font-bold mb-2 tracking-widest">
                  {t("return_time_label")} <span className="text-red-400">*</span>
                </label>
                <select className="custom-select" 
                  required
                  value={dispatchForm.specificReturnTime}
                  onChange={(e) => setDispatchForm(prev => ({ ...prev, specificReturnTime: e.target.value }))}
                  className={`w-full bg-app-bg text-app-tx text-sm border rounded-xl p-3 focus:outline-none focus:border-app-am appearance-none cursor-pointer ${
                    !dispatchForm.specificReturnTime ? 'border-red-500/40' : 'border-app-bd'
                  }`}
                >
                  <option value="" disabled>{t("select_return_time")}</option>
                  <option value="3:30 PM">3:30 PM</option>
                  <option value="7:00 PM">7:00 PM</option>
                </select>
                {!dispatchForm.specificReturnTime && (
                  <p className="text-[9px] text-red-400 font-bold mt-1 uppercase tracking-widest">{t("return_time_required_note")}</p>
                )}
              </div>
            )}
          </div>

          {/* Multi-select Routes */}
          <div>
            <label className="block text-[10px] text-app-mu uppercase font-bold mb-2 tracking-widest">{t("select_target_routes")}</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-app-bg border border-app-bd rounded-xl no-scrollbar">
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
              {data.routesList.length === 0 && <span className="text-xs text-app-mu">{t("loading_routes")}</span>}
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
              {dispatchLoading ? t("dispatching") : t("assign_bus_notify")}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending Tickets Widget (Occupies 1 column, Today's Trips occupies 2) */}
        <div className="bg-app-card rounded-2xl border border-app-bd shadow-sm overflow-hidden lg:col-span-1 h-fit">
          <div className="flex justify-between items-center px-6 py-4 border-b border-app-bd">
            <h3 className="text-[11px] font-black text-app-tx uppercase tracking-widest">{t("pending_tickets")}</h3>
            <button className="text-[10px] font-black text-app-am hover:underline tracking-wider" onClick={() => window.location.href = '/admin/support'}>{t("view_all")}</button>
          </div>
          <div className="divide-y divide-app-bd">
            {loading ? (
              <div className="p-6 text-center text-xs text-app-mu">{t("loading_tickets")}</div>
            ) : data.tickets.length === 0 ? (
              <div className="p-6 text-center text-xs text-app-mu">{t("no_pending_tickets")}</div>
            ) : (
              data.tickets.map((ticket: any, i) => (
                <div key={ticket._id || i} className="px-6 py-4 hover:bg-app-card2/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[12px] font-bold text-app-tx">{ticket.subject}</p>
                    <button
                      onClick={() => handleResolveTicket(ticket._id)}
                      className="px-2 py-1 bg-app-ok/10 text-app-ok text-[9px] font-black uppercase tracking-widest rounded hover:bg-app-ok hover:text-white transition-colors cursor-pointer"
                    >
                      {t("resolve")}
                    </button>
                  </div>
                  <p className="text-[10px] text-app-mu mb-2 line-clamp-2">{ticket.description}</p>
                  <p className="text-[9px] font-bold text-app-mu2 uppercase">{new Date(ticket.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Today's Trips ── */}
        <div className="bg-app-card rounded-2xl border border-app-bd shadow-sm overflow-hidden lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center px-6 py-4 border-b border-app-bd gap-4">
            <h3 className="text-[11px] font-black text-app-tx uppercase tracking-widest whitespace-nowrap">{t("todays_trips")}</h3>
            <div className="flex flex-wrap items-center gap-2">
              {/* Shift Toggle Buttons */}
              <div className="flex bg-app-bg border border-app-bd rounded-lg overflow-hidden h-[34px]">
                <button onClick={() => { setSelectedShift("Morning"); setSelectedTime(""); }} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${selectedShift === "Morning" ? "bg-app-am text-white" : "text-app-mu hover:bg-app-card2 hover:text-app-tx"}`}>Morning</button>
                <button onClick={() => setSelectedShift("Return")} className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors border-l border-app-bd ${selectedShift === "Return" ? "bg-app-am text-white" : "text-app-mu hover:bg-app-card2 hover:text-app-tx"}`}>Return</button>
              </div>

              {/* Time Dropdown for Return */}
              {selectedShift === "Return" && (
                <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="custom-select bg-app-bg text-app-tx text-[10px] font-bold uppercase tracking-widest border border-app-bd rounded-lg px-3 h-[34px] focus:outline-none focus:border-app-am min-w-[120px]">
                  <option value="">Any Time</option>
                  {returnTimes.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                </select>
              )}

              <select className="custom-select bg-app-bg text-app-tx text-[10px] font-bold uppercase tracking-widest border border-app-bd rounded-lg px-3 h-[34px] focus:outline-none focus:border-app-am min-w-[120px]"
                value={tripFilter.routeId}
                onChange={(e) => setTripFilter(prev => ({ ...prev, routeId: e.target.value }))}
              >
                <option value="">{t("all_routes")}</option>
                {data.routesList.map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1 no-scrollbar">
            <table className="w-full">
              <thead>
                <tr className="border-b border-app-bd bg-app-bg/50">
                  {[t("table_route"), t("bus"), t("table_driver"), t("time"), t("table_students"), t("status")].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-app-mu uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-app-bd">
                {tripsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-xs text-app-mu">{t("loading_trips_table")}</td>
                  </tr>
                ) : (() => {
                  const filteredTrips = assignedTrips.filter(t => {
                    const shiftMatch = t.timeSlot === selectedShift;
                    const timeMatch = !selectedTime || t.specificReturnTime === selectedTime;
                    const routeMatch = !tripFilter.routeId || t.route?._id === tripFilter.routeId;
                    return shiftMatch && timeMatch && routeMatch;
                  });

                  if (filteredTrips.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-app-mu">
                          <div className="flex flex-col items-center gap-3 opacity-60">
                            <Ic.Calendar size={32} />
                            <p className="text-[11px] font-black uppercase tracking-widest">{t("no_trips_match_filters")}</p>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return filteredTrips.map((trip: any, i: number) => (
                    <tr key={i} className="hover:bg-app-card2/40 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 text-[12px] font-bold text-app-tx">
                          <span className="text-app-am"><Ic.Pin size={14} /></span>
                          {trip.route?.name || t("unknown_route")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[12px] font-medium text-app-tx">{trip.busNumber || trip.bus?.busCode || t("unassigned")}</td>
                      <td className="px-6 py-4 text-[12px] font-medium text-app-tx">{trip.driverName || t("unassigned")}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-[12px] text-app-mu">
                          <Ic.Clock size={12} /> {trip.timeSlot} {trip.specificReturnTime ? `(${trip.specificReturnTime})` : ""}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[12px] font-bold text-app-tx">{trip.studentsCount || trip.students?.length || 0}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusStyle.active}`}>
                          {t("assigned")}
                        </span>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;