import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  time_slot: string;
  route?: Route;
  booked_seats: number;
  total_seats: number;
  bus_number?: string;
}

interface BookingSettings {
  booking_open_hour: number;
  booking_open_minute: number;
  booking_close_hour: number;
  booking_close_minute: number;
}

export default function BookTripPage() {
  const navigate = useNavigate();
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [selectedPickupId, setSelectedPickupId] = useState("");
  const [selectedReturn, setSelectedReturn] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    booking_open_hour: 20,
    booking_open_minute: 0,
    booking_close_hour: 23,
    booking_close_minute: 0,
  });
  const [windowState, setWindowState] = useState({ isOpen: false, timeLeft: "00h 00m", progress: 0 });

  const [modal, setModal] = useState({
    isOpen: false,
    type: "success",
    message: ""
  });

  // حساب الـ window state من الـ settings
  const calcWindow = (settings: BookingSettings) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = settings.booking_open_hour * 60 + settings.booking_open_minute;
    const closeMinutes = settings.booking_close_hour * 60 + settings.booking_close_minute;

    const isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    const diffMs = isOpen ? (closeMinutes - currentMinutes) * 60000 : 0;
    const diffH = Math.floor(diffMs / 3600000);
    const diffM = Math.floor((diffMs % 3600000) / 60000);
    const timeLeft = isOpen ? `${String(diffH).padStart(2, "0")}h ${String(diffM).padStart(2, "0")}m` : "00h 00m";
    const windowMs = (closeMinutes - openMinutes) * 60000;
    const progress = isOpen && windowMs > 0 ? Math.round(((closeMinutes - currentMinutes) * 60000 / windowMs) * 100) : 0;

    return { isOpen, timeLeft, progress };
  };

  // format لعرض الوقت بـ AM/PM
  const formatTime = (hour: number, minute: number) => {
    const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tripsRes, settingsRes] = await Promise.all([
          Api.get('/trips'),
          Api.get('/settings')
        ]);
        console.log("Raw Trips Data:", tripsRes.data);
        const fetchedTrips: Trip[] = tripsRes?.data?.data || tripsRes?.data || [];
        setAllTrips(fetchedTrips);
        if (settingsRes.data?.data?.settings) {
          const s = settingsRes.data.data.settings;
          setBookingSettings(s);
          setWindowState(calcWindow(s));
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Tick كل دقيقة
  useEffect(() => {
    const timer = setInterval(() => {
      setWindowState(calcWindow(bookingSettings));
    }, 60000);
    return () => clearInterval(timer);
  }, [bookingSettings]);

  const currentTrip = allTrips.find(t => t?._id === selectedTripId);
  const pickupPoints = currentTrip?.route?.stops || [];

  const handleConfirm = async () => {
    setIsBooking(true);
    try {
      const payload = {
        trip_id: selectedTripId,
        pickup_point: selectedPickupId,
        return_time: selectedReturn
      };
      const res = await Api.post('/bookings', payload);
      setModal({ isOpen: true, type: "success", message: res?.data?.message || "Your seat has been reserved successfully!" });
      setSelectedTripId("");
      setSelectedPickupId("");
      setSelectedReturn("");
      navigate('/my-trips');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setModal({ isOpen: true, type: "error", message: error?.response?.data?.message || "Failed to book trip. Please try again." });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="relative p-6 space-y-6 max-w-4xl animate-in fade-in duration-700">

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black font-syne text-app-tx uppercase tracking-tighter">
          Book <span className="text-app-am">Trip</span>
        </h1>
        <p className="text-xs text-app-mu font-medium">Reserve your seat for tomorrow's trips</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-app-card rounded-[24px] p-6 border border-app-bd shadow-xl group">
            <div className="flex items-center gap-2 text-app-am text-[11px] font-black uppercase tracking-widest mb-4">
              <Ic.Route /> Select Route
            </div>
            <select
              value={selectedTripId}
              onChange={(e) => { setSelectedTripId(e.target.value); setSelectedPickupId(""); setSelectedReturn(""); }}
              className="w-full bg-app-card2 border border-app-bd rounded-xl px-5 py-4 text-app-tx font-bold text-sm outline-none focus:border-app-am appearance-none cursor-pointer"
            >
              <option value="">{isLoading ? "Loading..." : "-- Choose a Line --"}</option>
              {allTrips.map(trip => (
                <option key={trip._id} value={trip._id} className="bg-app-card text-app-tx">
                  {trip?.route?.name || "Unknown Route"} {trip?.bus_number ? `- ${trip.bus_number}` : ''} - {trip?.date ? new Date(trip.date).toLocaleDateString() : ""} - {trip?.time_slot}
                </option>
              ))}
            </select>
          </div>

          {/* Booking Window Card */}
          <div className="bg-app-card rounded-[24px] p-6 border border-app-bd shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-app-am/5 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-2 text-app-am text-[11px] font-black uppercase tracking-widest">
                <Ic.Calendar /> Booking Window
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] border font-black ${windowState.isOpen
                ? "bg-green-500/10 text-app-ok border-green-500/20 animate-pulse"
                : "bg-red-500/10 text-app-err border-red-500/20"}`}>
                {windowState.isOpen ? "OPEN" : "CLOSED"}
              </span>
            </div>
            <div className="flex justify-between items-end mb-3 relative z-10">
              <div>
                <span className="text-app-mu text-[10px] font-bold uppercase tracking-tight block">
                  {windowState.isOpen ? "Time remaining" : "Currently closed"}
                </span>
                <span className="text-app-mu2 text-[9px] font-bold">
                  {formatTime(bookingSettings.booking_open_hour, bookingSettings.booking_open_minute)} — {formatTime(bookingSettings.booking_close_hour, bookingSettings.booking_close_minute)}
                </span>
              </div>
              <span className="text-app-am font-syne font-black text-3xl tracking-tighter">{windowState.timeLeft}</span>
            </div>
            <div className="w-full bg-app-card2 h-2 rounded-full overflow-hidden shadow-inner">
              <div className="bg-app-am h-full rounded-full transition-all duration-1000" style={{ width: `${windowState.progress}%` }}></div>
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
              ) : pickupPoints.length === 0 ? (
                <p className="text-app-err text-[10px] uppercase font-bold text-center py-4">No pickup points found</p>
              ) : (
                pickupPoints.map((point: Stop) => (
                  <button
                    key={point?._id}
                    onClick={() => setSelectedPickupId(point?._id)}
                    className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-300 font-bold text-sm flex justify-between items-center
                      ${selectedPickupId === point?._id
                        ? "bg-app-am/10 border-app-am text-app-am shadow-lg"
                        : "bg-app-card2 border-app-bd text-app-mu hover:border-app-am/50 hover:text-app-tx"}`}
                  >
                    {point?.name || "Unknown Stop"}
                    {selectedPickupId === point?._id && <Ic.Check />}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-app-card rounded-[24px] p-6 border border-app-bd shadow-xl">
            <div className="flex items-center gap-2 text-app-tx text-[11px] font-black uppercase tracking-widest mb-6">
              <Ic.Calendar /> Select Return Time
            </div>
            <select
              value={selectedReturn}
              onChange={(e) => setSelectedReturn(e.target.value)}
              disabled={!selectedTripId}
              className="w-full bg-app-card2 border border-app-bd rounded-xl px-5 py-4 text-app-tx font-bold text-sm outline-none focus:border-app-am appearance-none cursor-pointer disabled:opacity-50"
            >
              <option value="">-- Choose Return Time --</option>
              {selectedTripId && (
                <>
                  <option value="return_1530" className="bg-app-card text-app-tx">3:30 PM</option>
                  <option value="return_1900" className="bg-app-card text-app-tx">7:00 PM</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={!selectedPickupId || !selectedReturn || isBooking || !windowState.isOpen}
        className={`w-full py-5 rounded-[24px] font-syne font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-500
          ${(selectedPickupId && selectedReturn && !isBooking && windowState.isOpen)
            ? "bg-app-am text-black cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
            : "bg-app-card2 border border-app-bd text-app-mu2 cursor-not-allowed opacity-50"}`}
      >
        <Ic.Bus />
        {isBooking ? "Confirming..." : "Confirm Booking"}
      </button>

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-app-card border border-app-bd rounded-[24px] p-8 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full border-4 ${modal.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-app-ok' : 'bg-red-500/10 border-red-500/20 text-app-err'}`}>
                {modal.type === 'success' ? <Ic.Check /> : <span className="font-bold text-3xl">!</span>}
              </div>
              <h3 className="font-syne text-xl font-black text-app-tx uppercase tracking-wider mt-2">
                {modal.type === 'success' ? 'Booking Confirmed!' : 'Action Failed'}
              </h3>
              <p className="text-sm text-app-mu font-medium px-2">{modal.message}</p>
              <button
                onClick={() => { setModal({ ...modal, isOpen: false }); if (modal.type === 'success') navigate('/my-trips'); }}
                className={`mt-4 w-full py-4 rounded-xl font-syne font-black text-[13px] uppercase tracking-widest transition-all ${modal.type === 'success'
                  ? 'bg-app-am text-black hover:brightness-110'
                  : 'bg-app-card2 border border-app-bd text-app-tx hover:border-app-err hover:text-app-err'}`}
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