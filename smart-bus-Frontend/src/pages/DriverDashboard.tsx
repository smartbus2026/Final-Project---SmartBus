import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { io, Socket } from 'socket.io-client';
import Api from '../services/Api';
import { Ic } from '../icons';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix standard Leaflet icon paths
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const busMarkerIcon = L.divIcon({
  className: 'custom-bus-marker',
  html: `<div style="background-color: #F7A01B; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #1c1c1c; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(247,160,27,0.5);"><span style="font-size: 18px;">🚌</span></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const MapCenterUpdater: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stop {
  _id: string;
  name: string;
}

interface TripRoute {
  _id: string;
  name: string;
  stops?: Stop[];
  startTime?: string;
}

interface DriverTrip {
  _id: string;
  route: TripRoute;
  bus_number: string;
  date: string;
  scheduled_time: string;   // ISO string of departure — used for time-gating
  time_slot: 'morning' | 'return_1530' | 'return_1900';
  status: 'scheduled' | 'active' | 'in-progress' | 'in_progress' | 'completed' | 'cancelled';
  booked_seats: number;
  total_seats: number;
  usersCount: number;       // enriched by backend — active booking count
}

interface GeoState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
}

const STATUS_KEY: Record<string, string> = {
  scheduled: 'status_scheduled',
  active: 'active',
  'in-progress': 'status_in_progress',
  in_progress: 'status_in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
};

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-400 border border-blue-400/30',
  active:    'bg-app-ok/10 text-app-ok border border-app-ok/30',
  'in-progress': 'bg-app-ok/10 text-app-ok border border-app-ok/30',
  in_progress: 'bg-app-ok/10 text-app-ok border border-app-ok/30',
  completed: 'bg-app-am/10 text-app-am border border-app-am/30',
  cancelled: 'bg-app-err/10 text-app-err border border-app-err/30',
};

// ─── Time-gate DISABLED for testing ─────────────────────────────────────────
// START TRIP is always unlocked so GPS live-tracking can be tested immediately.
// Re-enable the isWithinStartWindow / timeUntilWindow helpers and restore the
// startDisabled logic below once you finish integration testing.

// ─── Component ────────────────────────────────────────────────────────────────
const DriverDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-GB';

  const timeSlotLabel = (slot: string) => {
    const labels: Record<string, string> = {
      morning: t('morning_departure'),
      return_1530: t('return_1530'),
      return_1900: t('return_1900'),
    };
    return labels[slot] ?? slot;
  };

  const statusLabel = (status: string) => t(STATUS_KEY[status] ?? status);

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
      const res = await Api.get('/driver/trips');
      console.log("API Response Status:", res.status);
      console.log("API Response Body:", res.data);
      const data: DriverTrip[] = res.data?.data ?? res.data ?? [];
      console.assert(Array.isArray(data), "VERIFY FAILED: data is not an array — check res.data shape:", res.data);
      console.assert(data.length > 0, "VERIFY FAILED: Dashboard received no trips. Backend returned empty array.");
      setTrips(data);

      // Restore active tracking if driver refreshed mid-trip
      const alreadyActive = data.find(t => t.status === 'active' || t.status === 'in-progress' || t.status === 'in_progress');
      if (alreadyActive) {
        setActiveTrip(alreadyActive._id);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Failed to fetch driver trips:', error);
      setToast({ msg: t('load_trips_failed'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  // ── Socket ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io('http://localhost:5001', { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () =>
      console.log('[DriverDashboard] Socket connected:', socket.id)
    );
    socket.on('disconnect', () =>
      console.log('[DriverDashboard] Socket disconnected')
    );

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
      setGeo(g => ({ ...g, error: t('geo_not_supported') }));
      return;
    }

    // Clear any lingering watch first
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude, longitude, accuracy } = coords;
        setGeo({ lat: latitude, lng: longitude, accuracy, error: null });

        // Broadcast real coordinates — received by admin LiveTracking
        // and every student subscribed to trip:<id>
        socketRef.current?.emit('driver_location_update', {
          trip_id: tripId,
          lat:     latitude,
          lng:     longitude,
        });
      },
      err => {
        console.error('[GPS Error]', err);
        setGeo(g => ({
          ...g,
          error: err.code === 1
            ? t('gps_denied')
            : t('gps_retrying'),
        }));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10_000 }
    );

    watchIdRef.current = watchId;
  }, [t]);

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
    setActionLoading(tripId);
    try {
      await Api.patch(`/trips/${tripId}/start`);

      setTrips(prev =>
        prev.map(t => t._id === tripId ? { ...t, status: 'in-progress' } : t)
      );
      setActiveTrip(tripId);
      startGpsWatch(tripId);   // ← real GPS begins streaming here

      setToast({ msg: t('trip_started_gps'), type: 'success' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setToast({
        msg: error.response?.data?.message || t('driver_start_trip_failed'),
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

      setToast({ msg: t('trip_completed_gps'), type: 'success' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setToast({
        msg: error.response?.data?.message || t('driver_end_trip_failed'),
        type: 'error',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    // Root isolation boundary — prevents any click from bubbling to Topbar
    <div
      className="flex-1 bg-app-bg text-app-tx min-h-screen p-8 transition-colors duration-300"
      onClick={e => e.stopPropagation()}
    >
      {/* ── FAILSAFE RENDER ── */}
      <p className="text-white text-xs opacity-20 mb-4">Debug Trips Count: {trips?.length || 0}</p>

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

      {/* ── Trip Cards ── */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-app-bd border-t-app-am rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-app-mu animate-pulse">
              {t('loading_driver_trips')}
            </p>
          </div>
        </div>

      ) : trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-40">
          <Ic.Bus size={48} />
          <p className="text-[10px] font-black uppercase tracking-widest text-app-mu text-center">
            {t('no_upcoming_trips')}
          </p>
          <p className="text-[9px] text-app-mu2 uppercase tracking-widest">
            {t('contact_admin_trips')}
          </p>
        </div>

      ) : (
        <>
          {/* ── SECTION 1: MY TRIPS ── */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-black uppercase tracking-tight text-app-tx italic">
                {t('my_trips_part1') && <>{t('my_trips_part1')}{' '}</>}
                <span className="text-app-am">{t('my_trips_part2')}</span>
              </h2>
              <div className="h-px bg-app-bd/50 flex-1" />
              <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest">
                <span className="text-app-tx">{trips.length}</span> {t('driver_assigned')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {trips?.map(trip => {
              const isThisActive    = trip.status === 'active' || trip.status === 'in-progress' || trip.status === 'in_progress';
              const isBtnLoading    = actionLoading === trip._id;
              const stops           = trip.route?.stops ?? [];
              const firstStop       = stops[0]?.name ?? t('stop_origin');
              const lastStop        = stops[stops.length - 1]?.name ?? t('stop_destination');
              const routeName       = trip.route?.name ?? '—';

              const tripStartTime = (() => {
                const d = new Date(trip.date);
                let timeStr = "08:30"; // Morning slot default
                if (trip.time_slot === "return_1530") {
                  timeStr = "15:30";
                } else if (trip.time_slot === "return_1900") {
                  timeStr = "19:00";
                }
                const [hours, minutes] = timeStr.split(":").map(Number);
                d.setHours(hours, minutes, 0, 0);
                return d;
              })();

              const canStart = (tripStartTime.getTime() - Date.now()) <= 60 * 60 * 1000;
              const startDisabled = isBtnLoading || !!activeTrip || !canStart;
              const passengerCount = trip.usersCount ?? trip.booked_seats;

              return (
                <div
                  key={trip._id}
                  className={`bg-app-card border rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm transition-all duration-300 hover:shadow-xl ${
                    isThisActive
                      ? 'border-app-ok/40 shadow-app-ok/10'
                      : 'border-app-bd hover:border-app-am/30'
                  }`}
                >
                  {/* Active accent bar */}
                  {isThisActive && (
                    <div className="h-1 w-full bg-gradient-to-r from-app-ok via-app-am to-app-ok animate-pulse" />
                  )}

                  <div className="p-7 flex flex-col flex-1 gap-5">

                    {/* ── Card Header ── */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          isThisActive ? 'bg-app-ok/15 text-app-ok' : 'bg-app-am/10 text-app-am'
                        }`}>
                          <Ic.Bus size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-tight text-app-tx leading-tight">
                            {routeName}
                          </h3>
                          <p className="text-[9px] text-app-mu font-bold mt-0.5 uppercase tracking-widest">
                            {firstStop} → {lastStop}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shrink-0 ${STATUS_STYLE[trip.status]}`}>
                        {statusLabel(trip.status)}
                      </span>
                    </div>

                    {/* ── Info Rows ── */}
                    <div className="space-y-3 flex-1">
                      <InfoRow icon={<Ic.Bus size={13} />}      label={t('bus')}        value={trip.bus_number} />
                      <InfoRow icon={<Ic.Clock size={13} />}    label={t('time_slot')}  value={timeSlotLabel(trip.time_slot)} />
                      <InfoRow
                        icon={<Ic.Calendar size={13} />}
                        label={t('trip_date')}
                        value={new Date(trip.date).toLocaleDateString(dateLocale, {
                          weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      />
                      <InfoRow
                        icon={<Ic.Time size={13} />}
                        label={t('departure')}
                        value={new Date(trip.scheduled_time ?? trip.date).toLocaleTimeString(dateLocale, {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      />
                      <InfoRow
                        icon={<Ic.Users size={13} />}
                        label={t('booked_students')}
                        value={t('passengers_count', { count: passengerCount })}
                      />
                    </div>

                    {/* ── Stops List ── */}
                    {stops.length > 0 && (
                      <div className="pt-4 border-t border-app-bd/40">
                        <p className="text-[9px] font-black uppercase tracking-widest text-app-mu mb-3 flex items-center gap-1.5">
                          <Ic.Route size={11} /> {t('route_stops')}
                        </p>
                        <div className="relative pl-4">
                          {/* Vertical connector line */}
                          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-app-bd/60" />
                          <ol className="space-y-2">
                            {stops.map((stop, idx) => (
                              <li key={stop._id ?? idx} className="flex items-center gap-2 relative">
                                {/* Dot */}
                                <span className={`absolute -left-4 w-2 h-2 rounded-full border-2 shrink-0 ${
                                  idx === 0
                                    ? 'bg-app-am border-app-am'
                                    : idx === stops.length - 1
                                      ? 'bg-app-ok border-app-ok'
                                      : 'bg-app-card border-app-bd'
                                }`} />
                                <span className={`text-[10px] font-bold truncate ${
                                  idx === 0 || idx === stops.length - 1
                                    ? 'text-app-tx'
                                    : 'text-app-mu'
                                }`}>
                                  {stop.name}
                                </span>
                                {idx === 0 && (
                                  <span className="text-[8px] font-black text-app-am uppercase tracking-widest shrink-0">
                                    {t('stop_start')}
                                  </span>
                                )}
                                {idx === stops.length - 1 && (
                                  <span className="text-[8px] font-black text-app-ok uppercase tracking-widest shrink-0">
                                    {t('stop_end')}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* ── Action Button ── */}

                    {/* SCHEDULED — START (1-hour time-gate enforced) */}
                    {trip.status === 'scheduled' && (
                      <div className="space-y-2">
                        <button
                          disabled={startDisabled}
                          onClick={e => handleStartTrip(e, trip._id)}
                          className={`w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 ${
                            startDisabled
                              ? 'bg-app-card2 border border-app-bd text-app-mu cursor-not-allowed opacity-50'
                              : 'bg-app-am text-black hover:brightness-110 active:scale-[0.98] shadow-lg shadow-app-am/20'
                          } ${isBtnLoading ? 'cursor-wait' : ''}`}
                        >
                          {isBtnLoading ? (
                            <><Ic.Loader size={14} className="animate-spin" /> {t('starting')}</>
                          ) : (
                            <><Ic.Target size={14} /> {t('start_trip')}</>
                          )}
                        </button>
                        {!canStart && (
                          <p className="text-center text-[9px] font-bold text-app-mu uppercase tracking-widest mt-1 animate-pulse">
                            {t('unlocks_one_hour_before')}
                          </p>
                        )}

                        {!!activeTrip && !isThisActive && (
                          <p className="text-center text-[9px] font-bold text-app-err uppercase tracking-widest">
                            {t('end_active_first')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* ACTIVE — END button */}
                    {(trip.status === 'active' || trip.status === 'in-progress' || trip.status === 'in_progress') && (
                      <button
                        disabled={isBtnLoading}
                        onClick={e => handleEndTrip(e, trip._id)}
                        className={`w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20 hover:border-red-500/40 active:scale-[0.98] ${
                          isBtnLoading ? 'opacity-70 cursor-wait' : ''
                        }`}
                      >
                        {isBtnLoading ? (
                          <><Ic.Loader size={14} className="animate-spin" /> {t('ending')}</>
                        ) : (
                          <><Ic.Close size={14} /> {t('end_trip')}</>
                        )}
                      </button>
                    )}

                    {/* COMPLETED */}
                    {trip.status === 'completed' && (
                      <div className="w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 bg-app-card2 border border-app-bd text-app-mu cursor-default">
                        <Ic.Check size={13} /> {t('completed')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* ── SECTION 2: LIVE TRACKING ── */}
          <div id="live-tracking" className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-black uppercase tracking-tight text-app-tx italic">
                {t('live_tracking_part1')}{' '}
                <span className="text-app-am">{t('live_tracking_part2')}</span>
              </h2>
              <div className="h-px bg-app-bd/50 flex-1" />
            </div>

            {activeTrip && geo.lat !== null && geo.lng !== null ? (
              <div className="bg-app-card border border-app-bd rounded-[2.5rem] overflow-hidden shadow-xl h-[400px] relative z-0">
                <MapContainer 
                  center={[geo.lat, geo.lng]} 
                  zoom={16} 
                  className="w-full h-full z-0"
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                  />
                  <Marker position={[geo.lat, geo.lng]} icon={busMarkerIcon} />
                  <MapCenterUpdater lat={geo.lat} lng={geo.lng} />
                </MapContainer>
              </div>
            ) : activeTrip ? (
              <div className="bg-app-card border border-app-bd rounded-[2.5rem] h-[400px] flex items-center justify-center shadow-xl">
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-app-bd border-t-app-am rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-app-mu animate-pulse">
                      {t('acquiring_gps_map')}
                    </p>
                 </div>
              </div>
            ) : (
              <div className="bg-app-card/30 border border-app-bd/50 border-dashed rounded-[2.5rem] h-[400px] flex flex-col items-center justify-center opacity-70">
                <Ic.Target className="text-app-mu mb-4 opacity-50" size={48} />
                <p className="text-[12px] font-black uppercase tracking-widest text-app-mu text-center">
                  {t('live_map_inactive')}
                </p>
                <p className="text-[10px] text-app-mu2 uppercase tracking-widest mt-2">
                  {t('start_trip_for_gps')}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─── InfoRow ─────────────────────────────────────────────────────────────────
const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon, label, value,
}) => (
  <div className="flex items-center justify-between pb-3 border-b border-app-bd/40 last:border-0 last:pb-0">
    <div className="flex items-center gap-2 text-app-mu">
      <span className="text-app-am">{icon}</span>
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-[11px] font-black text-app-tx uppercase tracking-tight text-right max-w-[55%] truncate">
      {value}
    </span>
  </div>
);

export default DriverDashboard;
