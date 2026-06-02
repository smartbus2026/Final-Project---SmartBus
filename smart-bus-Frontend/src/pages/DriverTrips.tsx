import React from 'react';
import { useDriverContext } from './DriverLayout';
import { Ic } from '../icons';

// ─── Constants ────────────────────────────────────────────────────────────────
const TIME_SLOT_LABELS: Record<string, string> = {
  morning:     '🌅 Morning Departure',
  return_1530: '🕞 Return 15:30',
  return_1900: '🌆 Return 19:00',
};

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-400 border border-blue-400/30',
  active:    'bg-app-ok/10 text-app-ok border border-app-ok/30',
  'in-progress': 'bg-app-ok/10 text-app-ok border border-app-ok/30',
  in_progress: 'bg-app-ok/10 text-app-ok border border-app-ok/30',
  completed: 'bg-app-am/10 text-app-am border border-app-am/30',
  cancelled: 'bg-app-err/10 text-app-err border border-app-err/30',
};

export default function DriverTrips() {
  const { trips, isLoading, activeTrip, actionLoading, handleStartTrip, handleEndTrip } = useDriverContext();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-app-bd border-t-app-am rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-app-mu animate-pulse">
            Loading Trips…
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
          No upcoming trips assigned to you
        </p>
        <p className="text-[9px] text-app-mu2 uppercase tracking-widest">
          Contact your administrator to assign trips
        </p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-black uppercase tracking-tight text-app-tx italic">
          My <span className="text-app-am">Trips</span>
        </h2>
        <div className="h-px bg-app-bd/50 flex-1" />
        <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest">
          <span className="text-app-tx">{trips.length}</span> Assigned
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {trips.map(trip => {
          const isThisActive    = trip.status === 'active' || trip.status === 'in-progress' || trip.status === 'in_progress';
          const isBtnLoading    = actionLoading === trip._id;
          const stops           = trip.route?.stops ?? [];
          const firstStop       = stops[0]?.name ?? 'Origin';
          const lastStop        = stops[stops.length - 1]?.name ?? 'Destination';
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
                    {trip.status}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  <InfoRow icon={<Ic.Bus size={13} />}      label="Bus"        value={trip.bus_number} />
                  <InfoRow icon={<Ic.Clock size={13} />}    label="Time Slot"  value={TIME_SLOT_LABELS[trip.time_slot] ?? trip.time_slot} />
                  <InfoRow
                    icon={<Ic.Calendar size={13} />}
                    label="Trip Date"
                    value={new Date(trip.date).toLocaleDateString('en-GB', {
                      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  />
                  <InfoRow
                    icon={<Ic.Time size={13} />}
                    label="Departure"
                    value={new Date(trip.scheduled_time ?? trip.date).toLocaleTimeString('en-GB', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  />
                  <InfoRow
                    icon={<Ic.Users size={13} />}
                    label="Booked Students"
                    value={`${trip.usersCount ?? trip.booked_seats} passengers`}
                  />
                </div>

                {stops.length > 0 && (
                  <div className="pt-4 border-t border-app-bd/40">
                    <p className="text-[9px] font-black uppercase tracking-widest text-app-mu mb-3 flex items-center gap-1.5">
                      <Ic.Route size={11} /> Route Stops
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
                                Start
                              </span>
                            )}
                            {idx === stops.length - 1 && (
                              <span className="text-[8px] font-black text-app-ok uppercase tracking-widest shrink-0">
                                End
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
                        <><Ic.Loader size={14} className="animate-spin" /> Starting…</>
                      ) : (
                        <><Ic.Target size={14} /> Start Trip</>
                      )}
                    </button>
                    {!canStart && (
                      <p className="text-center text-[9px] font-bold text-app-mu uppercase tracking-widest mt-1 animate-pulse">
                        Button will unlock 1 hour before trip
                      </p>
                    )}
                    {!!activeTrip && !isThisActive && (
                      <p className="text-center text-[9px] font-bold text-app-err uppercase tracking-widest">
                        End active trip first
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
                      <><Ic.Loader size={14} className="animate-spin" /> Ending…</>
                    ) : (
                      <><Ic.Close size={14} /> End Trip</>
                    )}
                  </button>
                )}

                {trip.status === 'completed' && (
                  <div className="w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 bg-app-card2 border border-app-bd text-app-mu cursor-default">
                    <Ic.Check size={13} /> Completed
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
