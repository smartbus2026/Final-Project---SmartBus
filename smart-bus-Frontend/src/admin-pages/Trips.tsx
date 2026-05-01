import React, { useState, useEffect } from 'react';
import { Ic } from '../icons';
import Api from '../services/Api';

interface RouteOption {
  _id: string;
  name: string;
}

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
    bus_number: '',
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">Bus Number</label>
              <input 
                type="text" 
                required
                placeholder="Bus 101"
                value={formData.bus_number}
                onChange={e => setFormData({ ...formData, bus_number: e.target.value })}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-4 py-3 text-[13px] text-app-tx focus:outline-none focus:border-app-am transition-colors"
              />
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

// --- Edit Trip Modal ---
interface EditTripModalProps {
  trip: any;
  onClose: () => void;
  onSuccess: () => void;
}

const EditTripModal: React.FC<EditTripModalProps> = ({ trip, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const formattedDate = trip.rawDate ? new Date(trip.rawDate).toISOString().split('T')[0] : '';

  const [formData, setFormData] = useState({
    date: formattedDate,
    time_slot: trip.rawTimeSlot,
    bus_number: trip.busNumber,
    total_seats: trip.totalSeats
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await Api.put(`/trips/${trip.id}`, formData);
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="bg-app-card border border-app-bd w-full max-w-lg rounded-[2.5rem] relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-app-bd flex justify-between items-center bg-gradient-to-r from-blue-500/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 p-3 rounded-2xl text-blue-400">
              <Ic.Gear />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-widest text-app-tx">Edit Trip</h2>
              <p className="text-[10px] text-app-mu font-bold uppercase tracking-widest mt-1">{trip.routeName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-app-mu hover:text-app-tx transition-colors">
            <Ic.Close />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">Trip Date</label>
              <input 
                type="date" 
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-4 py-3 text-[13px] text-app-tx focus:outline-none focus:border-blue-400 transition-colors"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">Time Slot</label>
              <select 
                value={formData.time_slot}
                onChange={e => setFormData({ ...formData, time_slot: e.target.value })}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-4 py-3 text-[13px] text-app-tx focus:outline-none focus:border-blue-400 transition-colors appearance-none"
              >
                <option value="morning">Morning Outbound</option>
                <option value="return_1530">Return (3:30 PM)</option>
                <option value="return_1900">Return (7:00 PM)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">Bus Number</label>
              <input 
                type="text" 
                required
                value={formData.bus_number}
                onChange={e => setFormData({ ...formData, bus_number: e.target.value })}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-4 py-3 text-[13px] text-app-tx focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">Total Seats</label>
              <input 
                type="number" 
                required
                min="1"
                value={formData.total_seats}
                onChange={e => setFormData({ ...formData, total_seats: parseInt(e.target.value) || 0 })}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-4 py-3 text-[13px] text-app-tx focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>
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
              className="bg-blue-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Delete Confirmation Modal ---
interface DeleteModalProps {
  onConfirm: () => void;
  onClose: () => void;
  isSubmitting: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ onConfirm, onClose, isSubmitting }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="bg-app-card border border-app-bd w-full max-w-sm rounded-[2.5rem] relative z-10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-app-bd flex items-center gap-4">
          <div className="bg-red-500/10 p-3 rounded-2xl text-red-400">
            <Ic.Close />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-widest">Delete Trip</h2>
            <p className="text-[10px] text-app-mu font-bold uppercase tracking-widest mt-1">Permanent Action</p>
          </div>
        </div>
        <div className="p-8">
          <p className="text-xs text-app-mu font-bold uppercase tracking-wide leading-relaxed">
            Are you sure you want to delete this trip? This action cannot be undone.
          </p>
        </div>
        <div className="p-8 bg-app-card2 border-t border-app-bd flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 text-app-mu font-black text-[10px] uppercase tracking-widest hover:text-app-tx transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-red-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all"
          >
            {isSubmitting ? "Deleting..." : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Manage Trips Page ---

interface TripData {
  id: string;
  routeName: string;
  date: string;
  timeSlot: string;
  busNumber: string;
  bookedSeats: number;
  totalSeats: number;
  status: string;
  rawDate: string;
  rawTimeSlot: string;
}

const ManageTripsPage: React.FC = () => {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripData | null>(null);
  
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      const res = await Api.get('/trips');
      const rawTrips = res.data?.data || res.data || [];

      const departureTimeMap: Record<string, string> = {
        'morning': 'Morning',
        'return_1530': '3:30 PM',
        'return_1900': '7:00 PM'
      };

      const mappedTrips: TripData[] = rawTrips.map((t: any) => ({
        id: t._id,
        routeName: t.route?.name || 'Unknown Route',
        date: t.date ? new Date(t.date).toLocaleDateString() : 'N/A',
        timeSlot: departureTimeMap[t.time_slot] || t.time_slot,
        busNumber: t.bus_number || t.route?.code || 'Bus #01',
        bookedSeats: t.booked_seats || 0,
        totalSeats: t.total_seats || 40,
        status: t.status || 'scheduled',
        rawDate: t.date,
        rawTimeSlot: t.time_slot
      }));

      setTrips(mappedTrips);
    } catch (err) {
      console.error("Failed to fetch trips", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchTrips();
  };

  const handleEditSuccess = () => {
    setEditingTrip(null);
    fetchTrips();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTripId) return;
    setIsDeleting(true);
    try {
      await Api.delete(`/trips/${deletingTripId}`);
      setTrips(prev => prev.filter(t => t.id !== deletingTripId));
      setDeletingTripId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete trip");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 bg-app-bg text-app-tx p-8 overflow-y-auto custom-scrollbar min-h-screen">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-app-tx">Manage Trips</h1>
          <p className="text-[10px] font-black text-app-mu uppercase tracking-[0.2em] mt-1">Overview of all fleet schedules</p>
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

      {editingTrip && (
        <EditTripModal trip={editingTrip} onClose={() => setEditingTrip(null)} onSuccess={handleEditSuccess} />
      )}

      {deletingTripId && (
        <DeleteConfirmationModal 
          onClose={() => setDeletingTripId(null)} 
          onConfirm={handleDeleteConfirm} 
          isSubmitting={isDeleting} 
        />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
           <div className="animate-pulse text-app-mu font-black uppercase tracking-widest text-[10px]">Loading Trips Data...</div>
        </div>
      ) : trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-30">
          <Ic.Calendar size={48} />
          <p className="text-[10px] font-black uppercase tracking-widest text-app-mu">No trips scheduled</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {trips.map(trip => {
            const statusColors: Record<string, string> = {
              'scheduled': 'text-app-mu border-app-bd bg-app-card2',
              'active': 'text-app-ok border-app-ok/30 bg-app-ok/10',
              'completed': 'text-app-am border-app-am/30 bg-app-am/10',
              'cancelled': 'text-red-400 border-red-400/30 bg-red-500/10'
            };
            
            const colorClass = statusColors[trip.status] || statusColors['scheduled'];

            return (
              <div key={trip.id} className="bg-app-card border border-app-bd rounded-[2.5rem] p-6 hover:border-app-am/30 transition-all group shadow-sm hover:shadow-xl flex flex-col">
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-app-tx">{trip.routeName}</h3>
                    <div className="flex items-center gap-2 mt-2 text-app-mu">
                      <Ic.Calendar size={12} />
                      <span className="text-[10px] font-bold tracking-widest uppercase">{trip.date}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${colorClass}`}>
                    {trip.status}
                  </span>
                </div>

                <div className="space-y-4 mb-6 flex-1">
                  <div className="flex justify-between items-center pb-3 border-b border-app-bd/50">
                    <span className="text-[10px] font-black text-app-mu uppercase tracking-widest">Time Slot</span>
                    <span className="text-xs font-black uppercase text-app-tx">{trip.timeSlot}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-app-bd/50">
                    <span className="text-[10px] font-black text-app-mu uppercase tracking-widest">Bus Number</span>
                    <div className="flex items-center gap-2 text-app-tx">
                       <Ic.Bus size={12} className="text-app-am" />
                       <span className="text-xs font-black uppercase">{trip.busNumber}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-app-bd/50">
                    <span className="text-[10px] font-black text-app-mu uppercase tracking-widest">Occupancy</span>
                    <span className="text-xs font-black uppercase text-app-tx">{trip.bookedSeats} / {trip.totalSeats}</span>
                  </div>
                  
                  {/* Progress bar for occupancy */}
                  <div className="relative h-1.5 w-full bg-app-card2 rounded-full overflow-hidden mt-2">
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${trip.bookedSeats >= trip.totalSeats ? 'bg-red-400' : 'bg-app-am'}`}
                      style={{ width: `${Math.min((trip.bookedSeats / trip.totalSeats) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-app-bd/30">
                   <button 
                     onClick={() => setEditingTrip(trip)}
                     className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                   >
                     Edit
                   </button>
                   <button 
                     onClick={() => setDeletingTripId(trip.id)}
                     className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                   >
                     Delete
                   </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  );
};

export default ManageTripsPage;