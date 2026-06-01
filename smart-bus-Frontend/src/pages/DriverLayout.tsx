import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
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

// ─── GPS Permission Helper ────────────────────────────────────────────────────
const checkGpsPermission = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        if (error.code === 1) {
          reject(new Error("Location permission denied. Please allow location access to start the trip."));
        } else {
          // If it's just a timeout or position unavailable, we can still resolve
          // because watchPosition might succeed later. The permission is technically granted.
          reject(new Error("Unable to acquire initial GPS lock. Please check your signal."));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
};

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
  const [trips, setTrips]                 = useState<DriverTrip[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [activeTrip, setActiveTrip]       = useState<string | null>(null);
  const [geo, setGeo]                     = useState<GeoState>({ lat: null, lng: null, accuracy: null, error: null });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const socketRef  = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // ── Toast auto-dismiss ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Fetch driver trips ───────────────────────────────────────────────────────
  const fetchTrips = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await Api.get('/trips/driver-trips');
      const data: DriverTrip[] = res.data?.data ?? res.data ?? [];
      setTrips(data);

      const alreadyActive = data.find(t => t.status === 'active');
      if (alreadyActive) {
        setActiveTrip(alreadyActive._id);
      }
    } catch (err: any) {
      setToast({ msg: 'Could not load your trips. Check your connection.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // ── Start GPS watch and emit over socket ────────────────────────────────────
  const startGpsWatch = useCallback((tripId: string) => {
    if (!navigator.geolocation) {
      setGeo(g => ({ ...g, error: 'Geolocation is not supported by this browser.' }));
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude, longitude, accuracy } = coords;
        setGeo({ lat: latitude, lng: longitude, accuracy, error: null });

        // VERIFICATION LOG REQUIRED BY USER
        console.log("GPS Granted. Emitting Location:", latitude, longitude);

        socketRef.current?.emit('driver_location_update', {
          trip_id: tripId,
          lat:     latitude,
          lng:     longitude,
        });
      },
      err => {
        setGeo(g => ({
          ...g,
          error: err.code === 1
            ? 'Location access denied. Please enable location in browser settings.'
            : 'Unable to get your location. Retrying…',
        }));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10_000 }
    );

    watchIdRef.current = watchId;
  }, []);

  // ── Stop GPS watch ──────────────────────────────────────────────────────────
  const stopGpsWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGeo({ lat: null, lng: null, accuracy: null, error: null });
  }, []);

  // ── Handle START TRIP ───────────────────────────────────────────────────────
  const handleStartTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();

    // STEP 1: Permission Check before doing anything
    try {
      await checkGpsPermission();
    } catch (err: any) {
      setToast({ msg: err.message || "Failed to access GPS.", type: 'error' });
      return; // HALT TRIP START
    }

    setActionLoading(tripId);
    try {
      await Api.patch(`/trips/${tripId}/start`);

      setTrips(prev =>
        prev.map(t => t._id === tripId ? { ...t, status: 'active' } : t)
      );
      setActiveTrip(tripId);
      startGpsWatch(tripId);   // ← real GPS begins streaming here

      setToast({ msg: '🚌 Trip started — GPS tracking is now live.', type: 'success' });
    } catch (err: any) {
      setToast({
        msg: err.response?.data?.message || 'Failed to start trip.',
        type: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Handle END TRIP ─────────────────────────────────────────────────────────
  const handleEndTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    setActionLoading(tripId);
    try {
      await Api.patch(`/trips/${tripId}/end`);

      stopGpsWatch();          // ← GPS watch cleared immediately
      setActiveTrip(null);

      setTrips(prev =>
        prev.map(t => t._id === tripId ? { ...t, status: 'completed' } : t)
      );

      setToast({ msg: '✅ Trip completed. GPS tracking stopped.', type: 'success' });
    } catch (err: any) {
      setToast({
        msg: err.response?.data?.message || 'Failed to end trip.',
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
              Driver <span className="text-app-am">Dashboard</span>
            </h1>
            <p className="text-[10px] text-app-mu font-bold uppercase tracking-[0.4em] mt-0.5">
              Real-Time Trip Command Center
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
              GPS Broadcasting Live
            </span>
          </div>

          {geo.error ? (
            <span className="text-[10px] font-bold text-app-err bg-app-err/10 px-3 py-1 rounded-lg border border-app-err/20">
              ⚠ {geo.error}
            </span>
          ) : geo.lat !== null ? (
            <div className="flex items-center gap-6 text-[10px] font-black text-app-mu uppercase tracking-widest">
              <span>
                LAT <span className="text-app-tx font-mono">{geo.lat.toFixed(6)}</span>
              </span>
              <span>
                LNG <span className="text-app-tx font-mono">{geo.lng?.toFixed(6)}</span>
              </span>
              {geo.accuracy !== null && (
                <span>
                  ACC <span className="text-app-tx font-mono">±{Math.round(geo.accuracy)}m</span>
                </span>
              )}
            </div>
          ) : (
            <span className="text-[10px] font-bold text-app-mu animate-pulse">
              Acquiring GPS signal…
            </span>
          )}
        </div>
      )}

      {/* ── Child Pages (Trips or Map) ── */}
      <Outlet context={{ trips, isLoading, activeTrip, geo, actionLoading, handleStartTrip, handleEndTrip }} />
    </div>
  );
}
