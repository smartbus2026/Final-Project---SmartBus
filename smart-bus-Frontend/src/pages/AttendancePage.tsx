import { useState, useEffect } from "react";
import Api from "../services/Api";

interface BookingRecord {
  _id: string;
  attended: boolean;
  status: string;
  trip: {
    date: string;
    time_slot: string;
    route?: { name: string };
  };
}

export default function AttendancePage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await Api.get("/bookings/my");
        setBookings(res.data?.data?.bookings || []);
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const timeSlotMap: Record<string, string> = {
    morning: "Morning",
    return_1530: "3:30 PM",
    return_1900: "7:00 PM",
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allBookings = bookings.filter(b => b.status !== "cancelled");

  const todayBookings = allBookings.filter(b => {
    const d = new Date(b.trip?.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() && b.status !== "completed" && b.status !== "missed";
  });

  const pastBookings = allBookings.filter(b => {
    const d = new Date(b.trip?.date);
    d.setHours(0, 0, 0, 0);
    return d < today || b.status === "completed" || b.status === "missed";
  });

  const present = pastBookings.filter(b => b.attended).length;
  const missed = pastBookings.filter(b => !b.attended).length;
  const total = pastBookings.length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  const groupedByDate: Record<string, BookingRecord[]> = {};
  pastBookings.forEach(b => {
    const dateKey = new Date(b.trip?.date).toDateString();
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

      {todayBookings.length > 0 && (
        <div className="rounded-2xl border border-app-am/30 bg-app-card p-6">
          <h3 className="mb-4 font-syne text-[13px] font-bold uppercase tracking-wider text-app-am">
            Today's Trips
          </h3>
          <div className="space-y-3">
            {todayBookings.map(b => (
              <div key={b._id} className="flex items-center justify-between p-3 rounded-xl border border-app-bd bg-app-card2/50">
                <div>
                  <div className="text-[12px] font-bold text-app-tx">{b.trip?.route?.name || "—"}</div>
                  <div className="text-[10px] text-app-mu uppercase">{timeSlotMap[b.trip?.time_slot] || b.trip?.time_slot}</div>
                </div>
                {b.attended ? (
                  <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase bg-green-500/10 text-app-ok border border-green-500/20">✓ Present</span>
                ) : (
                  <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase bg-app-am/10 text-app-am border border-app-am/20">Pending</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-app-bd bg-app-card p-6">
        <h3 className="mb-6 font-syne text-[13px] font-bold uppercase tracking-wider text-app-tx">Trip History</h3>
        {sortedDates.length === 0 ? (
          <p className="text-center text-app-mu text-xs py-8 font-bold uppercase">No past trips yet</p>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(dateKey => (
              <div key={dateKey}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-app-am">{dateKey}</span>
                  <div className="flex-1 h-px bg-app-bd" />
                  <span className="text-[9px] font-bold text-app-mu">
                    {groupedByDate[dateKey].filter(b => b.attended).length}/{groupedByDate[dateKey].length} present
                  </span>
                </div>
                <div className="space-y-2">
                  {groupedByDate[dateKey].map(b => (
                    <div key={b._id} className="flex items-center justify-between p-3 rounded-xl border border-app-bd bg-app-card2/30 hover:bg-app-card2/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${b.attended ? "bg-app-ok" : "bg-app-err"}`} />
                        <div>
                          <div className="text-[12px] font-bold text-app-tx">{b.trip?.route?.name || "—"}</div>
                          <div className="text-[10px] text-app-mu uppercase">{timeSlotMap[b.trip?.time_slot] || b.trip?.time_slot}</div>
                        </div>
                      </div>
                      {b.attended ? (
                        <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase bg-green-500/10 text-app-ok border border-green-500/20">Present</span>
                      ) : (
                        <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase bg-red-500/10 text-app-err border border-red-500/20">Missed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}