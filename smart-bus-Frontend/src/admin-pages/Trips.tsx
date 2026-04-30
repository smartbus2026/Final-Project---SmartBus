import React, { useState, useEffect } from 'react';
import { Ic } from '../icons';
import Api from '../services/Api'; 

interface TripStop {
  name: string;
  time: string;
  isCompleted: boolean;
}

interface MyTrip {
  id: string;
  routeName: string;
  busId: string;
  driverName: string;
  status: 'On Track' | 'Delayed' | 'Arrived' | 'Upcoming';
  departureTime: string;
  arrivalTime: string;
  stops: TripStop[];
}

interface RouteOption {
  _id: string;
  name: string;
}

// Derive progress % from stops
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

const STATUS_STYLE: Record<MyTrip['status'], string> = {
  'On Track': 'text-app-ok',
  'Delayed':  'text-red-400',
  'Arrived':  'text-app-am',
  'Upcoming': 'text-app-mu',
};

// --- Modal ---
interface CancelModalProps {
  tripId: string;
  onConfirm: () => void;
  onClose: () => void;
}

const CancelModal: React.FC<CancelModalProps> = ({ tripId, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
    <div className="bg-app-card border border-app-bd w-full max-w-sm rounded-[2.5rem] relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="p-8 border-b border-app-bd flex items-center gap-4">
        <div className="bg-red-500/10 p-3 rounded-2xl text-red-400">
          <Ic.Close />
        </div>
        <div>
          <h2 className="text-base font-black uppercase tracking-widest">Cancel Reservation</h2>
          <p className="text-[10px] text-app-mu font-bold uppercase tracking-widest mt-1">Trip {tripId.slice(-6)}</p>
        </div>
      </div>
      <div className="p-8">
        <p className="text-xs text-app-mu font-bold uppercase tracking-wide leading-relaxed">
          This action will cancel your reservation. You will lose your seat on this trip. Are you sure?
        </p>
      </div>
      <div className="p-8 bg-app-card2 border-t border-app-bd flex justify-end gap-4">
        <button
          onClick={onClose}
          className="px-8 py-4 text-app-mu font-black text-[10px] uppercase tracking-widest hover:text-app-tx transition-all"
        >
          Keep Trip
        </button>
        <button
          onClick={onConfirm}
          className="bg-red-500 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all"
        >
          Confirm Cancel
        </button>
      </div>
    </div>
  </div>
);

// --- Ticket Modal ---
interface TicketModalProps {
  trip: MyTrip;
  onClose: () => void;
}

const TicketModal: React.FC<TicketModalProps> = ({ trip, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
    <div className="bg-app-card border border-app-bd w-full max-w-sm rounded-[2.5rem] relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="p-8 border-b border-app-bd flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-app-am/20 p-3 rounded-2xl text-app-am">
            <Ic.Bus />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-widest">Boarding Ticket</h2>
            <p className="text-[10px] text-app-mu font-bold uppercase tracking-widest mt-1">{trip.id.slice(-6)}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-app-card2 border border-app-bd text-app-mu hover:text-app-tx transition-all"
        >
          <Ic.Close />
        </button>
      </div>

      <div className="p-8 space-y-5">
        {[
          { label: 'Route',    value: trip.routeName },
          { label: 'Bus',      value: trip.busId },
          { label: 'Driver',   value: trip.driverName },
          { label: 'Departs',  value: trip.departureTime },
          { label: 'Arrives',  value: trip.arrivalTime },
          { label: 'Status',   value: trip.status },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center border-b border-app-bd/50 pb-4 last:border-none last:pb-0">
            <span className="text-[9px] font-black text-app-mu uppercase tracking-widest">{label}</span>
            <span className="text-xs font-black text-app-tx uppercase">{value}</span>
          </div>
        ))}
      </div>

      <div className="px-8 pb-8 flex justify-center gap-[3px]">
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            className="bg-app-mu/30 rounded-sm"
            style={{ width: i % 3 === 0 ? 4 : 2, height: i % 5 === 0 ? 40 : 28 }}
          />
        ))}
      </div>
    </div>
  </div>
);

// --- Create Trip Modal ---
interface CreateTripModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTripModal: React.FC<CreateTripModalProps> = ({ onClose, onSuccess }) => {
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    route_id: '',
    departure_time: '',
    time_slot: 'morning',
    total_seats: 40
  });

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await Api.get('/routes');
        setRoutes(res.data.data || res.data || []);
      } catch (err) {
        console.error("Failed to fetch routes", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await Api.post('/trips', formData);
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="bg-app-card border border-app-bd w-full max-w-lg rounded-[2.5rem] relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-app-bd flex justify-between items-center bg-gradient-to-r from-app-am/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="bg-app-am/20 p-3 rounded-2xl text-app-am">
              <Ic.Plus />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-widest text-app-tx">Create New Trip</h2>
              <p className="text-[10px] text-app-mu font-bold uppercase tracking-widest mt-1">Schedule a fleet deployment</p>
            </div>
          </div>
          <button onClick={onClose} className="text-app-mu hover:text-app-tx transition-colors">
            <Ic.Close />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">Select Route</label>
            <select 
              required
              value={formData.route_id}
              onChange={e => setFormData({ ...formData, route_id: e.target.value })}
              className="w-full bg-app-card2 border border-app-bd rounded-2xl px-4 py-3 text-[13px] text-app-tx focus:outline-none focus:border-app-am transition-colors appearance-none"
            >
              <option value="">{isLoading ? "Loading Routes..." : "-- Choose Route --"}</option>
              {routes.map(r => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">Trip Date</label>
              <input 
                type="date" 
                required
                value={formData.departure_time}
                onChange={e => setFormData({ ...formData, departure_time: e.target.value })}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-4 py-3 text-[13px] text-app-tx focus:outline-none focus:border-app-am transition-colors"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">Time Slot</label>
              <select 
                value={formData.time_slot}
                onChange={e => setFormData({ ...formData, time_slot: e.target.value })}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-4 py-3 text-[13px] text-app-tx focus:outline-none focus:border-app-am transition-colors appearance-none"
              >
                <option value="morning">Morning Outbound</option>
                <option value="return_1530">Return (3:30 PM)</option>
                <option value="return_1900">Return (7:00 PM)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">Total Seats</label>
            <input 
              type="number" 
              required
              min="1"
              value={formData.total_seats}
              onChange={e => setFormData({ ...formData, total_seats: parseInt(e.target.value) || 0 })}
              className="w-full bg-app-card2 border border-app-bd rounded-2xl px-4 py-3 text-[13px] text-app-tx focus:outline-none focus:border-app-am transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-app-mu font-black text-[10px] uppercase tracking-widest hover:text-app-tx transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-app-am text-black px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all flex items-center gap-2"
            >
              {isSubmitting ? "Creating..." : <><Ic.Plus size={14} /> Create Trip</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const MyTripsPageAdmin: React.FC = () => {
  const [trips, setTrips] = useState<MyTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [cancelTarget,   setCancelTarget]     = useState<string | null>(null);
  const [ticketTarget,   setTicketTarget]     = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchTrips = async () => {
    try {
      const res = await Api.get('/trips');
      const rawTrips = res.data?.data || res.data || [];
      
      const mappedTrips: MyTrip[] = rawTrips.map((t: any) => {
        let uiStatus: MyTrip['status'] = 'Upcoming';
        if (t.status === 'active') uiStatus = 'On Track';
        if (t.status === 'completed') uiStatus = 'Arrived';
        if (t.status === 'cancelled') uiStatus = 'Delayed';

        const departureTimeMap: Record<string, string> = {
          'morning': 'Morning',
          'return_1530': '3:30 PM',
          'return_1900': '7:00 PM'
        };

        return {
          id: t._id,
          routeName: t.route?.name || 'Unknown Route',
          busId: t.route?.code || 'Bus #01', 
          driverName: t.driver || 'Pending Driver',
          status: uiStatus,
          departureTime: departureTimeMap[t.time_slot] || t.time_slot,
          arrivalTime: 'TBA',
          stops: (t.route?.stops || []).map((stop: any) => ({
            name: typeof stop === 'string' ? stop : stop.name || 'Stop',
            time: 'TBA',
            isCompleted: t.status === 'completed'
          }))
        };
      });

      setTrips(mappedTrips);
      if (mappedTrips.length > 0 && (!selectedTripId || !mappedTrips.find(mt => mt.id === selectedTripId))) {
        setSelectedTripId(mappedTrips[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch trips", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const selectedTrip = trips.find((t) => t.id === selectedTripId) ?? trips[0];

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      await Api.delete(`/trips/${cancelTarget}`);
      setCancelTarget(null);
      fetchTrips(); 
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to cancel trip");
      setCancelTarget(null);
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchTrips();
  };

  const progress     = selectedTrip ? getTripProgress(selectedTrip.stops) : 0;
  const lastStop     = selectedTrip ? getLastCompleted(selectedTrip.stops) : null;
  const nextStop     = selectedTrip ? getNextStop(selectedTrip.stops) : null;
  const ticketTrip   = trips.find((t) => t.id === ticketTarget) ?? null;

  if (isLoading) {
    return (
      <div className="flex-1 bg-app-bg text-app-tx p-8 flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-app-mu font-black uppercase tracking-widest text-[10px]">Loading Trips Data...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-app-bg text-app-tx p-8 overflow-y-auto custom-scrollbar min-h-screen">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-app-tx">Manage Trips</h1>
          <p className="text-[10px] font-black text-app-mu uppercase tracking-[0.2em] mt-1">Administer active fleet deployments</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-app-am text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-app-am/90 transition-all shadow-lg flex items-center gap-2"
        >
          <Ic.Plus size={14} /> Create Trip
        </button>
      </div>

      {isCreateModalOpen && (
        <CreateTripModal onClose={() => setIsCreateModalOpen(false)} onSuccess={handleCreateSuccess} />
      )}

      {cancelTarget && (
        <CancelModal
          tripId={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
        />
      )}
      {ticketTrip && (
        <TicketModal
          trip={ticketTrip}
          onClose={() => setTicketTarget(null)}
        />
      )}

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-30">
          <Ic.Bus size={48} />
          <p className="text-[10px] font-black uppercase tracking-widest text-app-mu">No active trips</p>
        </div>
      ) : (
        <>
          {trips.length > 1 && (
            <div className="flex gap-3 mb-8 flex-wrap">
              {trips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTripId(trip.id)}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    selectedTripId === trip.id
                      ? 'bg-app-am text-black border-app-am'
                      : 'bg-app-card border-app-bd text-app-mu hover:border-app-am/30'
                  }`}
                >
                  {trip.id.slice(-6)} · {trip.status}
                </button>
              ))}
            </div>
          )}

          {selectedTrip && (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">

              <div className="space-y-8">

                <div className="bg-app-card border border-app-bd rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-app-am/20">

                  <div className="p-8 border-b border-app-bd flex justify-between items-center bg-gradient-to-r from-app-am/5 to-transparent">
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                          selectedTrip.status === 'On Track' ? 'bg-app-ok/10 text-app-ok border-app-ok/20'
                          : selectedTrip.status === 'Delayed'  ? 'bg-red-500/10 text-red-400 border-red-400/20'
                          : selectedTrip.status === 'Arrived'  ? 'bg-app-am/10 text-app-am border-app-am/20'
                          : 'bg-app-card2 text-app-mu border-app-bd'
                        }`}>
                          {selectedTrip.status}
                        </span>
                        <h2 className="text-xl font-black uppercase tracking-tight">{selectedTrip.routeName}</h2>
                      </div>
                      <div className="flex items-center gap-3 text-app-mu">
                        <Ic.Bus size={14} />
                        <p className="text-[10px] font-black tracking-widest uppercase">
                          ID: {selectedTrip.id.slice(-6)} • {selectedTrip.busId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-app-mu font-black uppercase mb-2 tracking-widest">System Status</p>
                      <span className={`text-xs font-black flex items-center gap-2 justify-end tracking-widest uppercase ${STATUS_STYLE[selectedTrip.status]}`}>
                        <span className={`w-2 h-2 rounded-full ${
                          selectedTrip.status === 'On Track' ? 'bg-app-ok animate-ping'
                          : selectedTrip.status === 'Delayed'  ? 'bg-red-400 animate-ping'
                          : 'bg-app-mu'
                        }`} />
                        {selectedTrip.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-10 grid grid-cols-2 md:grid-cols-4 gap-10">
                    <div className="space-y-1">
                      <label className="block text-[9px] text-app-mu font-black uppercase tracking-widest">Assigned Driver</label>
                      <p className="text-sm font-black flex items-center gap-2 uppercase">
                        <Ic.User size={14} className="text-app-am" />
                        {selectedTrip.driverName}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] text-app-mu font-black uppercase tracking-widest">Departure</label>
                      <p className="text-sm font-black text-app-am uppercase">{selectedTrip.departureTime}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] text-app-mu font-black uppercase tracking-widest">Est. Arrival</label>
                      <p className="text-sm font-black uppercase">{selectedTrip.arrivalTime}</p>
                    </div>
                    <div className="flex justify-end items-center">
                      <button
                        onClick={() => setTicketTarget(selectedTrip.id)}
                        className="bg-app-card2 hover:bg-app-bd border border-app-bd px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-app-mu hover:text-app-tx"
                      >
                        View Ticket
                      </button>
                    </div>
                  </div>

                  <div className="px-10 pb-10">
                    <div className="relative h-2 w-full bg-app-bd rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-app-am rounded-full transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-4">
                      <div className="flex items-center gap-2 opacity-50">
                        <Ic.Check size={12} className="text-app-ok" />
                        <p className="text-[9px] font-black text-app-mu uppercase tracking-widest">
                          {lastStop ? `Passed: ${lastStop}` : 'Not departed yet'}
                        </p>
                      </div>
                      {nextStop ? (
                        <p className="text-[9px] font-black text-app-am uppercase tracking-[0.2em] animate-pulse">
                          Next: {nextStop}
                        </p>
                      ) : (
                        <p className="text-[9px] font-black text-app-ok uppercase tracking-[0.2em]">Arrived ✓</p>
                      )}
                    </div>
                    <p className="text-right text-[9px] text-app-mu font-black mt-1 uppercase tracking-widest">
                      {progress}% Complete
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-app-card border border-app-bd rounded-[2rem] flex items-center gap-5 group hover:border-app-am/20 transition-all">
                    <div className="w-12 h-12 bg-app-am/10 rounded-2xl flex items-center justify-center text-app-am group-hover:scale-110 transition-transform">
                      <Ic.Shield size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] text-app-mu font-black uppercase tracking-widest mb-1">Safety Protocol</p>
                      <p className="text-[11px] text-app-tx font-bold leading-relaxed uppercase">
                        Real-time tracking is <span className="text-app-ok">active</span> for this trip.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-app-card border border-app-bd rounded-[2rem] flex items-center gap-5 group hover:border-app-am/20 transition-all">
                    <div className="w-12 h-12 bg-app-am/10 rounded-2xl flex items-center justify-center text-app-am group-hover:scale-110 transition-transform">
                      <Ic.Bell size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] text-app-mu font-black uppercase tracking-widest mb-1">Boarding Notice</p>
                      <p className="text-[11px] text-app-tx font-bold leading-relaxed uppercase">
                        Arrive at stop <span className="text-app-am">5 minutes</span> before departure.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-app-card border border-app-bd rounded-[3rem] p-10 h-fit sticky top-8 shadow-sm">
                <div className="flex items-center gap-3 mb-10 pb-6 border-b border-app-bd">
                  <Ic.Route className="text-app-am" />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em]">Trip Timeline</h3>
                </div>

                <div className="relative">
                  {selectedTrip.stops.map((stop, index) => (
                    <div key={index} className="flex gap-6 group">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-2 transition-all duration-700 z-10
                          ${stop.isCompleted
                            ? 'bg-app-ok border-app-ok shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                            : index === selectedTrip.stops.findIndex((s) => !s.isCompleted)
                              ? 'bg-app-am border-app-am animate-pulse'
                              : 'bg-app-card border-app-bd'
                          }`}
                        />
                        {index !== selectedTrip.stops.length - 1 && (
                          <div className={`w-[2px] h-16 transition-colors duration-700 ${stop.isCompleted ? 'bg-app-ok' : 'bg-app-bd'}`} />
                        )}
                      </div>
                      <div className="pb-10 pt-0.5">
                        <p className={`text-[12px] font-black uppercase tracking-widest mb-2 ${stop.isCompleted ? 'text-app-tx' : 'text-app-mu'}`}>
                          {stop.name}
                        </p>
                        <p className={`text-[10px] font-bold tracking-tighter ${stop.isCompleted ? 'text-app-ok' : 'text-app-mu/50'}`}>
                          {stop.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-8 border-t border-app-bd">
                  <button
                    onClick={() => setCancelTarget(selectedTrip.id)}
                    className="w-full bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98]"
                  >
                    Cancel Reservation
                  </button>
                </div>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyTripsPageAdmin;