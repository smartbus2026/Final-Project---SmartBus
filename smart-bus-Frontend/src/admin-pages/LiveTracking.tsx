import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Activity, MapPin, BusFront, Navigation } from 'lucide-react'; 

import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png', 
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  shadowUrl: markerShadow,
  shadowSize: [41, 41]
});

const socket = io("http://localhost:5001");

// مكون لتحريك الكاميرا للأتوبيس اللي الأدمن يختاره
const MapUpdater = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 16, { duration: 1.5 });
  }, [center, map]);
  return null;
};

// تعريف نوع بيانات الأتوبيس
type BusData = {
  tripId: string;
  lat: number;
  lng: number;
  path: [number, number][];
  address: string;
  lastUpdate: Date;
};

export default function LiveTracking() {
  // تخزين كل الأتوبيسات النشطة (المفتاح هو tripId)
  const [activeBuses, setActiveBuses] = useState<Record<string, BusData>>({});
  // الأتوبيس اللي الأدمن عامل عليه Focus حالياً
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  useEffect(() => {
    // الأدمن بينضم لغرفة الأدمنز عشان يستقبل إشارات كل الأتوبيسات
    socket.emit("join-admin-room");

    socket.on("admin-bus-update", async (data: { tripId: string, lat: number, lng: number }) => {
      const newPos: [number, number] = [data.lat, data.lng];
      
      setActiveBuses((prev) => {
        const existingBus = prev[data.tripId];
        const newPath = existingBus ? [...existingBus.path, newPos] : [newPos];
        
        return {
          ...prev,
          [data.tripId]: {
            tripId: data.tripId,
            lat: data.lat,
            lng: data.lng,
            path: newPath,
            address: existingBus?.address || "جاري تحديد الموقع...", // هيفضل محتفظ بالعنوان القديم لحد ما يتحدث
            lastUpdate: new Date()
          }
        };
      });
    });

    return () => {
      socket.emit("leave-admin-room");
      socket.off("admin-bus-update");
      socket.disconnect();
    };
  }, []);

  // دالة لجلب العنوان الدقيق باستخدام Nominatim (مجاني وأدق)
  const fetchAddress = async (tripId: string, lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`);
      const result = await response.json();
      
      const locationName = result.address?.suburb || result.address?.city_district || result.address?.town || result.address?.city || "موقع غير معروف";
      
      setActiveBuses((prev) => ({
        ...prev,
        [tripId]: { ...prev[tripId], address: locationName }
      }));
    } catch (err) {
      console.error("Geocoding Error:", err);
    }
  };

  const activeBusesArray = Object.values(activeBuses);
  const selectedBus = selectedTripId ? activeBuses[selectedTripId] : null;

  return (
    <div className="flex-1 bg-[#0f1115] p-8 h-screen flex flex-col font-sans">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">
            Fleet <span className="text-amber-500">Command</span> Center
          </h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">
            Active Vehicles: {activeBusesArray.length}
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* الخريطة الكبيرة */}
        <div className="flex-[3] rounded-[2.5rem] overflow-hidden border border-zinc-800 shadow-2xl relative">
          <MapContainer center={[24.0889, 32.8998]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            
            <MapUpdater center={selectedBus ? [selectedBus.lat, selectedBus.lng] : null} />
            
            {/* رسم كل الأتوبيسات النشطة */}
            {activeBusesArray.map((bus) => (
              <React.Fragment key={bus.tripId}>
                {/* رسم خط المسار للأتوبيس المحدد فقط عشان الزحمة */}
                {selectedTripId === bus.tripId && (
                  <Polyline positions={bus.path} color="#f59e0b" weight={4} opacity={0.6} dashArray="10, 10" />
                )}
                <Marker 
                  position={[bus.lat, bus.lng]} 
                  icon={busIcon}
                  eventHandlers={{
                    click: () => {
                      setSelectedTripId(bus.tripId);
                      fetchAddress(bus.tripId, bus.lat, bus.lng); // بنجيب العنوان بس لما الأدمن يختاره عشان منعملش Load
                    }
                  }}
                >
                  <Popup>
                    <div className="text-center font-bold">
                      <p className="text-amber-600">Trip: {bus.tripId}</p>
                      <p className="text-[10px] text-zinc-500">{bus.address}</p>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            ))}
          </MapContainer>
        </div>

        {/* لوحة التحكم الجانبية (Sidebar) */}
        <div className="flex-1 flex flex-col gap-4 hidden lg:flex">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] flex-1 overflow-y-auto">
            <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity size={14} className="text-amber-500" /> Active Trips
            </h3>
            
            {activeBusesArray.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 opacity-50">
                <BusFront size={32} className="text-zinc-600 mb-3" />
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No Active Signals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeBusesArray.map((bus) => (
                  <div 
                    key={bus.tripId}
                    onClick={() => {
                      setSelectedTripId(bus.tripId);
                      fetchAddress(bus.tripId, bus.lat, bus.lng);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedTripId === bus.tripId 
                        ? 'bg-amber-500/10 border-amber-500/30' 
                        : 'bg-zinc-950/50 border-zinc-800/50 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${new Date().getTime() - new Date(bus.lastUpdate).getTime() < 10000 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-[11px] font-black text-white uppercase">{bus.tripId}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 mt-3">
                      <MapPin size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-zinc-400" dir="rtl">
                        {selectedTripId === bus.tripId ? bus.address : "اضغط لعرض الموقع"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}