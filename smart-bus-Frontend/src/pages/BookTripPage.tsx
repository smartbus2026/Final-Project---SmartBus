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
  const [isBooking, setIsBooking] = useState(false);

  // 1. State الخاصة بالـ Pop-up
  const [modal, setModal] = useState({ 
    isOpen: false, 
    type: "success", // 'success' أو 'error'
    message: "" 
  });

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

  // 2. تعديل الـ Confirm عشان يفتح الـ Pop-up بدل الـ alert
  const handleConfirm = async () => {
    setIsBooking(true);
    try {
      const payload = {
        trip_id: selectedTripId,
        pickup_point: selectedPickupId, 
        seat_number: Math.floor(Math.random() * 30) + 1,
        return_time: selectedReturn // << El T3deel: rabt el return time elly et3mlha select b el payload
      };

      const res = await Api.post('/bookings', payload);
      setModal({ 
        isOpen: true, 
        type: "success", 
        message: res.data.message || "Your seat has been reserved successfully!" 
      });
      
      // تفريغ الاختيارات بعد النجاح (اختياري)
      setSelectedTripId("");
      setSelectedPickupId("");
      setSelectedReturn("");

    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setModal({ 
        isOpen: true, 
        type: "error", 
        message: error.response?.data?.message || "Failed to book trip. Please try again." 
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    // ضفت relative عشان لو حبينا الـ modal يكون جوه الكونتينر، بس الـ fixed أفضل
    <div className="relative p-6 space-y-6 max-w-4xl animate-in fade-in duration-700">
      
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
        disabled={!selectedPickupId || !selectedReturn || isBooking}
        className={`w-full py-5 rounded-[24px] font-syne font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-500
          ${(selectedPickupId && selectedReturn && !isBooking)
            ? "bg-app-am text-black cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
            : "bg-app-card2 border border-app-bd text-app-mu2 cursor-not-allowed opacity-50"}`}
      >
        <Ic.Bus />
        {isBooking ? "Confirming..." : "Confirm Booking"}
      </button>

      {/* ── 3. واجهة الـ Pop-up (Modal) ── */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-app-card border border-app-bd rounded-[24px] p-8 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              
              {/* أيقونة الحالة (نجاح أو خطأ) */}
              <div className={`flex h-20 w-20 items-center justify-center rounded-full border-4 ${
                modal.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-app-ok' : 'bg-red-500/10 border-red-500/20 text-app-err'
              }`}>
                {modal.type === 'success' ? <Ic.Check /> : <span className="font-bold text-3xl">!</span>}
              </div>
              
              <h3 className="font-syne text-xl font-black text-app-tx uppercase tracking-wider mt-2">
                {modal.type === 'success' ? 'Booking Confirmed!' : 'Action Failed'}
              </h3>
              
              <p className="text-sm text-app-mu font-medium px-2">
                {modal.message}
              </p>
              
              <button
                onClick={() => setModal({ ...modal, isOpen: false })}
                className={`mt-4 w-full py-4 rounded-xl font-syne font-black text-[13px] uppercase tracking-widest transition-all ${
                  modal.type === 'success' 
                    ? 'bg-app-am text-black hover:brightness-110' 
                    : 'bg-app-card2 border border-app-bd text-app-tx hover:border-app-err hover:text-app-err'
                }`}
              >
                {modal.type === 'success' ? 'View My Trips' : 'Close & Try Again'}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}