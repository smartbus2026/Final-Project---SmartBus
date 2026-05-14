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
    tickets: [] as any[]
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, tripsRes, routesRes, bookingsRes, supportRes] = await Promise.all([
          Api.get('/users').catch(() => ({ data: [] })),
          Api.get('/trips').catch(() => ({ data: { data: [] } })),
          Api.get('/routes').catch(() => ({ data: { data: [] } })),
          Api.get('/bookings').catch(() => ({ data: { data: [] } })),
          Api.get('/support').catch(() => ({ data: { data: { tickets: [] } } }))
        ]);

        const users = usersRes.data || [];
        const trips = tripsRes.data?.data || tripsRes.data || [];
        const routes = routesRes.data?.data || routesRes.data || [];
        const bookings = bookingsRes.data?.data || bookingsRes.data || [];
        const supportTickets = supportRes.data?.data?.tickets || supportRes.data?.tickets || [];

        const studentCount = Array.isArray(users) ? users.filter((u: any) => u.role === 'student').length : 0;
        const activeTripsList = Array.isArray(trips) ? trips.filter((t: any) => t.status === 'active') : [];
        
        // Filter for today's trips for the table
        const today = new Date();
        today.setHours(0,0,0,0);
        const todaysTrips = Array.isArray(trips) ? trips.filter((t: any) => {
          if (!t.date) return false;
          const d = new Date(t.date);
          d.setHours(0,0,0,0);
          return d.getTime() === today.getTime();
        }) : [];

        const pendingTickets = supportTickets.filter((t: any) => t.status === 'open' || t.status === 'pending');

        setData({
          totalStudents: studentCount,
          activeTripsCount: activeTripsList.length,
          totalRoutes: Array.isArray(routes) ? routes.length : 0,
          totalBookings: Array.isArray(bookings) ? bookings.length : 0,
          trips: todaysTrips.slice(0, 5),
          tickets: pendingTickets.slice(0, 5)
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

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
    active:    "bg-app-ok/10 text-app-ok border border-app-ok/20",
    pending:   "bg-app-bd text-app-mu border border-app-bd",
    completed: "bg-app-am/10 text-app-am border border-app-am/20",
    cancelled: "bg-red-500/10 text-red-500 border border-red-500/20",
  };

  const statusLabel: Record<string, string> = {
    active:    "Active",
    pending:   "Not Started",
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending Tickets Widget (Occupies 1 column, Today's Trips occupies 2) */}
        <div className="bg-app-card rounded-2xl border border-app-bd shadow-sm overflow-hidden lg:col-span-1 h-fit">
          <div className="flex justify-between items-center px-6 py-4 border-b border-app-bd">
            <h3 className="text-[11px] font-black text-app-tx uppercase tracking-widest">Pending Tickets</h3>
            <button className="text-[10px] font-black text-app-am hover:underline tracking-wider" onClick={() => window.location.href='/admin/support'}>View All</button>
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