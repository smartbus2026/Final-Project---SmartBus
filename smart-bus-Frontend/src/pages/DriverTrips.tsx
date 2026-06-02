import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDriverContext } from './DriverLayout';
import { Ic } from '../icons';

const STATUS_KEY: Record<string, string> = {
  scheduled: 'status_scheduled',
  active: 'active',
  'in-progress': 'status_in_progress',
  in_progress: 'status_in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
};

export default function DriverTrips() {
  const { t, i18n } = useTranslation();
  const { trips, isLoading, activeTrip, actionLoading, handleStartTrip, handleEndTrip } = useDriverContext();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-app-bd border-t-app-am rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-app-mu animate-pulse">
            {t('loading_driver_trips')}
          </p>
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-40">
        <Ic.Bus size={48} />
        <p className="text-[10px] font-black uppercase tracking-widest text-app-mu text-center">
          {t('no_upcoming_trips')}
        </p>
        <p className="text-[9px] text-app-mu2 uppercase tracking-widest">
          {t('contact_admin_trips')}
        </p>
      </div>
    );
  }

  return (
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
        {trips.map(trip => {
          const isThisActive    = trip.status === 'active' || trip.status === 'in-progress' || trip.status === 'in_progress';
          const isBtnLoading    = actionLoading === trip._id;
          const stops           = trip.route?.stops ?? [];
          const firstStop       = stops[0]?.name ?? t('stop_origin');
          const lastStop        = stops[stops.length - 1]?.name ?? t('stop_destination');
          const routeName       = trip.route?.name ?? '—';

          const tripStartTime = (() => {
            const d = new Date(trip.date);
            let timeStr = "08:30";
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
              {isThisActive && (
                <div className="h-1 w-full bg-gradient-to-r from-app-ok via-app-am to-app-ok animate-pulse" />
              )}

              <div className="p-7 flex flex-col flex-1 gap-5">
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

                {stops.length > 0 && (
                  <div className="pt-4 border-t border-app-bd/40">
                    <p className="text-[9px] font-black uppercase tracking-widest text-app-mu mb-3 flex items-center gap-1.5">
                      <Ic.Route size={11} /> {t('route_stops')}
                    </p>
                    <div className="relative pl-4">
                      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-app-bd/60" />
                      <ol className="space-y-2">
                        {stops.map((stop, idx) => (
                          <li key={stop._id ?? idx} className="flex items-center gap-2 relative">
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
  );
}

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-400 border border-blue-400/30',
  active:    'bg-app-ok/10 text-app-ok border border-app-ok/30',
  'in-progress': 'bg-app-ok/10 text-app-ok border border-app-ok/30',
  in_progress: 'bg-app-ok/10 text-app-ok border border-app-ok/30',
  completed: 'bg-app-am/10 text-app-am border border-app-am/30',
  cancelled: 'bg-app-err/10 text-app-err border border-app-err/30',
};

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
