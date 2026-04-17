import React from 'react';
import { Ic } from '../icons';
import { useDashboard } from '../hooks/useDashboard';

const AdminDashboard: React.FC = () => {
  const { totalStudents, totalRoutes, loading } = useDashboard();

  // Stats array mapped to real-time database values
  const stats = [
    { 
      title: "Total Students", 
      value: loading ? "..." : totalStudents.toLocaleString(), 
      trend: "+12% from last week", 
      isPositive: true, 
      icon: <Ic.Users /> 
    },
    { 
      title: "Active Routes", 
      value: loading ? "..." : totalRoutes.toString(), 
      trend: "Fully operational", 
      isPositive: true, 
      icon: <Ic.Bus /> 
    },
    { 
      title: "Occupancy Rate", 
      value: "84%", 
      trend: "+5% from yesterday", 
      isPositive: true, 
      icon: <Ic.Chart /> 
    },
    { 
      title: "System Status", 
      value: "Stable", 
      trend: "All systems online", 
      isPositive: true, 
      icon: <Ic.Check /> 
    },
  ];

  return (
    <div className="p-8 space-y-8 bg-app-bg text-app-tx min-h-screen transition-colors duration-500">

      {/* Stats Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="bg-app-card rounded-[2rem] p-7 border border-app-bd shadow-sm hover:border-app-am/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-app-mu uppercase tracking-[0.2em]">{stat.title}</p>
              <div className="w-12 h-12 rounded-2xl bg-app-am-g border border-app-am/10 flex items-center justify-center text-app-am transition-transform group-hover:scale-110">
                {stat.icon}
              </div>
            </div>
            <h3 className="text-4xl font-black text-app-tx mb-1 tracking-tighter italic">
              {stat.value}
            </h3>
            <p className={`text-[9px] font-black uppercase tracking-widest ${stat.isPositive ? 'text-app-ok' : 'text-app-mu'}`}>
              {stat.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Analytics & Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Live Satellite Tracking Module */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-black text-app-tx uppercase tracking-[0.3em] text-[10px]">Fleet Live Tracking</h3>
            <span className="text-[9px] text-app-am font-black cursor-pointer hover:underline tracking-widest italic">NETWORK_SATELLITE ↗</span>
          </div>
          <div className="flex-1 min-h-[400px] rounded-[3rem] border border-app-bd bg-app-card2 relative overflow-hidden shadow-2xl">
            {/* Map Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07]"
              style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

            {/* Network Live Indicator */}
            <div className="absolute top-8 left-8 bg-app-card/80 backdrop-blur-xl border border-app-ok/30 px-5 py-2 rounded-2xl flex items-center gap-3 z-10 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-app-ok animate-ping"></span>
              <span className="text-[9px] font-black text-app-ok tracking-[0.2em] uppercase">Aswan_Fleet_Active</span>
            </div>

            {/* Simulated Vector Path */}
            <svg className="absolute inset-0 w-full h-full opacity-20 dark:opacity-40" viewBox="0 0 800 400">
              <path d="M100,200 Q300,50 500,200 T800,150" fill="none" stroke="var(--am)" strokeWidth="1" strokeDasharray="10 5" />
              <circle cx="300" cy="95" r="4" fill="var(--am)" className="animate-pulse" />
              <text x="315" y="100" fill="var(--tx)" fontSize="9" className="font-black opacity-30 italic uppercase">Route_Alpha_04</text>
            </svg>
          </div>
        </div>

        {/* Alerts & System Intelligence Module */}
        <div className="space-y-6 flex flex-col">
          <h3 className="font-black text-app-tx uppercase tracking-[0.3em] text-[10px] px-2">System Intelligence</h3>
          <div className="space-y-4 flex-1">
            {[
              { t: "Registration closing", m: "Window closes in 2h", c: "app-am" },
              { t: "Fleet Update", m: "Bus #3 reached Stadium", c: "app-ok" },
              { t: "New User", m: "Student ID #924 verified", c: "app-info" }
            ].map((alert, i) => (
              <div key={i} className="bg-app-card border border-app-bd rounded-[2rem] p-6 hover:translate-x-2 transition-all cursor-pointer group hover:border-app-am/40 shadow-sm">
                <div className={`flex items-center gap-3 mb-2 text-${alert.c}`}>
                  <Ic.Bell size={16} />
                  <h4 className="text-[10px] font-black text-app-tx uppercase tracking-wider">{alert.t}</h4>
                </div>
                <p className="text-[11px] text-app-mu font-bold italic mb-2">{alert.m}</p>
                <p className="text-[8px] text-app-mu2 font-black uppercase">{i * 12 + 5} MIN AGO</p>
              </div>
            ))}

            {/* Operation Progress Insight */}
            <div className="bg-app-am rounded-[2.5rem] p-8 mt-auto border border-app-am/20 shadow-xl shadow-app-am/10 text-white dark:text-black transition-all">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Operational Load</span>
                <span className="text-[8px] font-black px-2 py-1 bg-black/10 dark:bg-white/20 rounded-lg">OPTIMIZED</span>
              </div>
              <div className="h-2 w-full bg-black/10 dark:bg-white/20 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-white dark:bg-black rounded-full w-[78%] transition-all duration-1000" />
              </div>
              <p className="text-[10px] font-black italic uppercase tracking-tighter">
                {totalStudents} Verified Students On-Board
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Logging Table Section */}
      <div className="space-y-6 pb-20">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-black text-app-tx uppercase tracking-[0.3em] text-[10px]">Active Fleet Log</h3>
          <button className="text-[9px] font-black bg-app-card border border-app-bd px-6 py-3 rounded-2xl hover:border-app-am transition-all flex items-center gap-3 text-app-mu hover:text-app-tx shadow-sm">
            <Ic.Download size={14} /> EXPORT_DATA_LOG
          </button>
        </div>

        <div className="bg-app-card border border-app-bd rounded-[3rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-app-bg2 border-b border-app-bd text-[9px] font-black text-app-mu uppercase tracking-[0.2em]">
                <th className="p-8">Fleet_ID</th>
                <th className="p-8">Deployment_Route</th>
                <th className="p-8">Occupancy</th>
                <th className="p-8 text-right">Operational_Status</th>
              </tr>
            </thead>
            <tbody className="text-[11px] font-black uppercase italic">
              <tr className="border-b border-app-bd2 hover:bg-app-am-g transition-colors">
                <td className="p-8 text-app-tx tracking-widest font-mono">T-ASW-001</td>
                <td className="p-8 text-app-mu">
                  <span className="flex items-center gap-3">
                    <span className="text-app-am"><Ic.Pin /></span>
                    Aqaleem → Aswan Stadium
                  </span>
                </td>
                <td className="p-8 text-app-am tracking-tighter">32 / 40 SEATS</td>
                <td className="p-8 text-right">
                  <span className="px-5 py-2 rounded-full text-[8px] font-black bg-app-ok/10 text-app-ok border border-app-ok/20 tracking-widest">
                    DEPLOYED
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;