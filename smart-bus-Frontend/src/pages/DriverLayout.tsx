import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useOutletContext } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Api from '../services/Api';
import { Ic } from '../icons';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Stop {
  _id: string;
  name: string;
}

export interface TripRoute {
  _id: string;
  name: string;
  stops?: Stop[];
  startTime?: string;
}

export interface DriverTrip {
  _id: string;
  route: TripRoute;
  bus_number: string;
  date: string;
  scheduled_time: string;
  time_slot: 'morning' | 'return_1530' | 'return_1900';
  status: 'scheduled' | 'active' | 'in-progress' | 'in_progress' | 'completed' | 'cancelled';
  booked_seats: number;
  total_seats: number;
  usersCount: number;
}

export interface GeoState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
}

export interface DriverContextType {
  trips: DriverTrip[];
  isLoading: boolean;
  activeTrip: string | null;
  geo: GeoState;
  actionLoading: string | null;
  handleStartTrip: (e: React.MouseEvent, tripId: string) => Promise<void>;
  handleEndTrip: (e: React.MouseEvent, tripId: string) => Promise<void>;
}

export function useDriverContext() {
  return useOutletContext<DriverContextType>();
}

export default function DriverLayout() {
  const { t } = useTranslation();
  const [trips, setTrips]                 = useState<DriverTrip[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [activeTrip, setActiveTrip]       = useState<string | null>(null);
  const [geo, setGeo]                     = useState<GeoState>({ lat: null, lng: null, accuracy: null, error: null });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const socketRef  = useRef<Socket | null>(null);
  const trackingIntervalRef = useRef<any>(null);

  // ── Toast auto-dismiss ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Start GPS Tracking Interval ─────────────────────────────────────────────
  const startGpsTrackingInterval = useCallback((tripId: string, busId: string, driverId: string, routeId: string) => {
    if (trackingIntervalRef.current !== null) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    const fetchAndEmit = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setGeo({ lat: latitude, lng: longitude, accuracy, error: null });

          console.log("GPS Granted. Emitting bus_location_update:", {
            busId,
            driverId,
            routeId,
            lat: latitude,
            lng: longitude
          });

          // Emit the event as requested by the user
          socketRef.current?.emit('bus_location_update', {
            busId,
            driverId,
            routeId,
            lat: latitude,
            lng: longitude,
            tripId
          });
        },
        (err) => {
          console.error('[GPS Interval Error]', err);
          setGeo(g => ({
            ...g,
            error: t('gps_location_update_failed'),
          }));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // Run once immediately
    fetchAndEmit();

    // Repeat every 30 seconds (30000ms)
    trackingIntervalRef.current = setInterval(fetchAndEmit, 30000);
  }, [t]);

  // ── Stop GPS Tracking Interval ──────────────────────────────────────────────
  const stopGpsTrackingInterval = useCallback(() => {
    if (trackingIntervalRef.current !== null) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    setGeo({ lat: null, lng: null, accuracy: null, error: null });
  }, []);

  // ── Fetch driver trips ───────────────────────────────────────────────────────
  const fetchTrips = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await Api.get('/driver/trips');
      const data: DriverTrip[] = res.data?.data ?? res.data ?? [];
      setTrips(data);

      const alreadyActive = data.find(t => t.status === 'active' || t.status === 'in-progress' || t.status === 'in_progress');
      if (alreadyActive) {
        setActiveTrip(alreadyActive._id);
        const routeId = alreadyActive.route?._id || '';
        const driverId = (alreadyActive as any).driver?._id || (alreadyActive as any).driver || '';
        const busId = (alreadyActive as any).bus?._id || (alreadyActive as any).bus || '';
        startGpsTrackingInterval(alreadyActive._id, busId, driverId, routeId);
      }
    } catch (err: any) {
      setToast({ msg: t('load_trips_failed'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [startGpsTrackingInterval, t]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  // ── Socket ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io('http://localhost:5001', { transports: ['websocket'] });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ── GPS cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current !== null) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
    };
  }, []);

  // ── Handle START TRIP ───────────────────────────────────────────────────────
  const handleStartTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();

    if (!navigator.geolocation) {
      alert(t('geo_not_supported'));
      return;
    }

    // Request GPS permission first
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setActionLoading(tripId);
        try {
          const res = await Api.patch(`/trips/${tripId}/start`);

          setTrips(prev =>
            prev.map(t => t._id === tripId ? { ...t, status: 'in_progress' } : t)
          );
          setActiveTrip(tripId);

          // Get trip details for GPS tracking
          const targetTrip = trips.find(t => t._id === tripId);
          const routeId = targetTrip?.route?._id || '';
          const driverId = (targetTrip as any)?.driver?._id || (targetTrip as any)?.driver || '';
          const busId = (targetTrip as any)?.bus?._id || (targetTrip as any)?.bus || '';

          // Join the trip room so the driver also receives location updates
          socketRef.current?.emit('join_trip_room', tripId);
          if (routeId) socketRef.current?.emit('join-route-room', routeId);

          // Notify students and admin that the trip has started
          // This unlocks the chat and activates the live map on student apps
          socketRef.current?.emit('tripStarted', { tripId, routeId });

          // Begin emitting location updates every 30 s
          startGpsTrackingInterval(tripId, busId, driverId, routeId);

          setToast({ msg: t('trip_started_gps'), type: 'success' });
        } catch (err: any) {
          setToast({
            msg: err.response?.data?.message || t('driver_start_trip_failed'),
            type: 'error',
          });
        } finally {
          setActionLoading(null);
        }
      },
      (error) => {
        console.error("GPS access error:", error);
        alert(t('enable_gps_start'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ── Handle END TRIP ─────────────────────────────────────────────────────────
  const handleEndTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    setActionLoading(tripId);
    try {
      await Api.patch(`/trips/${tripId}/end`);

      stopGpsTrackingInterval();
      setActiveTrip(null);

      setTrips(prev =>
        prev.map(t => t._id === tripId ? { ...t, status: 'completed' } : t)
      );

      setToast({ msg: t('trip_completed_gps'), type: 'success' });
    } catch (err: any) {
      setToast({
        msg: err.response?.data?.message || t('driver_end_trip_failed'),
        type: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div
      className="flex-1 bg-app-bg text-app-tx min-h-screen p-8 transition-colors duration-300"
      onClick={e => e.stopPropagation()}
    >
      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-8 right-8 z-[5000] px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top duration-300 ${
            toast.type === 'success'
              ? 'bg-app-ok/20 border-app-ok text-app-ok'
              : 'bg-app-err/20 border-app-err text-app-err'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-app-am/10 border border-app-am/20 flex items-center justify-center text-app-am">
            <Ic.Bus size={22} />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">
              {t('driver_title_part1')}{' '}
              <span className="text-app-am">{t('driver_title_part2')}</span>
            </h1>
            <p className="text-[10px] text-app-mu font-bold uppercase tracking-[0.4em] mt-0.5">
              {t('driver_command_center')}
            </p>
          </div>
        </div>
      </div>

      {/* ── GPS Live Status Bar ── */}
      {activeTrip && (
        <div className="mb-8 p-5 bg-app-card border border-app-ok/30 rounded-[2rem] flex flex-wrap items-center gap-6 shadow-lg shadow-app-ok/5">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-app-ok opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-app-ok" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-app-ok">
              {t('gps_broadcasting_live')}
            </span>
          </div>

          {geo.error ? (
            <span className="text-[10px] font-bold text-app-err bg-app-err/10 px-3 py-1 rounded-lg border border-app-err/20">
              ⚠ {geo.error}
            </span>
          ) : geo.lat !== null ? (
            <div className="flex items-center gap-6 text-[10px] font-black text-app-mu uppercase tracking-widest">
              <span>
                {t('driver_lat')}{' '}
                <span className="text-app-tx font-mono">{geo.lat.toFixed(6)}</span>
              </span>
              <span>
                {t('driver_lng')}{' '}
                <span className="text-app-tx font-mono">{geo.lng?.toFixed(6)}</span>
              </span>
              {geo.accuracy !== null && (
                <span>
                  {t('driver_acc')}{' '}
                  <span className="text-app-tx font-mono">±{Math.round(geo.accuracy)}m</span>
                </span>
              )}
            </div>
          ) : (
            <span className="text-[10px] font-bold text-app-mu animate-pulse">
              {t('acquiring_gps_signal')}
            </span>
          )}
        </div>
      )}

      {/* ── Child Pages (Trips or Map) ── */}
      <Outlet context={{ trips, isLoading, activeTrip, geo, actionLoading, handleStartTrip, handleEndTrip }} />
    </div>
  );
}
