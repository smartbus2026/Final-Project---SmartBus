import { useState, useEffect } from "react";
import Api from "../services/Api";

interface BookingRecord {
  _id: string;
  attended: boolean;
  attendanceStatus: string;
  status: string;
  date: string;
  timeSlot: string;
  route?: { name: string };
  specificReturnTime?: string;
}

export default function AttendancePage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAttendance = async (id: string, newStatus: "completed" | "missed") => {
    setLoadingId(id);
    try {
      await Api.patch(`/bookings/${id}/attendance`, { attendanceStatus: newStatus });
      setBookings(prev =>
        prev.map(b => b._id === id
          ? { ...b, attendanceStatus: newStatus, status: newStatus, attended: newStatus === "completed" }
          : b
        )
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update attendance");
    } finally {
      setLoadingId(null);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [res, sRes] = await Promise.all([
          Api.get("/bookings/my"),
          Api.get("/settings")
        ]);
        setBookings(res.data?.data?.bookings || []);
        setSettings(sRes.data?.data?.settings || null);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const checkTripTiming = (b: BookingRecord) => {
    if (!settings) return { isStarted: false, isExpired: false };
    
    let timeStr = "";
    if (b.timeSlot === "Morning") {
      timeStr = settings.morningStartTime || "08:30 AM";
    } else {
      timeStr = b.specificReturnTime || "03:30 PM";
    }

    const parseTimeToMinutes = (t: string) => {
      if (!t) return 0;
      const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!m) return 0;
      let h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      if (m[3].toUpperCase() === "PM" && h !== 12) h += 12;
      if (m[3].toUpperCase() === "AM" && h === 12) h = 0;
      return h * 60 + min;
    };

    const tripMin = parseTimeToMinutes(timeStr);
    const tripStartTime = new Date(b.date);
    tripStartTime.setHours(Math.floor(tripMin / 60), tripMin % 60, 0, 0);

    const now = new Date();
    
    // Trip hasn't started yet
    if (now < tripStartTime) return { isStarted: false, isExpired: false };

    // More than 2 hours after trip start time
    const expiredTime = new Date(tripStartTime.getTime() + 120 * 60000);
    if (now > expiredTime) return { isStarted: true, isExpired: true };

    return { isStarted: true, isExpired: false };
  };

  const timeSlotMap: Record<string, string> = {
    morning: "Morning",
    return_1530: "3:30 PM",
    return_1900: "7:00 PM",
  };

  const allBookings = bookings.filter(b => b.status !== "cancelled");

  const present = allBookings.filter(b => b.attendanceStatus === "completed").length;
  const missed = allBookings.filter(b => b.attendanceStatus === "missed").length;
  const total = present + missed;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  const groupedByDate: Record<string, BookingRecord[]> = {};
  allBookings.forEach(b => {
    const dateKey = new Date(b.date).toDateString();
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(b);
  });

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64 text-app-mu font-syne font-bold animate-pulse">
        Loading attendance...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black font-syne text-app-tx uppercase tracking-tighter">
          My <span className="text-app-am">Attendance</span>
        </h1>
        <p className="text-xs text-app-mu font-medium">Your trip attendance record</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: "Total Trips", v: total, c: "text-app-mu" },
          { l: "Present", v: present, c: "text-app-ok" },
          { l: "Missed", v: missed, c: "text-app-err" },
          { l: "Rate", v: `${pct}%`, c: pct >= 75 ? "text-app-ok" : "text-app-err" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-app-bd bg-app-card p-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-app-mu">{s.l}</div>
            <div className={`font-syne text-2xl font-extrabold ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-app-bd bg-app-card p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-app-mu">Attendance Rate</span>
          <span className="font-syne font-black text-2xl text-app-am">{pct}%</span>
        </div>
        <div className="w-full bg-app-card2 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${pct >= 75 ? "bg-app-ok" : "bg-app-err"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-3 text-[10px] text-app-mu font-bold">
          {pct >= 75 ? "✓ Good attendance keep it up!" : "⚠ Your attendance is below 75%"}
        </p>
      </div>

      <div className="rounded-2xl border border-app-bd bg-app-card p-6">
        <h3 className="mb-6 font-syne text-[13px] font-bold uppercase tracking-wider text-app-tx">Trip Log</h3>
        {sortedDates.length === 0 ? (
          <p className="text-center text-app-mu text-xs py-8 font-bold uppercase">No trip history found</p>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(dateKey => (
              <div key={dateKey}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-app-am">{dateKey}</span>
                  <div className="flex-1 h-px bg-app-bd" />
                  <span className="text-[9px] font-bold text-app-mu">
                    {groupedByDate[dateKey].filter(b => b.attendanceStatus === "completed").length}/{groupedByDate[dateKey].length} present
                  </span>
                </div>
                <div className="space-y-2">
                  {groupedByDate[dateKey].map(b => {
                    const { isStarted, isExpired } = checkTripTiming(b);
                    return (
                      <div key={b._id} className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-3 rounded-xl border border-app-bd bg-app-card2/30 hover:bg-app-card2/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            b.attendanceStatus === "completed" ? "bg-app-ok" : 
                            b.attendanceStatus === "missed" ? "bg-app-err" : 
                            "bg-app-am"
                          }`} />
                          <div>
                            <div className="text-[12px] font-bold text-app-tx">{b.route?.name || "—"}</div>
                            <div className="text-[10px] text-app-mu uppercase">{b.timeSlot} {b.specificReturnTime ? `(${b.specificReturnTime})` : ""}</div>
                          </div>
                        </div>
                        
                        {b.status === "assigned" && b.attendanceStatus !== "completed" && b.attendanceStatus !== "missed" ? (
                          isExpired ? (
                            <span className="px-3 py-1.5 rounded-md text-[10px] font-black uppercase w-fit bg-red-500/10 text-app-err border border-red-500/20" title="Trip duration ended">
                              Expired
                            </span>
                          ) : (
                            <div className="flex gap-2 w-full sm:w-auto">
                              <button
                                disabled={loadingId === b._id || !isStarted}
                                title={!isStarted ? "Trip hasn't started yet" : ""}
                                onClick={() => handleAttendance(b._id, "completed")}
                                className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-md text-[10px] font-black uppercase bg-green-500/10 text-app-ok border border-green-500/20 hover:bg-green-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-500/10 disabled:hover:text-app-ok"
                              >
                                {loadingId === b._id ? "..." : "✓ Boarded"}
                              </button>
                              <button
                                disabled={loadingId === b._id || !isStarted}
                                title={!isStarted ? "Trip hasn't started yet" : ""}
                                onClick={() => handleAttendance(b._id, "missed")}
                                className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-md text-[10px] font-black uppercase bg-red-500/10 text-app-err border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500/10 disabled:hover:text-app-err"
                              >
                                {loadingId === b._id ? "..." : "✗ Missed"}
                              </button>
                            </div>
                          )
                        ) : (
                          <span className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase w-fit border ${
                            b.attendanceStatus === "completed" ? "bg-green-500/10 text-app-ok border-green-500/20" : 
                            b.attendanceStatus === "missed" ? "bg-red-500/10 text-app-err border-red-500/20" : 
                            "bg-app-am/10 text-app-am border-app-am/20"
                          }`}>
                            {b.attendanceStatus === "completed" ? "Present" : 
                             b.attendanceStatus === "missed" ? "Missed" : 
                             b.status}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}