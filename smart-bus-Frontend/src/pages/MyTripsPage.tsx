import { useState, useEffect } from "react";
import type { TripStatus } from "../types";
import { Ic } from "../icons";
import Api from "../services/Api";

export default function MyTripsPage() {
  const [tab, setTab] = useState<TripStatus>("upcoming");
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real data from Backend
  const fetchMyBookings = async () => {
    try {
      const res = await Api.get("/bookings/my");
      setBookings(res.data?.data?.bookings || []);
    } catch (err) {
      console.error("Failed to fetch my bookings", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  // Cancel Booking Logic
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await Api.put(`/bookings/${bookingId}/cancel`);
      fetchMyBookings(); // Refresh the list
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  // Map Backend Data to fit the exact UI structure
  const mappedTrips = bookings.map((b) => {
    let currentStatus = "upcoming";
    const tripDate = new Date(b.trip?.date);
    const isTripDone = b.trip?.status === "completed" || tripDate < new Date();

    // Map backend status to UI tabs logic
    if (b.status === "cancelled") {
      currentStatus = "missed"; // Mapped to the 3rd tab in your UI
    } else if (b.status === "active" && isTripDone) {
      currentStatus = "completed";
    }

    return {
      id: b._id,
      status: currentStatus,
      date: b.trip?.date ? tripDate.toDateString() : "TBA",
      from: b.trip?.route?.name || "Selected Route",
      to: "Campus", 
      pickup: b.trip?.time_slot?.replace("return_", "") || "Morning",
      bus: "Bus System", 
      returnTime: b.trip?.time_slot === "morning" ? "N/A" : b.trip?.time_slot || "N/A",
    };
  });

  const counts = {
    upcoming: mappedTrips.filter((t) => t.status === "upcoming").length,
    completed: mappedTrips.filter((t) => t.status === "completed").length,
    missed: mappedTrips.filter((t) => t.status === "missed").length,
  };

  const list = mappedTrips.filter((t) => t.status === tab);

  const renderBadge = (s: TripStatus) => {
    const base = "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wider";
    if (s === "upcoming") return <span className={`${base} bg-green-500/10 text-app-ok border-green-500/20`}>Confirmed</span>;
    if (s === "completed") return <span className={`${base} bg-blue-500/10 text-app-info border-blue-500/20`}>Completed</span>;
    return <span className={`${base} bg-red-500/10 text-app-err border-red-500/20`}>Cancelled</span>;
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-64 text-app-mu font-syne font-bold animate-pulse">
        Loading your trips...
      </div>
    );
  }

  return (
    <div className="p-6 animate-in fade-in duration-500">
      {/* Tabs System */}
      <div className="flex w-fit gap-0.5 rounded-xl border border-app-bd bg-app-card2 p-0.5 mb-8 shadow-inner">
        {(["upcoming", "completed", "missed"] as TripStatus[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`cursor-pointer rounded-lg px-5 py-2 text-xs font-bold transition-all
              ${
                tab === t
                  ? "bg-app-card text-app-am border border-app-bd shadow-sm"
                  : "text-app-mu hover:text-app-tx"
              }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="ml-1.5 opacity-40 text-[10px]">({counts[t]})</span>
          </button>
        ))}
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
        {list.map((t) => (
          <div
            key={t.id}
            className="group rounded-2xl border border-app-bd bg-app-card p-6 transition-all hover:border-app-am/30 hover:shadow-xl hover:shadow-app-am/5"
          >
            {/* Card Header */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[11px] font-bold text-app-mu2 flex items-center gap-1.5 uppercase tracking-tighter">
                <Ic.Calendar size={12} /> {t.date}
              </span>
              {renderBadge(t.status as TripStatus)}
            </div>

            {/* Route Info */}
            <div className="mb-5 flex items-center gap-2 font-syne text-[15px] font-black text-app-tx">
              <span className="text-app-am">
                <Ic.Pin size={16} />
              </span>
              <span className="truncate">{t.from}</span>
              <span className="font-normal text-app-mu mx-1 opacity-30">→</span>
              <span className="truncate">{t.to}</span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Pickup", value: t.pickup, icon: <Ic.Clock size={10} /> },
                { label: "Bus", value: t.bus, icon: <Ic.Bus size={10} /> },
                { label: "Return", value: t.returnTime, highlight: true },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-app-bd bg-app-card2/50 px-3 py-3 shadow-inner"
                >
                  <div className="mb-1 text-[8px] font-black uppercase tracking-widest text-app-mu">
                    {item.label}
                  </div>
                  <div
                    className={`text-[11px] font-bold ${
                      item.highlight ? "text-app-am" : "text-app-tx"
                    }`}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            {t.status === "upcoming" && (
              <button 
                onClick={() => handleCancelBooking(t.id)}
                className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-[11px] font-black text-app-err transition-all hover:bg-red-500 hover:text-white uppercase tracking-widest"
              >
                <Ic.X size={14} /> Cancel Booking
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {list.length === 0 && (
        <div className="mt-24 flex flex-col items-center justify-center text-center opacity-40">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-app-card2 text-app-mu shadow-inner">
            <Ic.Route size={32} />
          </div>
          <h3 className="font-syne text-lg font-bold text-app-tx uppercase tracking-tight">
            No {tab} trips
          </h3>
          <p className="text-xs text-app-mu mt-1">
            You don't have any bookings in this category.
          </p>
        </div>
      )}
    </div>
  );
}