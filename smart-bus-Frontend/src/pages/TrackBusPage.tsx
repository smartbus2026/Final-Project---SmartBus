import { useEffect, useRef } from "react";
import type { Stop } from "../types";

const stops: Stop[] = [
  { id: 1, name: "Aqaleem Gate", time: "Passed 7:30 AM", done: true, active: false },
  { id: 2, name: "Al-Rawda Square", time: "Estimated 7:38 AM", done: false, active: true },
  { id: 3, name: "City Center", time: null, done: false, active: false },
  { id: 4, name: "Stadium", time: null, done: false, active: false },
];

function StopItem({ stop }: { stop: Stop }) {
  if (stop.done) {
    return (
      <div className="flex items-center gap-4 relative">
        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-success/20 text-green-600 dark:text-success flex items-center justify-center z-10 border border-green-200 dark:border-success/40">
          <i className="fas fa-check text-[10px]" />
        </div>
        <div>
          <p className="text-sm font-semibold dark:text-white">{stop.name}</p>
          <p className="text-[10px] text-gray-400">{stop.time}</p>
        </div>
      </div>
    );
  }

  if (stop.active) {
    return (
      <div className="flex items-center gap-4 relative">
        <div className="w-8 h-8 rounded-full bg-accent text-black flex items-center justify-center font-bold z-10 text-xs shadow-lg shadow-accent/40">
          {stop.id}
        </div>
        <div>
          <p className="text-sm font-bold text-accent">{stop.name}</p>
          <p className="text-[10px] text-gray-500">{stop.time}</p>
        </div>
        <div className="ml-auto bg-accent/20 text-accent text-[8px] px-2 py-0.5 rounded-md font-bold border border-accent/20">
          NEXT
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 relative opacity-40">
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center z-10 text-xs text-gray-500">
        {stop.id}
      </div>
      <div>
        <p className="text-sm font-medium dark:text-white">{stop.name}</p>
      </div>
    </div>
  );
}

interface TrackBusPageProps {
  darkMode: boolean;
}

export default function TrackBusPage({ darkMode }: TrackBusPageProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  function updateMapTheme(isDark: boolean, mapInstance: L.Map): void {
    if (tileLayerRef.current) mapInstance.removeLayer(tileLayerRef.current);
    const style = isDark ? "dark_all" : "rastertiles/voyager";
    tileLayerRef.current = window.L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`
    ).addTo(mapInstance);
  }

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current || !window.L) return;

    const map = window.L.map(mapRef.current, { zoomControl: false }).setView(
      [30.0444, 31.2357],
      15
    );
    mapInstanceRef.current = map;
    updateMapTheme(document.documentElement.classList.contains("dark"), map);

    const busIcon = window.L.divIcon({
      className: "custom-bus-marker",
      html: `<div style="background-color:#f9b233;width:15px;height:15px;border-radius:50%;border:2px solid white;box-shadow:0 0 15px #f9b233;"></div>`,
      iconSize: [15, 15],
      iconAnchor: [7, 7],
    });

    window.L.marker([30.0444, 31.2357], { icon: busIcon }).addTo(map);
    setTimeout(() => map.invalidateSize(), 400);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMapTheme(darkMode, mapInstanceRef.current);
    }
  }, [darkMode]);

  return (
    <div className="flex-1 p-4 lg:p-8 overflow-y-auto lg:overflow-hidden no-scrollbar">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

        <div className="col-span-1 lg:col-span-7 bg-white dark:bg-cardBg rounded-[2rem] p-4 lg:p-6 border border-gray-200 dark:border-white/5 flex flex-col h-[450px] lg:h-full shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Live Map</h4>
              <p className="text-[10px] text-textGray">Real-time GPS status</p>
            </div>
            <span className="text-[10px] bg-green-500/10 text-success border border-success/20 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
              ● active
            </span>
          </div>
          <div className="relative flex-1 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-inner">
            <div ref={mapRef} style={{ height: "100%", width: "100%", zIndex: 1, borderRadius: "1rem" }} />
            <div className="absolute top-4 right-4 z-[1000] bg-white/90 dark:bg-darkBg/90 backdrop-blur-md p-2 px-4 rounded-xl border border-gray-200 dark:border-white/10 text-center shadow-lg">
              <p className="text-[8px] text-textGray font-bold uppercase tracking-widest">Arrival In</p>
              <p className="text-lg font-black text-accent">3 min</p>
            </div>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-5 space-y-4 flex flex-col lg:h-full pb-8 lg:pb-0">
          <div className="bg-white dark:bg-cardBg rounded-2xl p-4 flex justify-between items-center border border-gray-200 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                <i className="fas fa-bus text-lg" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">BUS-12</h4>
                <p className="text-[10px] text-textGray">Aqaleem → Stadium</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-textGray font-bold uppercase">Target Stop</p>
              <p className="text-accent font-bold text-xs tracking-tight">AL-RAWDA SQUARE</p>
            </div>
          </div>

          <div className="bg-white dark:bg-cardBg rounded-[2rem] p-6 flex-1 border border-gray-200 dark:border-white/5 shadow-sm flex flex-col overflow-hidden">
            <h4 className="font-bold text-base mb-6 text-gray-900 dark:text-white">Pickup Progress</h4>
            <div className="flex-1 space-y-8 relative ml-2 overflow-y-auto no-scrollbar">
              <div className="absolute left-4 top-2 bottom-2 w-[1px] bg-gray-200 dark:bg-white/10" />
              {stops.map((stop) => (
                <StopItem key={stop.id} stop={stop} />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
