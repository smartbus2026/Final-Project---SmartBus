import React from 'react';
import { Ic } from '../icons';
import { useDashboard } from '../hooks/useDashboard';

const AdminDashboard: React.FC = () => {
  const { totalStudents,  loading } = useDashboard();

  const stats = [
    { 
      title: "Total Students", 
      value: loading ? "..." : totalStudents.toLocaleString(), 
      trend: "+12% from last week", 
      icon: <Ic.Users /> 
    },
    { 
      title: "Active Trips", 
      value: "8", 
      trend: "2 buses en route", 
      icon: <Ic.Bus /> 
    },
    { 
      title: "Occupancy Rate", 
      value: "84%", 
      trend: "+5% from yesterday", 
      icon: <Ic.Chart /> 
    },
    { 
      title: "Today's Registrations", 
      value: "342", 
      trend: "Window closes at 2:00 PM", 
      icon: <Ic.Calendar /> 
    },
  ];

  const trips = [
    { id: "T-001", route: "Aqaleem → Stadium", driver: "Ahmad Hassan", time: "7:30 AM", seats: "32/40", status: "active" },
    { id: "T-002", route: "Seil → Stadium",    driver: "Omar Khalil",   time: "7:45 AM", seats: "28/40", status: "active" },
    { id: "T-003", route: "Stadium → Aqaleem", driver: "Ali Mahmoud",   time: "3:30 PM", seats: "35/40", status: "pending" },
    { id: "T-004", route: "Stadium → Seil",    driver: "Yusuf Nasser",  time: "3:30 PM", seats: "22/40", status: "completed" },
    { id: "T-005", route: "Aqaleem → Stadium", driver: "Khaled Saeed",  time: "7:00 PM", seats: "18/40", status: "completed" },
  ];

  const alerts = [
    { title: "Registration window closes in 2 hours", time: "10 min ago",  color: "text-app-am" },
    { title: "Bus #3 arrived at Stadium",             time: "25 min ago",  color: "text-app-ok" },
    { title: "New driver registration: Omar K.",      time: "1 hour ago",  color: "text-app-info" },
  ];

  const statusStyle: Record<string, string> = {
    active:    "bg-app-ok/10 text-app-ok border border-app-ok/20",
    pending:   "bg-app-bd text-app-mu border border-app-bd",
    completed: "bg-app-am/10 text-app-am border border-app-am/20",
  };

  const statusLabel: Record<string, string> = {
    active:    "Active",
    pending:   "Not Started",
    completed: "Completed",
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

      {/* ── Live Tracking + Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Live Tracking */}
        <div className="lg:col-span-2 bg-app-card rounded-2xl border border-app-bd overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-6 py-4 border-b border-app-bd">
            <h3 className="text-[11px] font-black text-app-tx uppercase tracking-widest">Live Tracking</h3>
            <button className="text-[10px] font-black text-app-am hover:underline tracking-wider flex items-center gap-1">
              View Full Map <span className="text-[10px]">↗</span>
            </button>
          </div>
          <div className="relative h-[300px] bg-app-card2">
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            {/* Live badge */}
            <div className="absolute top-5 left-5 bg-app-card/90 backdrop-blur-sm border border-app-ok/30 px-4 py-1.5 rounded-xl flex items-center gap-2 z-10 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-app-ok animate-ping" />
              <span className="text-[9px] font-black text-app-ok tracking-widest uppercase">Live</span>
            </div>

            {/* SVG route */}
            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 800 300">
              <path d="M80,200 Q250,60 450,180 T750,120" fill="none" stroke="var(--am)" strokeWidth="1.5" strokeDasharray="8 4" />
              <circle cx="250" cy="108" r="5" fill="var(--am)" className="animate-pulse" />
              <circle cx="450" cy="180" r="4" fill="var(--am)" opacity="0.5" />
              <text x="265" y="104" fill="var(--tx)" fontSize="9" fontWeight="bold" opacity="0.5">PICKUP POINT</text>
              <text x="460" y="176" fill="var(--tx)" fontSize="9" fontWeight="bold" opacity="0.5">PICKUP POINT</text>
            </svg>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-app-card rounded-2xl border border-app-bd shadow-sm overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-app-bd">
            <h3 className="text-[11px] font-black text-app-tx uppercase tracking-widest">Alerts</h3>
            <button className="text-[10px] font-black text-app-am hover:underline tracking-wider">View All</button>
          </div>
          <div className="divide-y divide-app-bd">
            {alerts.map((a, i) => (
              <div key={i} className="px-6 py-4 hover:bg-app-card2/50 transition-colors cursor-pointer">
                <p className="text-[12px] font-bold text-app-tx mb-1">{a.title}</p>
                <p className="text-[10px] text-app-mu">{a.time}</p>
              </div>
            ))}
          </div>

          {/* Registration Window */}
          <div className="mx-4 mb-4 mt-2 bg-app-am/10 border border-app-am/20 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-app-tx uppercase tracking-wider">Registration Window</span>
              <span className="text-[9px] font-black text-app-ok">Open</span>
            </div>
            <p className="text-[10px] text-app-mu mb-3">12:00 AM → 2:00 PM</p>
            <div className="h-1.5 w-full bg-app-bd rounded-full overflow-hidden mb-2">
              <div className="h-full bg-app-am rounded-full w-[66%] transition-all duration-1000" />
            </div>
            <p className="text-[10px] text-app-mu">342 of ~520 expected registrations</p>
          </div>
        </div>
      </div>

      {/* ── Today's Trips ── */}
      <div className="bg-app-card rounded-2xl border border-app-bd shadow-sm overflow-hidden">
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
              {trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-app-card2/40 transition-colors group">
                  <td className="px-6 py-4 text-[12px] font-black text-app-tx font-mono">{trip.id}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-[12px] font-medium text-app-mu">
                      <span className="text-app-am"><Ic.Pin /></span>
                      {trip.route}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[12px] font-medium text-app-tx">{trip.driver}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-[12px] text-app-mu">
                      <Ic.Clock size={12} /> {trip.time}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[12px] font-bold text-app-tx">{trip.seats}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusStyle[trip.status]}`}>
                      {statusLabel[trip.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;