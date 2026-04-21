import React, { useState, useEffect } from "react";
import type { Page } from "../types";
import { Ic } from "../icons";
import { useNavigate } from "react-router-dom";
import Api from "../services/Api";

export default function DashboardPage({ go }: { go?: (p: Page) => void }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await Api.get("/bookings/my");
        // Handling nested booking array structure correctly
        const bookingsArray = res.data?.data?.bookings || res.data?.data || res.data || [];
        setBookings(Array.isArray(bookingsArray) ? bookingsArray : []);
      } catch (err) {
        console.error("Failed to fetch dashboard bookings:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const nextBooking = bookings.length > 0 ? bookings[0] : null;
  const nextTrip = nextBooking?.trip;

  const stats = [
    {
      l: "Total Trips",
      v: bookings.length.toString(),
      c: "text-app-am",
      bg: "bg-app-am/10",
      icon: <Ic.Route size={24} />,
    },
    {
      l: "Active Now",
      v: bookings.filter((b) => b.status === "active").length.toString(),
      c: "text-app-ok",
      bg: "bg-app-ok/10",
      icon: <Ic.Check size={24} />,
    },
    {
      l: "Upcoming",
      v: bookings.filter((b) => b.status === "scheduled").length.toString(),
      c: "text-app-info",
      bg: "bg-blue-500/10",
      icon: <Ic.Calendar size={24} />,
    },
    {
      l: "Cancelled",
      v: bookings.filter((b) => b.status === "cancelled").length.toString(),
      c: "text-red-400",
      bg: "bg-red-500/10",
      icon: <Ic.X size={24} />,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 bg-app-bg text-app-tx p-8 flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-app-mu font-black uppercase tracking-widest text-[10px]">
          Initializing Student Portal...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-app-bg text-app-tx min-h-screen overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
      
      {/* ── Header Area (Admin Style) ── */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8">
        <div>
          <p className="text-[10px] text-app-mu font-black tracking-[0.3em] uppercase mb-2">Student Portal</p>
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            My <span className="text-app-am">Dashboard</span>
          </h1>
        </div>
        <button
          onClick={() => navigate("/book-trip")}
          className="bg-app-am text-white dark:text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-app-am/20 flex items-center gap-3 w-fit"
        >
          <Ic.Bus size={16} /> Book New Trip
        </button>
      </div>

      {/* ── Stats Grid (Admin Style) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div
            key={s.l}
            className="bg-app-card border border-app-bd p-8 rounded-[2.5rem] hover:border-app-am/30 transition-all group"
          >
            <div className={`mb-6 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${s.bg} ${s.c}`}>
              {s.icon}
            </div>
            <div className="text-4xl font-black mb-2 tracking-tighter text-app-tx">{s.v}</div>
            <div className="text-[10px] text-app-mu font-black uppercase tracking-widest">
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
        
        {/* Left Column: Next Trip & Recent Activity */}
        <div className="space-y-8">
          
          {/* Next Trip Hero (Admin Card Style) */}
          {nextBooking ? (
            <div className="bg-app-card border border-app-bd rounded-[2.5rem] overflow-hidden shadow-xl transition-all hover:border-app-am/20">
              <div className="p-8 border-b border-app-bd flex justify-between items-center bg-gradient-to-r from-app-am/5 to-transparent">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                      nextBooking.status === "active" 
                        ? "bg-app-ok/10 text-app-ok border-app-ok/20" 
                        : "bg-app-am/10 text-app-am border-app-am/20"
                    }`}>
                      {nextBooking.status}
                    </span>
                    <h2 className="text-xl font-black uppercase tracking-tight">
                      {nextTrip?.route?.name || "Selected Route"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 text-app-mu">
                    <Ic.Pin size={14} />
                    <p className="text-[10px] font-black tracking-widest uppercase">
                      Campus Deployment
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <button 
                    onClick={() => navigate("/track-bus")}
                    className="bg-app-bg hover:bg-app-bd border border-app-bd px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-app-mu hover:text-app-tx flex items-center gap-2"
                  >
                    <Ic.Target size={14}/> Track Live
                  </button>
                </div>
              </div>

              <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-1">
                  <label className="block text-[9px] text-app-mu font-black uppercase tracking-widest">Date</label>
                  <p className="text-sm font-black text-app-tx uppercase">
                    {nextTrip?.date ? new Date(nextTrip.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "TBA"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] text-app-mu font-black uppercase tracking-widest">Time Slot</label>
                  <p className="text-sm font-black text-app-am uppercase">
                    {nextTrip?.time_slot?.replace('_', ' ') || "TBA"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] text-app-mu font-black uppercase tracking-widest">Seat Number</label>
                  <p className="text-sm font-black text-app-tx uppercase">
                    #{nextBooking.seat_number || "0"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] text-app-mu font-black uppercase tracking-widest">Bus Details</label>
                  <p className="text-sm font-black text-app-tx flex items-center gap-1.5 uppercase">
                    <Ic.Bus size={14} className="text-app-mu"/> Standard
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-app-card border border-app-bd border-dashed rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-app-bg rounded-full flex items-center justify-center mb-4 text-app-mu opacity-50">
                <Ic.Bus size={32} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-app-tx mb-2">No Active Missions</h3>
              <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest max-w-xs leading-relaxed">
                You don't have any upcoming trips. Book a seat to see it here.
              </p>
            </div>
          )}

          {/* Operational Queue (Admin Table Style) */}
          <div className="bg-app-card border border-app-bd rounded-[2.5rem] overflow-hidden">
            <div className="p-8 border-b border-app-bd flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <Ic.Calendar className="text-app-am" /> Recent Bookings
              </h3>
              <button onClick={() => go?.("myTrips")} className="text-[10px] text-app-am font-black uppercase tracking-widest hover:text-app-tx transition-colors">
                View All →
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-app-bg border-b border-app-bd text-[9px] font-black text-app-mu uppercase tracking-[0.2em]">
                    <th className="p-6">Route</th>
                    <th className="p-6">Time / Date</th>
                    <th className="p-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] font-black uppercase">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-app-mu text-[10px] tracking-widest">Queue is empty</td>
                    </tr>
                  ) : (
                    bookings.slice(0, 3).map((b) => (
                      <tr key={b._id} className="border-b border-app-bd/50 last:border-none hover:bg-app-am/5 transition-colors group">
                        <td className="p-6 text-app-tx tracking-widest">
                          <span className="flex items-center gap-3">
                            <span className="text-app-am group-hover:scale-110 transition-transform"><Ic.Route size={16} /></span>
                            {b.trip?.route?.name || "Unknown Route"}
                          </span>
                        </td>
                        <td className="p-6 text-app-mu tracking-widest">
                          {b.trip?.time_slot?.replace('_', ' ')} • {b.trip?.date ? new Date(b.trip.date).toLocaleDateString("en-GB") : ""}
                        </td>
                        <td className="p-6 text-right">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[8px] font-black tracking-widest border ${
                            b.status === "active" ? "bg-app-ok/10 text-app-ok border-app-ok/20" : "bg-app-mu/10 text-app-mu border-app-mu/20"
                          }`}>
                            {b.status}
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

        {/* Right Column: Quick Links & Alerts */}
        <div className="space-y-8">
          
          {/* Quick Actions (Admin Side Panel Style) */}
          <div className="bg-app-card border border-app-bd rounded-[2.5rem] p-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-app-tx border-b border-app-bd pb-4">
              Quick Actions
            </h3>
            <div className="space-y-4">
              {[
                { l: "Book New Trip", i: <Ic.Bus size={20} />, c: "text-app-am bg-app-am/10 hover:border-app-am/50", p: "bookTrip" },
                { l: "Fleet Map", i: <Ic.Pin size={20} />, c: "text-app-ok bg-app-ok/10 hover:border-app-ok/50", p: "routeDetails" },
                { l: "My History", i: <Ic.Calendar size={20} />, c: "text-app-info bg-blue-500/10 hover:border-blue-500/50", p: "myTrips" },
                { l: "Live Alerts", i: <Ic.Bell size={20} />, c: "text-red-400 bg-red-500/10 hover:border-red-500/50", p: "notifications" },
              ].map((act) => (
                <button
                  key={act.l}
                  onClick={() => go?.(act.p as Page)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border border-app-bd bg-app-bg transition-all group ${act.c}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${act.c.split(' ')[0]} ${act.c.split(' ')[1]}`}>
                    {act.i}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-app-tx group-hover:text-app-am transition-colors">
                    {act.l}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* System Notices (Stylized widget) */}
          <div className="bg-gradient-to-br from-app-card to-app-bg border border-app-bd rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-app-am/30 transition-all">
             <div className="absolute -right-10 -top-10 w-32 h-32 bg-app-am/5 rounded-full blur-2xl group-hover:bg-app-am/10 transition-colors"></div>
             <div className="flex items-center gap-4 mb-4 relative z-10">
               <div className="bg-app-am/20 p-3 rounded-2xl text-app-am">
                 <Ic.Shield size={20} />
               </div>
               <div>
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-app-mu">System Status</p>
                 <p className="text-xs font-black uppercase tracking-widest text-app-tx">All Operations Normal</p>
               </div>
             </div>
             <p className="text-[10px] text-app-mu font-bold uppercase tracking-wider leading-relaxed relative z-10">
               Ensure you book your return trip before the 2:00 PM deadline daily.
             </p>
          </div>

        </div>
      </div>
    </div>
  );
}