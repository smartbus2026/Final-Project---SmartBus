import React, { useState, useEffect } from 'react';
import { Ic } from '../icons';
import Api from '../services/Api';

interface StatCard {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

interface DashboardData {
  totalUsers: number;
  totalTrips: number;
  activeTrips: number;
  totalBookings: number;
  utilizationRate: number;
  recentActivity: any[];
}

const AdminReport: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await Api.get('/reports/dashboard-stats');
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex-1 bg-app-bg text-app-tx p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-app-bd border-t-app-am rounded-full animate-spin"></div>
          <div className="animate-pulse text-app-mu font-black uppercase tracking-widest text-[10px]">Loading Analytics Data...</div>
        </div>
      </div>
    );
  }

  const stats: StatCard[] = [
    { title: "Total Students", value: data.totalUsers.toString(), trend: "Registered users", isPositive: true, icon: <Ic.Users /> },
    { title: "Active Trips", value: data.activeTrips.toString(), trend: "Buses currently en route", isPositive: true, icon: <Ic.Bus /> },
    { title: "Occupancy Rate", value: `${data.utilizationRate}%`, trend: "Average utilization", isPositive: true, icon: <Ic.Chart /> },
    { title: "Total Bookings", value: data.totalBookings.toString(), trend: "Successful reservations", isPositive: true, icon: <Ic.Check /> },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="bg-app-card rounded-2xl p-6 border border-app-bd shadow-sm hover:border-app-am/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-app-mu uppercase tracking-widest">{stat.title}</p>
              <div className="w-10 h-10 rounded-xl bg-app-am/10 flex items-center justify-center text-app-am">
                {stat.icon}
              </div>
            </div>
            <h3 className="text-3xl font-black text-app-tx mb-1">{stat.value}</h3>
            <p className={`text-[10px] font-bold ${stat.isPositive ? 'text-app-ok' : 'text-app-mu'}`}>
              {stat.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Middle Section: Tracking & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Simulated Live Map */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-app-tx uppercase tracking-widest text-xs">Live Tracking</h3>
            <span className="text-[10px] text-app-am font-bold cursor-pointer hover:underline">FULL SCREEN ↗</span>
          </div>
          <div className="flex-1 min-h-[350px] rounded-2xl border border-app-bd bg-app-card2 relative overflow-hidden shadow-inner">
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            <div className="absolute top-5 left-5 bg-app-card backdrop-blur-md border border-app-ok/20 px-4 py-1.5 rounded-full flex items-center gap-2 z-10">
              <span className="w-2 h-2 rounded-full bg-app-ok animate-pulse" />
              <span className="text-[10px] font-black text-app-ok tracking-tighter">NETWORK LIVE</span>
            </div>
            <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 800 400">
              <path d="M100,200 Q300,50 500,200 T800,150" fill="none" stroke="var(--am)" strokeWidth="2" strokeDasharray="6" />
              <circle cx="300" cy="95" r="5" fill="var(--am)" className="animate-bounce" />
              <text x="315" y="100" fill="currentColor" fontSize="10" className="font-bold opacity-50">BUS #04</text>
            </svg>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="space-y-4 flex flex-col">
          <h3 className="font-bold text-app-tx uppercase tracking-widest text-xs">System Alerts</h3>
          <div className="space-y-3 flex-1">
            {["Live tracking active", `Network processing ${data.activeTrips} active fleets`, "All systems normal"].map((alert, i) => (
              <div
                key={i}
                className="bg-app-card border border-app-bd rounded-2xl p-4 hover:translate-x-1 transition-transform cursor-pointer hover:border-app-am/30"
              >
                <div className="flex items-center gap-2 mb-1 text-app-am">
                  <Ic.Bell />
                  <h4 className="text-xs font-bold text-app-tx">{alert}</h4>
                </div>
                <p className="text-[10px] text-app-mu font-medium">{i * 15 + 2} min ago</p>
              </div>
            ))}

            <div className="bg-app-am rounded-2xl p-5 mt-auto border border-app-am/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-black uppercase tracking-tighter">Registration Progress</span>
                <span className="text-[10px] font-bold text-black/70">OPEN</span>
              </div>
              <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min((data.totalBookings / 500) * 100, 100)}%` }} />
              </div>
              <p className="text-[9px] mt-3 text-black/60 font-medium">{data.totalBookings} / 500 EXPECTED REGISTRATIONS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trips Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-app-tx uppercase tracking-widest text-xs">Recent Bookings Activity</h3>
          <button className="text-[10px] font-bold bg-app-card border border-app-bd px-4 py-2 rounded-xl hover:border-app-am/30 transition-colors flex items-center gap-2 text-app-mu hover:text-app-tx">
            <Ic.Download /> EXPORT DATA
          </button>
        </div>

        <div className="bg-app-card border border-app-bd rounded-2xl overflow-hidden shadow-sm">
          {data.recentActivity.length === 0 ? (
            <div className="p-10 text-center text-app-mu font-bold uppercase tracking-widest text-[10px]">No recent bookings found</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-app-card2 border-b border-app-bd text-[10px] font-black text-app-mu uppercase tracking-widest">
                  <th className="p-5">Student</th>
                  <th className="p-5">Route</th>
                  <th className="p-5">Bus Number</th>
                  <th className="p-5">Time Slot</th>
                  <th className="p-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {data.recentActivity.map((booking: any) => (
                  <tr key={booking._id} className="border-b border-app-bd hover:bg-app-card2/50 transition-colors">
                    <td className="p-5 font-black text-app-tx">{booking.user?.name || 'Unknown Student'}</td>
                    <td className="p-5 text-app-mu font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="text-app-am"><Ic.Pin /></span>
                        {booking.trip?.route?.name || 'Unknown Route'}
                      </span>
                    </td>
                    <td className="p-5 text-app-mu">{booking.trip?.bus_number || 'N/A'}</td>
                    <td className="p-5 font-bold text-app-am uppercase">{booking.trip?.time_slot || 'N/A'}</td>
                    <td className="p-5 text-right">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                        booking.status === 'active'
                          ? 'bg-app-ok/10 text-app-ok border border-app-ok/20'
                          : booking.status === 'cancelled'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-app-card2 text-app-mu border border-app-bd'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-10">
        <div className="bg-app-card rounded-2xl p-6 border border-app-bd">
          <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest mb-3">System Overview</p>
          <div className="space-y-4">
            {[
              { label: 'Total Planned Trips', value: data.totalTrips.toString(), color: 'text-app-tx' },
              { label: 'Active/Scheduled', value: data.activeTrips.toString(), color: 'text-app-ok' },
              { label: 'Total User Accounts', value: data.totalUsers.toString(), color: 'text-app-am' },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center border-b border-app-bd/50 pb-2 last:border-0 last:pb-0">
                <span className="text-xs text-app-mu uppercase tracking-widest">{row.label}</span>
                <span className={`text-sm font-black ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-app-card rounded-2xl p-6 border border-app-bd">
          <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest mb-3">Fleet Utilization</p>
          <div className="space-y-3 h-full flex flex-col justify-center">
            <div className="text-center mb-2">
              <h4 className="text-4xl font-black text-app-am">{data.utilizationRate}%</h4>
              <p className="text-[9px] uppercase tracking-widest text-app-mu mt-1">Average Network Occupancy</p>
            </div>
            <div className="h-2 w-full bg-app-card2 rounded-full overflow-hidden">
              <div
                className="h-full bg-app-am rounded-full transition-all duration-1000"
                style={{ width: `${data.utilizationRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-app-card rounded-2xl p-6 border border-app-bd">
          <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest mb-3">Registration Metrics</p>
          <div className="space-y-2 mt-4">
            <div className="flex justify-between">
              <span className="text-xs text-app-mu uppercase tracking-widest">Bookings</span>
              <span className="text-xs font-black text-app-tx">{data.totalBookings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-app-mu uppercase tracking-widest">Expected</span>
              <span className="text-xs font-black text-app-tx">500</span>
            </div>
            <div className="h-1.5 w-full bg-app-card2 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-app-ok rounded-full transition-all duration-1000" style={{ width: `${Math.min((data.totalBookings / 500) * 100, 100)}%` }} />
            </div>
            <p className="text-[9px] text-app-mu font-medium text-right mt-2 uppercase tracking-widest">
              {Math.min(Math.round((data.totalBookings / 500) * 100), 100)}% TARGET REACHED
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminReport;