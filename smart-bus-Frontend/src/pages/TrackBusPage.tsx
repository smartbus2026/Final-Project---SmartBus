import { useEffect, useRef, useState } from "react";
import { Ic } from "../icons";
import type { Page } from "../types";

const stops = [
  { id: 1, name: "Aqaleem Gate", time: "Passed 7:30 AM", done: true, active: false },
  { id: 2, name: "Al-Rawda Square", time: "Estimated 7:38 AM", done: false, active: true },
  { id: 3, name: "City Center", time: "Pending", done: false, active: false },
  { id: 4, name: "Stadium", time: "Pending", done: false, active: false },
];

function StopItem({ stop }: { stop: any }) {
  const baseLine = "flex items-center gap-5 relative transition-all duration-500";
  
  if (stop.done) {
    return (
      <div className={`${baseLine} opacity-100`}>
        <div className="w-8 h-8 rounded-full bg-green-500/10 text-app-ok flex items-center justify-center z-10 border border-green-500/20 shadow-lg shadow-green-500/5">
          <Ic.Check />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-bold font-syne text-app-tx">{stop.name}</p>
          <p className="text-[10px] text-app-mu font-medium">{stop.time}</p>
        </div>
      </div>
    );
  }

  if (stop.active) {
    return (
      <div className={`${baseLine} opacity-100 scale-[1.02]`}>
        <div className="w-8 h-8 rounded-full bg-app-am text-black flex items-center justify-center font-bold z-10 text-xs shadow-xl shadow-app-am/30 border-2 border-white/20">
          {stop.id}
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-bold font-syne text-app-am uppercase tracking-tight">{stop.name}</p>
          <p className="text-[10px] text-app-mu font-medium">{stop.time}</p>
        </div>
        <span className="bg-app-am/20 text-app-am text-[8px] px-2 py-0.5 rounded-md font-black border border-app-am/20 tracking-tighter">
          NEXT STOP
        </span>
      </div>
    );
  }

  return (
    <div className={`${baseLine} opacity-30`}>
      <div className="w-8 h-8 rounded-full bg-app-card2 text-app-mu flex items-center justify-center z-10 text-xs border border-app-bd">
        {stop.id}
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
  const [eta, setEta] = useState(3); // وقت الوصول المتوقع

  // دالة تحديث ثيم الخريطة (Dark/Light)
  const updateMapTheme = (isDark: boolean, mapInstance: any) => {
    if (tileLayerRef.current) mapInstance.removeLayer(tileLayerRef.current);
    const style = isDark ? "dark_all" : "rastertiles/voyager";
    tileLayerRef.current = (window as any).L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`
    ).addTo(mapInstance);
  };

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current || !(window as any).L) return;

    const L = (window as any).L;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([30.0444, 31.2357], 15);
    mapInstanceRef.current = map;

    updateMapTheme(theme === "dark", map);

    const busIcon = L.divIcon({
      className: "custom-bus-marker",
      html: `<div style="background-color:#f7a01b;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 20px #f7a01b;"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    // إضافة ماركر الأتوبيس
    L.marker([30.0444, 31.2357], { icon: busIcon }).addTo(map);
    
    setTimeout(() => map.invalidateSize(), 400);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMapTheme(theme === "dark", mapInstanceRef.current);
    }
  }, [theme]);

  return (
    <div className="p-4 md:p-6 space-y-6 h-full flex flex-col bg-app-bg overflow-hidden animate-in fade-in duration-500">
      
      {/* ── Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* 1. الخريطة (الجانب الأيسر) */}
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

        {/* 2. بيانات الرحلة (الجانب الأيمن) */}
        <div className="col-span-1 lg:col-span-5 space-y-4 flex flex-col h-full min-h-0">
          
          {/* كارت الأتوبيس */}
          <div className="bg-app-card rounded-[24px] p-5 flex justify-between items-center border border-app-bd shadow-lg transition-transform hover:scale-[1.01]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-app-am-d rounded-2xl flex items-center justify-center text-app-am border border-app-am/10 shadow-inner">
                <Ic.Bus />
              </div>
              <div>
                <h4 className="font-syne font-black text-app-tx uppercase text-sm tracking-tight">BUS #B-12</h4>
                <p className="text-[11px] text-app-mu font-medium">Driver: Ahmed Safwat</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-app-mu font-black uppercase tracking-tighter">Current Speed</p>
              <p className="text-app-am font-syne font-bold text-sm tracking-tight">42 km/h</p>
            </div>
          </div>

          {/* خط السير (Stops Progress) */}
          <div className="bg-app-card rounded-[32px] p-6 flex-1 border border-app-bd shadow-xl overflow-hidden flex flex-col">
            <h4 className="font-syne font-black text-xs mb-8 text-app-tx uppercase tracking-[3px] flex items-center gap-2">
               <Ic.Route className="text-app-am" /> Pickup Timeline
            </h4>
            
            {/* القائمة مع إخفاء السكرول بار */}
            <div className="flex-1 space-y-8 relative ml-4 overflow-y-auto no-scrollbar pb-6 pr-2">
              <div className="absolute left-4 top-2 bottom-6 w-[1.5px] bg-app-bd2" />
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