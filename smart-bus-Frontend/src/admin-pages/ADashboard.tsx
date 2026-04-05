import React from 'react';
import { Ic } from '../icons';

interface StatCard {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

interface Trip {
  id: string;
  route: string;
  driver: string;
  time: string;
  seats: string;
  status: 'Active' | 'Not Started' | 'Completed';
}

const AdminDashboard: React.FC = () => {

  const stats: StatCard[] = [
    { title: "Total Students",        value: "1,247", trend: "+12% from last week",      isPositive: true,  icon: <Ic.Users /> },
    { title: "Active Trips",          value: "8",     trend: "2 buses en route",          isPositive: true,  icon: <Ic.Bus /> },
    { title: "Occupancy Rate",        value: "84%",   trend: "+5% from yesterday",        isPositive: true,  icon: <Ic.Chart /> },
    { title: "Today's Registrations", value: "342",   trend: "Window closes at 2:00 PM", isPositive: false, icon: <Ic.Check /> },
  ];

  const trips: Trip[] = [
    { id: "T-001", route: "Aqaleem → Stadium", driver: "Ahmad Hassan", time: "7:30 AM", seats: "32/40", status: "Active" },
    { id: "T-002", route: "Seil → Stadium",    driver: "Omar Khalil",  time: "7:45 AM", seats: "28/40", status: "Active" },
    { id: "T-003", route: "Stadium → Aqaleem", driver: "Ali Mahmoud",  time: "3:30 PM", seats: "35/40", status: "Not Started" },
    { id: "T-004", route: "Stadium → Seil",    driver: "Yusuf Nasser", time: "3:30 PM", seats: "22/40", status: "Completed" },
  ];

  return (
    <div className="p-8 space-y-8">

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
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="absolute top-5 left-5 bg-app-card backdrop-blur-md border border-app-ok/20 px-4 py-1.5 rounded-full flex items-center gap-2 z-10">
              <span className="w-2 h-2 rounded-full bg-app-ok animate-pulse"></span>
              <span className="text-[10px] font-black text-app-ok tracking-tighter">NETWORK LIVE</span>
            </div>

            <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 800 400">
              <path d="M100,200 Q300,50 500,200 T800,150" fill="none" stroke="var(--am)" strokeWidth="2" strokeDasharray="6" />
              <circle cx="300" cy="95" r="5" fill="var(--am)" className="animate-bounce" />
              <text x="315" y="100" fill="currentColor" fontSize="10" className="font-bold opacity-50">BUS #04</text>
            </svg>
          </div>
        </div>

        {/* Alerts Window */}
        <div className="space-y-4 flex flex-col">
          <h3 className="font-bold text-app-tx uppercase tracking-widest text-xs">System Alerts</h3>
          <div className="space-y-3 flex-1">
            {["Registration closes in 2h", "Bus #3 arrived at Stadium", "New driver: Omar K."].map((alert, i) => (
              <div key={i} className="bg-app-card border border-app-bd rounded-2xl p-4 hover:translate-x-1 transition-transform cursor-pointer hover:border-app-am/30">
                <div className="flex items-center gap-2 mb-1 text-app-am">
                  <Ic.Bell />
                  <h4 className="text-xs font-bold text-app-tx">{alert}</h4>
                </div>
                <p className="text-[10px] text-app-mu font-medium">{i * 15 + 10} min ago</p>
              </div>
            ))}

            <div className="bg-app-am rounded-2xl p-5 mt-auto border border-app-am/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-black uppercase tracking-tighter">Window Progress</span>
                <span className="text-[10px] font-bold text-black/70">OPEN</span>
              </div>
              <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full w-[75%]" />
              </div>
              <p className="text-[9px] mt-3 text-black/60 font-medium">342 / 520 EXPECTED REGISTRATIONS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trips Table */}
      <div className="space-y-4 pb-10">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-app-tx uppercase tracking-widest text-xs">Today's Active Trips</h3>
          <button className="text-[10px] font-bold bg-app-card border border-app-bd px-4 py-2 rounded-xl hover:border-app-am/30 transition-colors flex items-center gap-2 text-app-mu hover:text-app-tx">
            <Ic.Download /> EXPORT DATA
          </button>
        </div>

        <div className="bg-app-card border border-app-bd rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-app-card2 border-b border-app-bd text-[10px] font-black text-app-mu uppercase tracking-widest">
                <th className="p-5">Trip ID</th>
                <th className="p-5">Route</th>
                <th className="p-5">Driver</th>
                <th className="p-5">Seats</th>
                <th className="p-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {trips.map((trip) => (
                <tr key={trip.id} className="border-b border-app-bd hover:bg-app-card2/50 transition-colors">
                  <td className="p-5 font-black text-app-tx">{trip.id}</td>
                  <td className="p-5 text-app-mu font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="text-app-am"><Ic.Pin /></span>
                      {trip.route}
                    </span>
                  </td>
                  <td className="p-5 text-app-mu">{trip.driver}</td>
                  <td className="p-5 font-bold text-app-am">{trip.seats}</td>
                  <td className="p-5 text-right">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                      trip.status === 'Active'    ? 'bg-app-ok/10 text-app-ok border border-app-ok/20' :
                      trip.status === 'Completed' ? 'bg-app-am/10 text-app-am border border-app-am/20' :
                      'bg-app-card2 text-app-mu border border-app-bd'
                    }`}>
                      {trip.status}
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