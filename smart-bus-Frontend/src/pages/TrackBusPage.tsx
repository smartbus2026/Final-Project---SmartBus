import { useEffect, useRef } from "react";
import { Ic } from "../icons";

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

export default function TrackBusPage({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

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
      html: `<div style="background-color:#f7a01b;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 20px #f7a01b;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    L.marker([30.0444, 31.2357], { icon: busIcon }).addTo(map);
    setTimeout(() => map.invalidateSize(), 400);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMapTheme(theme === "dark", mapInstanceRef.current);
    }
  }, [theme]);

  return (
    <div className="p-6 space-y-6 h-full flex flex-col overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* ── الخريطة ── */}
        <div className="col-span-1 lg:col-span-7 bg-app-card rounded-[24px] p-5 border border-app-bd flex flex-col min-h-[400px] shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-syne font-bold text-app-tx uppercase tracking-tight">Live Map</h4>
              <p className="text-[10px] text-app-mu">Real-time GPS status</p>
            </div>
            <span className="flex items-center gap-1.5 text-[9px] bg-green-500/10 text-app-ok border border-green-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
               <span className="w-1.5 h-1.5 bg-app-ok rounded-full animate-pulse"></span> active
            </span>
          </div>
          
          <div className="relative flex-1 rounded-2xl overflow-hidden border border-app-bd shadow-inner z-10">
            <div ref={mapRef} className="h-full w-full" />
            
            <div className="absolute top-4 right-4 z-[1000] bg-app-card/90 backdrop-blur-md p-3 px-5 rounded-2xl border border-app-bd text-center shadow-2xl">
              <p className="text-[9px] text-app-mu font-bold uppercase tracking-widest mb-1">Arrival In</p>
              <p className="font-syne text-xl font-black text-app-am">3 min</p>
            </div>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-5 space-y-4 flex flex-col h-full min-h-0">
          
          <div className="bg-app-card rounded-2xl p-5 flex justify-between items-center border border-app-bd shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-app-am-d rounded-xl flex items-center justify-center text-app-am border border-app-am/10">
                <Ic.Bus />
              </div>
              <div>
                <h4 className="font-syne font-extrabold text-app-tx uppercase">BUS-12</h4>
                <p className="text-[11px] text-app-mu">Aqaleem <span className="mx-1">→</span> Stadium</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-app-mu font-bold uppercase tracking-tighter">Target Stop</p>
              <p className="text-app-am font-syne font-bold text-xs uppercase tracking-tight">Al-Rawda Square</p>
            </div>
          </div>

          <div className="bg-app-card rounded-[24px] p-6 flex-1 border border-app-bd shadow-lg overflow-hidden flex flex-col">
            <h4 className="font-syne font-bold text-sm mb-8 text-app-tx uppercase tracking-wider flex items-center gap-2">
               <Ic.Route /> Pickup Progress
            </h4>
            
            <div className="flex-1 space-y-8 relative ml-4 overflow-y-auto no-scrollbar pb-4">
              <div className="absolute left-4 top-2 bottom-2 w-[1px] bg-app-bd2" />
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