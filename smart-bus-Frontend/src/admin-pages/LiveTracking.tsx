import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { io, Socket } from 'socket.io-client';
import { Ic } from '../icons';
import Api from '../services/Api';

interface TripStop {
  name: string;
  time: string;
  isCompleted: boolean;
}

interface ActiveTrip {
  id: string;
  routeName: string;
  busId: string;
  busNumber: string;
  driverName: string;
  status: string;
  progress: number;
  lastStop: string | null;
  nextStop: string | null;
  stops: TripStop[];
}

const getTripProgress = (stops: TripStop[]): number => {
  if (!stops || stops.length === 0) return 0;
  const completed = stops.filter((s) => s.isCompleted).length;
  return Math.round((completed / stops.length) * 100);
};

const getLastCompleted = (stops: TripStop[]): string | null => {
  if (!stops) return null;
  const done = stops.filter((s) => s.isCompleted);
  return done.length ? done[done.length - 1].name : null;
};

const getNextStop = (stops: TripStop[]): string | null => {
  if (!stops) return null;
  const next = stops.find((s) => !s.isCompleted);
  return next ? next.name : null;
};

const busIcon = new L.DivIcon({
  className: "custom-bus-marker",
  html: `<div style="background-color:#f7a01b;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 20px #f7a01b;"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const LiveTracking: React.FC = () => {
  const { t } = useTranslation();
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busLocations, setBusLocations] = useState<Record<string, [number, number]>>({});
  const socketRef = useRef<Socket | null>(null);

  const fetchActiveTrips = async () => {
    try {
      const res = await Api.get('/trips');
      const allTrips = res.data?.data || res.data || [];
      
      const activeRaw = allTrips.filter((trip: any) => trip.status === 'active' || trip.status === 'in-progress' || trip.status === 'in_progress');
      
      const mapped: ActiveTrip[] = activeRaw.map((trip: any) => {
        const stops = (trip.route?.stops || []).map((stop: any, index: number) => ({
          name: typeof stop === 'string' ? stop : stop.name || t('stop_default'),
          time: t('tba'),
          isCompleted: index === 0
        }));

        return {
          id: trip._id,
          routeName: trip.route?.name || t('unknown_route'),
          busId: trip.bus?._id || trip.bus_number || 'unknown-bus',
          busNumber: trip.bus_number || t('unknown_bus'),
          driverName: trip.driver?.name || t('pending_driver'),
          status: trip.status || 'Active',
          progress: getTripProgress(stops),
          lastStop: getLastCompleted(stops),
          nextStop: getNextStop(stops),
          stops,
        };
      });

      setActiveTrips(mapped);
    } catch (err) {
      console.error("Failed to fetch active trips", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTrips();
    const interval = setInterval(fetchActiveTrips, 30000);
    return () => clearInterval(interval);
  }, [t]);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5001", {
      transports: ["websocket", "polling"]
    });

    socketRef.current.emit("join-admin-tracking");

    socketRef.current.on("bus_location_update", (data: any) => {
      if (data.busId && data.lat !== undefined && data.lng !== undefined) {
        setBusLocations(prev => ({
          ...prev,
          [data.busId]: [data.lat, data.lng]
        }));
      } else if (data.tripId && data.location) {
        setBusLocations(prev => ({
          ...prev,
          [data.tripId]: [data.location.lat, data.location.lng]
        }));
      }
    });

    socketRef.current.on("trip_status_update", (data: any) => {
      if (data.tripId && data.status === "completed") {
        setBusLocations(prev => {
          const next = { ...prev };
          delete next[data.tripId];
          return next;
        });
        setActiveTrips(prev => prev.filter(trip => trip.id !== data.tripId));
      }
    });

    return () => {
      socketRef.current?.emit("leave-admin-tracking");
      socketRef.current?.disconnect();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 bg-app-bg text-app-tx p-8 flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-app-mu font-black uppercase tracking-widest text-[10px]">{t('locating_active_fleet')}</div>
      </div>
    );
  }

  const mapCenter: [number, number] = [24.0889, 32.8998];
  const tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  const tripsWithLocations = activeTrips.filter(trip => busLocations[trip.busId] || busLocations[trip.id]);
  const hasEmittingBuses = tripsWithLocations.length > 0;

  return (
    <div className="flex-1 bg-app-bg text-app-tx p-8 overflow-y-auto custom-scrollbar min-h-screen no-scrollbar">
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-widest text-app-tx">{t('live_tracking')}</h1>
        <p className="text-[10px] font-black text-app-mu uppercase tracking-[0.2em] mt-1">{t('real_time_fleet_monitoring')}</p>
      </div>

      {(!hasEmittingBuses || activeTrips.length === 0) ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 bg-app-card border border-app-bd rounded-[2.5rem] shadow-xl p-8">
          <div className="w-20 h-20 bg-app-am/10 border border-app-am/20 text-app-am rounded-full flex items-center justify-center animate-pulse">
            <Ic.Target size={36} />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-app-tx text-center mt-2">
            {t('no_active_trips_now')}
          </p>
          <p className="text-[11px] font-bold text-app-mu uppercase tracking-widest text-center max-w-md mt-1 leading-relaxed">
            {t('waiting_for_drivers')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="w-full h-[50vh] bg-app-card border border-app-bd rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            <MapContainer center={mapCenter} zoom={14} zoomControl={false} className="h-full w-full">
              <TileLayer url={tileUrl} />
              {tripsWithLocations.map(trip => {
                const position = busLocations[trip.busId] || busLocations[trip.id] || mapCenter;
                return (
                  <Marker key={trip.id} position={position} icon={busIcon}>
                    <Popup className="custom-popup">
                      <div className="font-syne font-bold text-sm text-black p-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t('route_name_label')}</p>
                        <p className="text-sm font-black text-app-am bg-black/5 px-2 py-1 rounded-md mb-2">{trip.routeName}</p>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t('bus_number_label')}</p>
                        <p className="text-sm font-black text-black">{trip.busNumber}</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
            
            <div className="absolute top-6 left-6 z-[1000] bg-app-card/90 backdrop-blur-md border border-app-bd p-4 rounded-2xl shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-app-am animate-pulse"></span>
                 {t('active_fleet_count', { count: tripsWithLocations.length })}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {tripsWithLocations.map(trip => (
              <div key={trip.id} className="bg-app-card border border-app-bd rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-app-am/20 flex flex-col">
                
                <div className="p-6 border-b border-app-bd flex justify-between items-center bg-gradient-to-r from-app-am/5 to-transparent">
                  <div className="flex items-center gap-4">
                    <div className="bg-app-am/10 text-app-am p-3 rounded-2xl">
                      <Ic.Bus size={20} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-tight">{trip.routeName}</h2>
                      <p className="text-[10px] text-app-mu font-black uppercase tracking-widest mt-1">
                        {trip.busNumber} • {t('driver_name_prefix', { name: trip.driverName })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-app-ok opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-app-ok"></span>
                    </span>
                    <span className="text-[10px] font-black text-app-ok uppercase tracking-widest">{t('active')}</span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-6">
                  <div className="flex items-center justify-between bg-app-bg p-4 rounded-2xl border border-app-bd">
                     <div className="flex items-center gap-3">
                        <Ic.Map className="text-app-mu" size={20} />
                        <div>
                           <p className="text-[10px] font-black uppercase text-app-mu tracking-widest">{t('current_location')}</p>
                           <p className="text-xs font-bold font-syne text-app-tx mt-1">
                              {busLocations[trip.busId] || busLocations[trip.id]
                                ? `${(busLocations[trip.busId] || busLocations[trip.id])[0].toFixed(4)}, ${(busLocations[trip.busId] || busLocations[trip.id])[1].toFixed(4)}`
                                : t('locating')}
                           </p>
                        </div>
                     </div>
                     <button className="text-[10px] bg-app-am/10 text-app-am px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border border-app-am/20 hover:bg-app-am hover:text-black transition-colors">
                        {t('view_on_map')}
                     </button>
                  </div>

                  <div className="bg-app-card2 p-5 rounded-2xl border border-app-bd">
                    <div className="flex justify-between items-end mb-3">
                       <p className="text-[10px] text-app-mu font-black uppercase tracking-widest">{t('route_progress')}</p>
                       <p className="text-[10px] text-app-am font-black uppercase tracking-widest">{trip.progress}%</p>
                    </div>
                    <div className="relative h-2 w-full bg-app-bd rounded-full overflow-hidden mb-4">
                      <div
                        className="absolute top-0 left-0 h-full bg-app-am rounded-full transition-all duration-1000"
                        style={{ width: `${trip.progress}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                         <Ic.Check size={12} className="text-app-ok" />
                         <span className="text-app-mu">{t('passed_label')} <span className="text-app-tx">{trip.lastStop || t('none_label')}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-app-mu">{t('next_label')} <span className="text-app-am animate-pulse">{trip.nextStop || t('arriving')}</span></span>
                         <Ic.Target size={12} className="text-app-am" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTracking;
