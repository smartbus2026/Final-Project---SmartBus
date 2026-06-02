import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { io, Socket } from "socket.io-client";
import { Ic } from "../icons";
import type { Page } from "../types";
import Api from "../services/Api";

// Component to dynamically update map view based on props
function MapUpdater({ theme, center }: { theme: "dark" | "light", center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

const busIcon = new L.DivIcon({
  className: "custom-bus-marker",
  html: `<div style="background-color:#f7a01b;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 20px #f7a01b;"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function StopItem({ stop, isPickup, index }: { stop: any, isPickup: boolean, index: number }) {
  const { t } = useTranslation();
  const baseLine = "flex items-center gap-5 relative transition-all duration-500";

  if (isPickup) {
    return (
      <div className={`${baseLine} opacity-100 scale-[1.02]`}>
        <div className="w-8 h-8 rounded-full bg-app-am text-black flex items-center justify-center font-bold z-10 text-xs shadow-xl shadow-app-am/30 border-2 border-white/20">
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-bold font-syne text-app-am uppercase tracking-tight">{stop.name}</p>
          <p className="text-[10px] text-app-mu font-medium">{t("your_pickup")}</p>
        </div>
        <span className="bg-app-am/20 text-app-am text-[8px] px-2 py-0.5 rounded-md font-black border border-app-am/20 tracking-tighter animate-pulse">
          {t("stand_here")}
        </span>
      </div>
    );
  }

  return (
    <div className={`${baseLine} opacity-50`}>
      <div className="w-8 h-8 rounded-full bg-app-card2 text-app-mu flex items-center justify-center z-10 text-xs border border-app-bd">
        {index + 1}
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-bold font-syne text-app-tx">{stop.name}</p>
      </div>
    </div>
  );
}

export default function TrackBusPage({ theme = "dark", go }: { theme?: "dark" | "light", go?: (p: Page) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eta, setEta] = useState(12);
  const [activeBuses, setActiveBuses] = useState<Map<string, any>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  // Fetch student bookings
  useEffect(() => {
    const fetchActiveBooking = async () => {
      try {
        const res = await Api.get('/bookings/my');
        console.log("My Bookings Data:", res.data);
        const bookings = res.data?.data?.bookings || [];
        
        // VERIFICATION LOG REQUIRED BY USER
        console.log("VERIFY: Fetched Bookings Data:", bookings);

        // Pick the first booking with an attached trip that is either scheduled or actively running
        const active = bookings.find((b: any) => 
          b.status !== 'cancelled' && 
          b.trip && 
          ['scheduled', 'active', 'in_progress', 'in-progress'].includes(b.trip.status)
        );

        // VERIFICATION LOG REQUIRED BY USER
        console.log("VERIFY: Evaluated Active Booking for Map:", active);

        setActiveBooking(active || null);
      } catch (err) {
        console.error("Failed to fetch active booking", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActiveBooking();
  }, []);

  useEffect(() => {
    if (!activeBooking?.trip?._id) return;

    const studentRouteId = activeBooking.route?._id || activeBooking.route;

    socketRef.current = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5001", {
      transports: ["websocket", "polling"]
    });

    // Join specific rooms
    socketRef.current.emit("join_trip_room", activeBooking.trip._id);
    if (studentRouteId) {
      socketRef.current.emit("join-route-room", studentRouteId);
    }

    // Legacy listener (for trip-specific broadcasts)
    socketRef.current.on("bus_location_updated", (data: any) => {
      if (data.lat !== undefined && data.lng !== undefined) {
        console.log("Received live location from driver. Updating map:", data.lat, data.lng);
        const legacyBusId = activeBooking.trip?.bus?._id || activeBooking.trip?.bus_number || 'legacy-bus';
        
        setActiveBuses(prev => {
          const next = new Map(prev);
          next.set(legacyBusId, { ...data, busId: legacyBusId });
          return next;
        });
        
        setActiveBooking((prev: any) => {
          if (prev?.trip?.status === 'scheduled') {
            return { ...prev, trip: { ...prev.trip, status: 'in-progress' } };
          }
          return prev;
        });

        setEta(prev => (prev > 1 ? prev - 1 : 1));
      }
    });

    // Global listener: accept EVERY bus_location_update event
    socketRef.current.on('bus_location_update', (data: any) => {
      console.log('Unconditional update for bus:', data.busId);
      setActiveBuses(prev => {
        const newBuses = new Map(prev);
        newBuses.set(data.busId, data);
        return newBuses;
      });

      if (data.tripId && String(data.tripId) === String(activeBooking?.trip?._id)) {
        setActiveBooking((prev: any) => {
          if (prev?.trip?.status === 'scheduled') {
            return { ...prev, trip: { ...prev.trip, status: 'in-progress' } };
          }
          return prev;
        });
      }
      setEta(prev => (prev > 1 ? prev - 1 : 1));
    });

    return () => {
      socketRef.current?.emit("leave-trip-room", activeBooking.trip._id);
      if (studentRouteId) {
        socketRef.current?.emit("leave-route-room", studentRouteId);
      }
      socketRef.current?.disconnect();
    };
  }, [activeBooking]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 h-full flex items-center justify-center bg-app-bg overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-app-bd border-t-app-am rounded-full animate-spin"></div>
          <div className="animate-pulse text-app-mu font-black uppercase tracking-widest text-[10px]">{t("connecting_gps")}</div>
        </div>
      </div>
    );
  }

  if (!activeBooking) {
    return (
      <div className="p-4 md:p-6 h-full flex flex-col bg-app-bg overflow-hidden animate-in fade-in duration-500">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-app-card border border-app-bd rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-xl hover:border-app-am/30 transition-all">
            <div className="w-16 h-16 bg-app-card2 rounded-full flex items-center justify-center mx-auto mb-6 text-app-mu border border-app-bd">
              <Ic.Bus size={24} />
            </div>
            <h2 className="text-lg font-black font-syne uppercase tracking-widest text-app-tx mb-2">{t("no_active_trips")}</h2>
            <p className="text-xs text-app-mu font-medium leading-relaxed mb-8">
              {t("no_active_trips_track")}
            </p>
            <button
              onClick={() => {
                if (go) go("bookTrip");
                navigate('/book-trip');
              }}
              className="bg-app-am text-black px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all w-full flex items-center justify-center gap-2"
            >
              <Ic.Calendar /> {t("book_a_seat")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const routeStops = activeBooking.trip?.route?.stops || [];
  const busNumber = activeBooking.trip?.bus_number || t("awaiting_assignment");
  const driverName = activeBooking.trip?.driver || t("pending_driver");

  const activeBusCoords = Array.from(activeBuses.values())
    .filter((bus: any) => bus.lat !== undefined && bus.lng !== undefined)
    .map((bus: any) => [bus.lat, bus.lng] as [number, number]);
  const firstBusPos = activeBusCoords[0];
  const pickupStop = activeBooking.trip?.route?.stops?.find((s: any) => s._id === activeBooking.pickup_point);
  const centerLat = firstBusPos?.[0] || activeBooking.trip?.current_location?.lat || pickupStop?.location?.lat || 24.0889;
  const centerLng = firstBusPos?.[1] || activeBooking.trip?.current_location?.lng || pickupStop?.location?.lng || 32.8998;
  const center: [number, number] = [centerLat, centerLng];

  const tileUrl = theme === "dark" 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  // Debug Log required by USER
  console.log('Student State Active Buses:', activeBuses);

  return (
    <div className="p-4 md:p-6 space-y-6 h-full flex flex-col bg-app-bg overflow-hidden animate-in fade-in duration-500">

      {/* ── Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

        {/* 1. Map (Left Side) */}
        <div className="col-span-1 lg:col-span-7 bg-app-card rounded-[32px] p-5 border border-app-bd flex flex-col min-h-[400px] shadow-2xl relative overflow-hidden transition-all hover:border-app-bd2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-syne font-black text-app-tx uppercase tracking-tight text-sm">{t("live_movement")}</h4>
              <p className="text-[10px] text-app-mu font-bold tracking-[2px]">{t("gps_connected")}</p>
            </div>
            <button
              onClick={() => go?.("dashboard")}
              className="group flex items-center gap-2 bg-app-card2 border border-app-bd px-3 py-1.5 rounded-xl text-[10px] font-bold text-app-mu hover:text-app-tx transition-all"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> {t("back")}
            </button>
          </div>

          <div className="relative flex-1 rounded-[24px] overflow-hidden border border-app-bd z-10 bg-app-card2 h-full min-h-[300px]">


            <MapContainer center={center} zoom={15} zoomControl={false} className="h-full w-full">
              <TileLayer url={tileUrl} />
              <MapUpdater theme={theme} center={center} />
              {Array.from(activeBuses.values()).map((bus: any) => (
                <Marker key={bus.busId} position={[bus.lat, bus.lng]} icon={busIcon} />
              ))}
            </MapContainer>

            {/* Arrival Tag Floating */}
            <div className="absolute top-4 right-4 z-[1000] bg-app-card/80 backdrop-blur-xl p-3 px-6 rounded-2xl border border-white/5 text-center shadow-2xl">
              <p className="text-[9px] text-app-mu font-black uppercase tracking-widest mb-1">{t("arrival_in")}</p>
              <p className="font-syne text-2xl font-black text-app-am">{eta} <span className="text-[10px]">{t("min")}</span></p>
            </div>
          </div>
        </div>

        {/* 2. Trip Data (Right Side) */}
        <div className="col-span-1 lg:col-span-5 space-y-4 flex flex-col h-full min-h-0">

          {/* Bus Card */}
          <div className="bg-app-card rounded-[24px] p-5 flex justify-between items-center border border-app-bd shadow-lg transition-transform hover:scale-[1.01]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-app-am-d rounded-2xl flex items-center justify-center text-app-am border border-app-am/10 shadow-inner">
                <Ic.Bus />
              </div>
              <div>
                <h4 className="font-syne font-black text-app-tx uppercase text-sm tracking-tight">{busNumber}</h4>
                <p className="text-[11px] text-app-mu font-medium">{t("driver_prefix")} {driverName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-app-mu font-black uppercase tracking-tighter">{t("current_speed")}</p>
              <p className="text-app-am font-syne font-bold text-sm tracking-tight">{t("speed_kmh", { speed: 42 })}</p>
            </div>
          </div>

          {/* Stops Timeline */}
          <div className="bg-app-card rounded-[32px] p-6 flex-1 border border-app-bd shadow-xl overflow-hidden flex flex-col">
            <h4 className="font-syne font-black text-xs mb-8 text-app-tx uppercase tracking-[3px] flex items-center gap-2">
              <Ic.Route className="text-app-am" /> {t("route_stops")}
            </h4>

            <div className="flex-1 space-y-8 relative ml-4 overflow-y-auto no-scrollbar pb-6 pr-2">
              {routeStops.length > 0 && (
                <div className="absolute left-4 top-2 bottom-6 w-[1.5px] bg-app-bd2" />
              )}
              {routeStops.map((stop: any, idx: number) => (
                <StopItem
                  key={stop._id}
                  stop={stop}
                  isPickup={stop._id === activeBooking.pickup_point}
                  index={idx}
                />
              ))}
              {routeStops.length === 0 && (
                <div className="text-[10px] text-app-mu font-bold uppercase tracking-widest text-center mt-10">
                  {t("no_stops_found")}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}