import { useState, useEffect } from "react";
import { Ic } from "../icons";
import Api from "../services/Api"; 

interface Stop {
  _id: string;
  name: string;
}

interface Route {
  _id: string;
  name: string;
  stops: Stop[];
}

interface Trip {
  _id: string;
  date: string;
  route: Route;
}

export default function BookTripPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [selectedPickupId, setSelectedPickupId] = useState(""); 
  const [selectedReturn, setSelectedReturn] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const timeLeft = "01h 49m";
  const returnTimes = ["3:30 PM", "7:00 PM"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await Api.get('/trips'); 
        setTrips(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch trips", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentTrip = trips.find(t => t._id === selectedTripId);
  const pickupPoints = currentTrip?.route?.stops || [];

  const handleConfirm = async () => {
    try {
      const payload = {
        trip_id: selectedTripId,
        pickup_point: selectedPickupId, 
        seat_number: Math.floor(Math.random() * 30) + 1 
      };

      const res = await Api.post('/bookings', payload);
      alert("Success: " + res.data.message);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert("Error: " + (error.response?.data?.message || "Something went wrong"));
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black font-syne text-app-tx uppercase tracking-tighter">
          Book <span className="text-app-am">Trip</span>
        </h1>
        <p className="text-xs text-app-mu font-medium">Reserve your seat for tomorrow's morning trip</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-app-card rounded-[24px] p-6 border border-app-bd shadow-xl group">
            <div className="flex items-center gap-2 text-app-am text-[11px] font-black uppercase tracking-widest mb-4">
              <Ic.Route /> Select Route
            </div>
            <select 
              value={selectedTripId}
              onChange={(e) => {
                setSelectedTripId(e.target.value);
                setSelectedPickupId(""); 
              }}
              className="w-full bg-app-card2 border border-app-bd rounded-xl px-5 py-4 text-app-tx font-bold text-sm outline-none focus:border-app-am appearance-none cursor-pointer"
            >
              <option value="">{isLoading ? "Loading..." : "-- Choose a Line --"}</option>
              {trips.map(trip => (
                <option key={trip._id} value={trip._id} className="bg-app-card text-app-tx">
                  {trip.route?.name} - {new Date(trip.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-app-card rounded-[24px] p-6 border border-app-bd shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-app-am/5 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-2 text-app-am text-[11px] font-black uppercase tracking-widest">
                <Ic.Calendar /> Booking Window
              </div>
              <span className="bg-green-500/10 text-app-ok px-3 py-1 rounded-full text-[9px] border border-green-500/20 font-black animate-pulse">
                OPEN
              </span>
            </div>
            <div className="flex justify-between items-end mb-3 relative z-10">
              <span className="text-app-mu text-[10px] font-bold uppercase tracking-tight">Time remaining</span>
              <span className="text-app-am font-syne font-black text-3xl tracking-tighter">{timeLeft}</span>
            </div>
            <div className="w-full bg-app-card2 h-2 rounded-full overflow-hidden shadow-inner">
              <div className="bg-app-am h-full rounded-full w-[65%]"></div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-app-card rounded-[24px] p-6 border border-app-bd shadow-xl">
            <div className="flex items-center gap-2 text-app-am text-[11px] font-black uppercase tracking-widest mb-6">
              <Ic.Pin /> Select Pickup Point
            </div>
            <div className="grid gap-3">
              {!selectedTripId ? (
                <p className="text-app-mu2 text-[10px] uppercase font-bold text-center py-4 border border-dashed border-app-bd rounded-xl">Please select a route first</p>
              ) : (
                pickupPoints.map((point: Stop) => (
                  <button
                    key={point._id}
                    onClick={() => setSelectedPickupId(point._id)}
                    className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-300 font-bold text-sm flex justify-between items-center
                      ${selectedPickupId === point._id 
                        ? "bg-app-am/10 border-app-am text-app-am shadow-lg" 
                        : "bg-app-card2 border-app-bd text-app-mu hover:border-app-am/50 hover:text-app-tx"}`}
                  >
                    {point.name}
                    {selectedPickupId === point._id && <Ic.Check />}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-app-card rounded-[24px] p-6 border border-app-bd shadow-xl">
            <div className="flex items-center gap-2 text-app-tx text-[11px] font-black uppercase tracking-widest mb-6">
              <Ic.Calendar /> Select Return Time
            </div>
            <div className="grid grid-cols-2 gap-4">
              {returnTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedReturn(time)}
                  className={`py-4 rounded-xl border font-syne font-black text-center transition-all duration-300 text-sm
                    ${selectedReturn === time 
                      ? "bg-app-am border-app-am text-black shadow-lg" 
                      : "bg-app-card2 border-app-bd text-app-mu hover:border-app-am/50 hover:text-app-tx"}`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={handleConfirm}
        disabled={!selectedPickupId || !selectedReturn}
        className={`w-full py-5 rounded-[24px] font-syne font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-500
          ${(selectedPickupId && selectedReturn)
            ? "bg-app-am text-black cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
            : "bg-app-card2 border border-app-bd text-app-mu2 cursor-not-allowed opacity-50"}`}
      >
        <Ic.Bus />
        Confirm Booking
      </button>
    </div>
  );
}