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

interface BookingSettings {
  booking_open_hour: number;
  booking_open_minute: number;
  booking_close_hour: number;
  booking_close_minute: number;
  returnTimeOptions?: string[];
}

export default function BookTripPage() {
  const navigate = useNavigate();
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [selectedSpecificReturn, setSelectedSpecificReturn] = useState("");
  const [returnTimeOptions, setReturnTimeOptions] = useState<string[]>([]);
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
        const [routesRes, settingsRes] = await Promise.all([
          Api.get('/routes'),
          Api.get('/settings')
        ]);
        const fetchedRoutes: Route[] = routesRes?.data?.data || routesRes?.data || [];
        setAllRoutes(fetchedRoutes);
        if (settingsRes.data?.data?.settings) {
          const s = settingsRes.data.data.settings;
          setBookingSettings(s);
          setReturnTimeOptions(s.returnTimeOptions || ["3:30 PM", "7:00 PM"]);
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

  const handleConfirm = async () => {
    setIsBooking(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split("T")[0];

      const payload = {
        routeId: selectedRouteId,
        date: dateString,
        timeSlot: selectedTimeSlot,
        specificReturnTime: selectedTimeSlot === "Return" ? selectedSpecificReturn : undefined
      };
      await Api.post('/bookings', payload);
      setModal({ isOpen: true, type: "success", message: "Your booking demand is registered. You will be notified of your bus assignment once the booking window closes." });
      setSelectedRouteId("");
      setSelectedTimeSlot("");
      setSelectedSpecificReturn("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setModal({ isOpen: true, type: "error", message: error?.response?.data?.message || "Failed to submit booking demand. Please try again." });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="relative p-6 space-y-6 max-w-4xl animate-in fade-in duration-700">

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black font-syne text-app-tx uppercase tracking-tighter">
          Book <span className="text-app-am">Route</span>
        </h1>
        <p className="text-xs text-app-mu font-medium">Register your demand for tomorrow's buses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-app-card rounded-[24px] p-6 border border-app-bd shadow-xl group">
            <div className="flex items-center gap-2 text-app-am text-[11px] font-black uppercase tracking-widest mb-4">
              <Ic.Route /> Select Route
            </div>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full bg-app-card2 border border-app-bd rounded-xl px-5 py-4 text-app-tx font-bold text-sm outline-none focus:border-app-am appearance-none cursor-pointer"
            >
              <option value="">{isLoading ? "Loading..." : "-- Choose a Route --"}</option>
              {allRoutes.map(route => (
                <option key={route._id} value={route._id} className="bg-app-card text-app-tx">
                  {route.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-app-card rounded-[24px] p-6 border border-app-bd shadow-xl">
            <div className="flex items-center gap-2 text-app-tx text-[11px] font-black uppercase tracking-widest mb-6">
              <Ic.Calendar /> Select Time Slot
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setSelectedTimeSlot("Morning"); setSelectedSpecificReturn(""); }}
                className={`py-4 rounded-xl font-bold text-sm border transition-all duration-300 flex justify-center items-center gap-2
                  ${selectedTimeSlot === "Morning" ? "bg-app-am/10 border-app-am text-app-am shadow-lg" : "bg-app-card2 border-app-bd text-app-mu hover:border-app-am/50 hover:text-app-tx"}`}
              >
                Morning
              </button>
              <button
                onClick={() => setSelectedTimeSlot("Return")}
                className={`py-4 rounded-xl font-bold text-sm border transition-all duration-300 flex justify-center items-center gap-2
                  ${selectedTimeSlot === "Return" ? "bg-app-am/10 border-app-am text-app-am shadow-lg" : "bg-app-card2 border-app-bd text-app-mu hover:border-app-am/50 hover:text-app-tx"}`}
              >
                Return
              </button>
            </div>
            
            {selectedTimeSlot === "Return" && (
              <div className="mt-6 pt-6 border-t border-app-bd animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-2 text-app-tx text-[11px] font-black uppercase tracking-widest mb-4">
                  <Ic.Calendar /> Select Return Time
                </div>
                <select
                  value={selectedSpecificReturn}
                  onChange={(e) => setSelectedSpecificReturn(e.target.value)}
                  className="w-full bg-app-card2 border border-app-bd rounded-xl px-5 py-4 text-app-tx font-bold text-sm outline-none focus:border-app-am appearance-none cursor-pointer"
                >
                  <option value="">-- Choose Return Time --</option>
                  {returnTimeOptions.map(rt => (
                    <option key={rt} value={rt} className="bg-app-card text-app-tx">
                      {rt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Booking Window Card */}
          <div className="bg-app-card rounded-[24px] p-6 border border-app-bd shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
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
            <div className="w-full bg-app-card2 h-2 rounded-full overflow-hidden shadow-inner mt-4">
              <div className="bg-app-am h-full rounded-full transition-all duration-1000" style={{ width: `${windowState.progress}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={!selectedRouteId || !selectedTimeSlot || (selectedTimeSlot === "Return" && !selectedSpecificReturn) || isBooking || !windowState.isOpen}
        className={`w-full py-5 rounded-[24px] font-syne font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-500
          ${(selectedRouteId && selectedTimeSlot && (selectedTimeSlot === "Morning" || selectedSpecificReturn) && !isBooking && windowState.isOpen)
            ? "bg-app-am text-black cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
            : "bg-app-card2 border border-app-bd text-app-mu2 cursor-not-allowed opacity-50"}`}
      >
        <Ic.Bus />
        {isBooking ? "Registering Demand..." : "Register Booking Demand"}
      </button>

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-app-card border border-app-bd rounded-[24px] p-8 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full border-4 ${modal.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-app-ok' : 'bg-red-500/10 border-red-500/20 text-app-err'}`}>
                {modal.type === 'success' ? <Ic.Check /> : <span className="font-bold text-3xl">!</span>}
              </div>
              <h3 className="font-syne text-xl font-black text-app-tx uppercase tracking-wider mt-2">
                {modal.type === 'success' ? 'Demand Registered!' : 'Action Failed'}
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