import { useEffect, useRef, useState } from "react";
import { Ic } from "../icons";
import type { Page } from "../types";
import Api from "../services/Api";

function StopItem({ stop, isPickup, index }: { stop: any, isPickup: boolean, index: number }) {
  const baseLine = "flex items-center gap-5 relative transition-all duration-500";

  if (isPickup) {
    return (
      <div className={`${baseLine} opacity-100 scale-[1.02]`}>
        <div className="w-8 h-8 rounded-full bg-app-am text-black flex items-center justify-center font-bold z-10 text-xs shadow-xl shadow-app-am/30 border-2 border-white/20">
          {index + 1}
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-bold font-syne text-app-am uppercase tracking-tight">{stop.name}</p>
          <p className="text-[10px] text-app-mu font-medium">Your Pickup Point</p>
        </div>
        <span className="bg-app-am/20 text-app-am text-[8px] px-2 py-0.5 rounded-md font-black border border-app-am/20 tracking-tighter animate-pulse">
          STAND HERE
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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const busMarkerRef = useRef<any>(null);

  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eta, setEta] = useState(12);

  // Fetch student bookings
  useEffect(() => {
    const fetchActiveBooking = async () => {
      try {
        const res = await Api.get('/bookings/my');
        const bookings = res.data?.data?.bookings || [];

        // Find today's active/scheduled booking
        const today = new Date().toDateString();
        const active = bookings.find((b: any) => {
          if (b.status === 'cancelled' || !b.trip) return false;
          const tripDate = new Date(b.trip.date).toDateString();
          return tripDate === today && ['scheduled', 'active'].includes(b.trip.status);
        });

        setActiveBooking(active || null);
      } catch (err) {
        console.error("Failed to fetch active booking", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActiveBooking();
  }, []);

  const updateMapTheme = (isDark: boolean, mapInstance: any) => {
    if (tileLayerRef.current) mapInstance.removeLayer(tileLayerRef.current);
    const style = isDark ? "dark_all" : "rastertiles/voyager";
    tileLayerRef.current = (window as any).L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`
    ).addTo(mapInstance);
  };

  useEffect(() => {
    if (!activeBooking || mapInstanceRef.current || !mapRef.current || !(window as any).L) return;

    const L = (window as any).L;

    // Determine starting location: Bus current location, or fallback to the pickup point coordinates
    const pickupStop = activeBooking.trip?.route?.stops?.find((s: any) => s._id === activeBooking.pickup_point);
    let centerLat = pickupStop?.location?.lat || 30.0444;
    let centerLng = pickupStop?.location?.lng || 31.2357;

    if (activeBooking.trip?.current_location?.lat) {
      centerLat = activeBooking.trip.current_location.lat;
      centerLng = activeBooking.trip.current_location.lng;
    }

    const map = L.map(mapRef.current, { zoomControl: false }).setView([centerLat, centerLng], 15);
    mapInstanceRef.current = map;

    updateMapTheme(theme === "dark", map);

    const busIcon = L.divIcon({
      className: "custom-bus-marker",
      html: `<div style="background-color:#f7a01b;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 20px #f7a01b;"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    busMarkerRef.current = L.marker([centerLat, centerLng], { icon: busIcon }).addTo(map);

    setTimeout(() => map.invalidateSize(), 400);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeBooking]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMapTheme(theme === "dark", mapInstanceRef.current);
    }
  }, [theme]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 h-full flex items-center justify-center bg-app-bg overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-app-bd border-t-app-am rounded-full animate-spin"></div>
          <div className="animate-pulse text-app-mu font-black uppercase tracking-widest text-[10px]">Connecting to Fleet GPS...</div>
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
            <h2 className="text-lg font-black font-syne uppercase tracking-widest text-app-tx mb-2">No Active Trips</h2>
            <p className="text-xs text-app-mu font-medium leading-relaxed mb-8">
              You have no active or scheduled trips to track right now. Please book a seat first.
            </p>
            <button
              onClick={() => go?.("bookTrip")}
              className="bg-app-am text-black px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all w-full flex items-center justify-center gap-2"
            >
              <Ic.Calendar /> Book a Seat
            </button>
          </div>
        </div>
      </div>
    );
  }

  const routeStops = activeBooking.trip?.route?.stops || [];
  const busNumber = activeBooking.trip?.bus_number || "AWAITING ASSIGNMENT";
  const driverName = activeBooking.trip?.driver || "Pending Driver";

  return (
    <div className="p-4 md:p-6 space-y-6 h-full flex flex-col bg-app-bg overflow-hidden animate-in fade-in duration-500">

      {/* ── Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

        {/* 1. Map (Left Side) */}
        <div className="col-span-1 lg:col-span-7 bg-app-card rounded-[32px] p-5 border border-app-bd flex flex-col min-h-[400px] shadow-2xl relative overflow-hidden transition-all hover:border-app-bd2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-syne font-black text-app-tx uppercase tracking-tight text-sm">Live Movement</h4>
              <p className="text-[10px] text-app-mu font-bold tracking-[2px]">GPS CONNECTED</p>
            </div>
            <button
              onClick={() => go?.("dashboard")}
              className="group flex items-center gap-2 bg-app-card2 border border-app-bd px-3 py-1.5 rounded-xl text-[10px] font-bold text-app-mu hover:text-app-tx transition-all"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> BACK
            </button>
          </div>

          <div className="relative flex-1 rounded-[24px] overflow-hidden border border-app-bd z-10">
            <div ref={mapRef} className="h-full w-full" />

            {/* Arrival Tag Floating */}
            <div className="absolute top-4 right-4 z-[1000] bg-app-card/80 backdrop-blur-xl p-3 px-6 rounded-2xl border border-white/5 text-center shadow-2xl">
              <p className="text-[9px] text-app-mu font-black uppercase tracking-widest mb-1">Arrival In</p>
              <p className="font-syne text-2xl font-black text-app-am">{eta} <span className="text-[10px]">MIN</span></p>
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
                <p className="text-[11px] text-app-mu font-medium">Driver: {driverName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-app-mu font-black uppercase tracking-tighter">Current Speed</p>
              <p className="text-app-am font-syne font-bold text-sm tracking-tight">42 km/h</p>
            </div>
          </div>

          {/* Stops Timeline */}
          <div className="bg-app-card rounded-[32px] p-6 flex-1 border border-app-bd shadow-xl overflow-hidden flex flex-col">
            <h4 className="font-syne font-black text-xs mb-8 text-app-tx uppercase tracking-[3px] flex items-center gap-2">
              <Ic.Route className="text-app-am" /> Route Stops
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
                  No stops found for this route.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}