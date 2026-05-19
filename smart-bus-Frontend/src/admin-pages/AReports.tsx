import React, { useState, useEffect, useCallback } from 'react';
import { Ic } from '../icons';
import Api from '../services/Api';

interface DashboardData {
  totalUsers: number;
  totalTrips: number;
  activeTrips: number;
  totalBookings: number;
  utilizationRate: number;
  recentActivity: any[];
}

// ── Attendance Report Panel ──────────────────────────────────────────────────
const AttendanceReportPanel: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState({ date: today, routeId: '', busId: '', timeSlot: '', specificReturnTime: '' });
  const [routes, setRoutes]   = useState<any[]>([]);
  const [buses, setBuses]     = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats]     = useState({ completed: 0, missed: 0, total: 0, rate: 0 });
  const [loading, setLoading] = useState(false);

  // Load dropdown options once
  useEffect(() => {
    Promise.all([
      Api.get('/routes').catch(() => ({ data: { data: [] } })),
      Api.get('/tracking/buses').catch(() => ({ data: { data: { buses: [] } } }))
    ]).then(([rRes, bRes]) => {
      setRoutes(rRes.data?.data || []);
      setBuses(bRes.data?.data?.buses || bRes.data?.buses || []);
    });
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date)               params.set('date', filters.date);
      if (filters.routeId)            params.set('routeId', filters.routeId);
      if (filters.busId)              params.set('busId', filters.busId);
      if (filters.timeSlot)           params.set('timeSlot', filters.timeSlot);
      if (filters.timeSlot === 'Return' && filters.specificReturnTime)
        params.set('specificReturnTime', filters.specificReturnTime);

      const res = await Api.get(`/reports/attendance?${params.toString()}`);
      setBookings(res.data?.data?.bookings || []);
      setStats(res.data?.data?.stats || { completed: 0, missed: 0, total: 0, rate: 0 });
    } catch (err) {
      console.error('Failed to fetch attendance report', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const selectClass = 'bg-app-bg text-app-tx text-[10px] font-bold uppercase tracking-widest border border-app-bd rounded-xl px-3 py-2 focus:outline-none focus:border-app-am transition-colors';

  return (
    <div className="mt-6 bg-app-card rounded-2xl border border-app-bd overflow-hidden shadow-sm">

      {/* Panel Header */}
      <div className="px-6 py-4 border-b border-app-bd flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-app-card2/50">
        <div>
          <h2 className="text-[13px] font-black uppercase tracking-widest text-app-tx">Attendance Report</h2>
          <p className="text-[10px] text-app-mu mt-0.5">Filter by date, route, bus, or time slot — updates automatically</p>
        </div>
        <span className="text-[10px] font-bold text-app-mu uppercase tracking-widest">
          {loading ? 'Loading...' : `${stats.total} records found`}
        </span>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-4 border-b border-app-bd grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-app-mu">Date</label>
          <div className="flex items-center gap-2 bg-app-bg border border-app-bd rounded-xl px-3 py-2">
            <Ic.Calendar size={12} className="text-app-am shrink-0" />
            <input
              type="date"
              value={filters.date}
              onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
              className="bg-transparent text-app-tx text-[11px] font-bold focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Route */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-app-mu">Route</label>
          <select
            value={filters.routeId}
            onChange={e => setFilters(f => ({ ...f, routeId: e.target.value }))}
            className={selectClass}
          >
            <option value="">All Routes</option>
            {routes.map((r: any) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </div>

        {/* Bus */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-app-mu">Bus</label>
          <select
            value={filters.busId}
            onChange={e => setFilters(f => ({ ...f, busId: e.target.value }))}
            className={selectClass}
          >
            <option value="">All Buses</option>
            {buses.map((b: any) => <option key={b._id} value={b._id}>{b.busCode}</option>)}
          </select>
        </div>

        {/* TimeSlot */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-app-mu">Time Slot</label>
          <select
            value={filters.timeSlot}
            onChange={e => setFilters(f => ({ ...f, timeSlot: e.target.value, specificReturnTime: '' }))}
            className={selectClass}
          >
            <option value="">All Slots</option>
            <option value="Morning">Morning</option>
            <option value="Return">Return</option>
          </select>
        </div>

        {/* Specific Return Time — conditional */}
        {filters.timeSlot === 'Return' && (
          <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">
            <label className="text-[9px] font-black uppercase tracking-widest text-app-mu">Return Time</label>
            <div className="flex gap-2">
              {['3:30 PM', '7:00 PM'].map(t => (
                <button
                  key={t}
                  onClick={() => setFilters(f => ({ ...f, specificReturnTime: f.specificReturnTime === t ? '' : t }))}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    filters.specificReturnTime === t
                      ? 'bg-app-am text-white border-app-am shadow-md shadow-app-am/20'
                      : 'bg-app-bg border-app-bd text-app-mu hover:border-app-am/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4 border-b border-app-bd bg-app-bg/30">
        {[
          { label: 'Total Records', value: stats.total,     color: 'text-app-mu',  bg: 'bg-app-card' },
          { label: 'Completed',     value: stats.completed, color: 'text-app-ok',  bg: 'bg-green-500/10' },
          { label: 'Missed',        value: stats.missed,    color: 'text-app-err', bg: 'bg-red-500/10' },
          { label: 'Attend. Rate',  value: `${stats.rate}%`, color: stats.rate >= 75 ? 'text-app-ok' : 'text-app-err', bg: 'bg-app-card' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-5 border border-app-bd shadow-sm ${s.bg}`}>
            <p className="text-[9px] font-black uppercase tracking-widest text-app-mu mb-1.5">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-4 border-app-bd border-t-app-am rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-app-mu animate-pulse">Syncing Database...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
          <Ic.Users size={40} className="text-app-mu" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-app-mu">No records match your filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-app-bd bg-app-bg/50">
                {['Student', 'Route', 'Bus', 'Date', 'Time Slot', 'Status'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-app-mu">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-app-bd">
              {bookings.map((b: any) => (
                <tr key={b._id} className={`hover:bg-app-card2/40 transition-colors ${
                  b.attendanceStatus === 'completed' ? 'border-l-[3px] border-app-ok' : 'border-l-[3px] border-app-err'
                }`}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-app-tx text-[12px]">{b.user?.name || '—'}</div>
                    <div className="text-[10px] text-app-mu">{b.user?.email || '—'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-[12px] font-medium text-app-mu">
                      <Ic.Pin size={12} className="text-app-am" />{b.route?.name || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[12px] font-bold text-app-tx">{b.busId?.busCode || '—'}</td>
                  <td className="px-6 py-4 text-[11px] text-app-mu">
                    {new Date(b.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-[11px] text-app-mu uppercase">
                    {b.timeSlot} {b.specificReturnTime ? `(${b.specificReturnTime})` : ''}
                  </td>
                  <td className="px-6 py-4">
                    {b.attendanceStatus === 'completed' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-green-500/10 text-app-ok border border-green-500/20 shadow-sm">
                        <Ic.Check size={10} /> Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-red-500/10 text-app-err border border-red-500/20 shadow-sm">
                        <Ic.X size={10} /> Missed
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
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const AdminReport: React.FC = () => {
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await Api.get('/reports/dashboard-stats');
        setDashData(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading || !dashData) {
    return (
      <div className="flex-1 bg-app-bg text-app-tx p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-app-bd border-t-app-am rounded-full animate-spin" />
          <div className="animate-pulse text-app-mu font-black uppercase tracking-widest text-[10px]">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">

      {/* ── Dashboard Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Students",  value: dashData.totalUsers,    icon: <Ic.Users />,  color: "text-app-am" },
          { title: "Total Trips",     value: dashData.totalTrips,    icon: <Ic.Pin />,    color: "text-app-ok" },
          { title: "Active Trips",    value: dashData.activeTrips,   icon: <Ic.Clock />,  color: "text-app-tx" },
          { title: "Total Bookings",  value: dashData.totalBookings, icon: <Ic.Check />,  color: "text-app-mu" },
        ].map((s, i) => (
          <div key={i} className="bg-app-card rounded-2xl p-5 border border-app-bd shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-app-mu">{s.title}</span>
              <div className={`text-app-mu/50`}>{s.icon}</div>
            </div>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Attendance Report Panel with Filters ── */}
      <AttendanceReportPanel />

    </div>
  );
};

export default AdminReport;