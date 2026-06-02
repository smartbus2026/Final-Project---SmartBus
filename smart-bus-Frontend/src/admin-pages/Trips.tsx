import React, { useState, useEffect, useCallback } from 'react';
import { Ic } from '../icons';
import Api from '../services/Api';

interface Student {
  _id: string;
  name: string;
  email: string;
  bookingId: string;
}

interface AssignedTripData {
  id: string;
  routeId: string;
  routeName: string;
  busId: string;
  busNumber: string;
  driverName: string;
  timeSlot: string;
  specificReturnTime: string | null;
  passengerCount: number;
  students: Student[];
  date: string;
  status: string;
  actualIds?: string[];
}

const today = new Date().toISOString().split('T')[0];

const ManageTripsPage: React.FC = () => {
  const [trips, setTrips] = useState<AssignedTripData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Delete Logic ──
  const handleDelete = async (trip: AssignedTripData) => {
    if (!window.confirm("Are you sure you want to delete this trip?")) return;
    try {
      const tripIds = trip.actualIds && trip.actualIds.length > 0 
        ? trip.actualIds 
        : [trip.id]; // fallback
        
      await Api.delete('/trips/bulk', { 
        data: { tripIds } 
      });
      setTrips(prev => prev.filter(t => t.id !== trip.id));
    } catch (err: any) {
      console.error("Failed to delete trip", err);
      alert(err.response?.data?.message || "Failed to delete trip.");
    }
  };

  // ── Edit Logic ──
  const [editingTrip, setEditingTrip] = useState<AssignedTripData | null>(null);
  const [editForm, setEditForm] = useState({ bus_number: '', time_slot: '' });

  const handleEditClick = (trip: AssignedTripData) => {
    setEditingTrip(trip);
    // Determine internal timeslot value mapping for the form based on presentation
    let internalSlot = "morning";
    if (trip.timeSlot === "Return") {
      internalSlot = trip.specificReturnTime === "19:00" ? "return_1900" : "return_1530";
    }
    setEditForm({
      bus_number: trip.busNumber || '',
      time_slot: internalSlot
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;
    try {
      const targetId = editingTrip.actualIds && editingTrip.actualIds.length > 0 
        ? editingTrip.actualIds[0] 
        : editingTrip.id;

      if (targetId.includes("-")) {
        alert("Cannot edit: No real Trip found for this assignment group.");
        return;
      }

      const res = await Api.put(`/trips/${targetId}`, editForm);
      const updatedTrip = res.data;

      
      // Compute presentation values
      let presentSlot = "Morning";
      let presentReturn = null;
      if (updatedTrip.time_slot === "return_1530") {
        presentSlot = "Return"; presentReturn = "15:30";
      } else if (updatedTrip.time_slot === "return_1900") {
        presentSlot = "Return"; presentReturn = "19:00";
      }

      setTrips(prev => prev.map(t => {
        if (t.id === editingTrip.id) {
          return {
            ...t,
            busNumber: updatedTrip.bus_number || t.busNumber,
            timeSlot: presentSlot,
            specificReturnTime: presentReturn
          };
        }
        return t;
      }));
      setEditingTrip(null);
    } catch (err: any) {
      console.error("Failed to update trip", err);
      alert(err.response?.data?.message || "Failed to update trip.");
    }
  };

  // ── Filters ──
  const [selectedDate, setSelectedDate] = useState(today);
  const [filterRoute, setFilterRoute] = useState('');
  const [filterBus, setFilterBus] = useState('');
  const [filterTimeSlot, setFilterTimeSlot] = useState('');

  const fetchTrips = useCallback(async (date: string) => {
    try {
      setIsLoading(true);
      const res = await Api.get(`/bookings/admin/assigned-trips?date=${date}`);
      const rawTrips = res.data?.data?.trips || [];
      setTrips(rawTrips.map((t: any) => ({
        ...t,
        driverName: t.driverName || t.bus?.driver || 'Unassigned',
        busNumber: t.busNumber || t.bus?.busCode || 'Unknown Bus',
      })));
    } catch (err) {
      console.error("Failed to fetch assigned trips", err);
      setTrips([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips(selectedDate);
  }, [selectedDate, fetchTrips]);

  // ── Derived unique values for filter dropdowns ──
  const uniqueRoutes = Array.from(new Set(trips.map(t => t.routeName))).filter(Boolean);
  const uniqueBuses  = Array.from(new Set(trips.map(t => t.busNumber))).filter(Boolean);

  // ── Client-side filtering ──
  const filteredTrips = trips.filter(t => {
    if (filterRoute    && t.routeName  !== filterRoute)    return false;
    if (filterBus      && t.busNumber  !== filterBus)      return false;
    if (filterTimeSlot && t.timeSlot   !== filterTimeSlot) return false;
    return true;
  });

  const statusColors: Record<string, string> = {
    assigned:  'text-blue-400 border-blue-400/30 bg-blue-500/10',
    active:    'text-app-ok border-app-ok/30 bg-app-ok/10',
    completed: 'text-app-am border-app-am/30 bg-app-am/10',
  };

  const selectClass =
    "bg-app-bg text-app-tx text-[10px] font-bold uppercase tracking-widest border border-app-bd rounded-xl px-3 py-2 focus:outline-none focus:border-app-am transition-colors";

  return (
    <div className="flex-1 bg-app-bg text-app-tx p-8 overflow-y-auto custom-scrollbar min-h-screen">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-app-tx">
            Assigned Trips
          </h1>
          <p className="text-[10px] font-black text-app-mu uppercase tracking-[0.2em] mt-1">
            Overview of all dispatched fleet schedules
          </p>
        </div>
        <div className="flex items-center gap-2 bg-app-card border border-app-bd rounded-xl px-3 py-2">
          <Ic.Calendar size={14} className="text-app-am shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest text-app-mu mr-1">Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-transparent text-app-tx text-[11px] font-bold focus:outline-none"
          />
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 bg-app-card border border-app-bd rounded-2xl">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-app-mu">Route</label>
          <select
            value={filterRoute}
            onChange={e => setFilterRoute(e.target.value)}
            className={selectClass}
          >
            <option value="">All Routes</option>
            {uniqueRoutes.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-app-mu">Bus Number</label>
          <select
            value={filterBus}
            onChange={e => setFilterBus(e.target.value)}
            className={selectClass}
          >
            <option value="">All Buses</option>
            {uniqueBuses.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-app-mu">Time Slot</label>
          <select
            value={filterTimeSlot}
            onChange={e => setFilterTimeSlot(e.target.value)}
            className={selectClass}
          >
            <option value="">All Time Slots</option>
            <option value="Morning">Morning</option>
            <option value="Return">Return</option>
          </select>
        </div>

        {/* Reset filters */}
        {(filterRoute || filterBus || filterTimeSlot) && (
          <div className="sm:col-span-3 flex justify-end">
            <button
              onClick={() => { setFilterRoute(''); setFilterBus(''); setFilterTimeSlot(''); }}
              className="text-[10px] font-black uppercase tracking-widest text-app-am hover:underline"
            >
              ✕ Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* ── Summary Badge ── */}
      {!isLoading && (
        <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest mb-4">
          Showing <span className="text-app-tx">{filteredTrips.length}</span> trip{filteredTrips.length !== 1 ? 's' : ''} for{' '}
          <span className="text-app-am">{selectedDate === today ? 'Today' : selectedDate}</span>
        </p>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-app-bd border-t-app-am rounded-full animate-spin" />
            <div className="animate-pulse text-app-mu font-black uppercase tracking-widest text-[10px]">Loading Trips...</div>
          </div>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-30">
          <Ic.Bus size={48} />
          <p className="text-[10px] font-black uppercase tracking-widest text-app-mu">
            No assigned trips match your filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTrips.map(trip => {
            const colorClass = statusColors[trip.status] || 'text-app-mu border-app-bd bg-app-card2';
            const isExpanded = expandedId === trip.id;

            return (
              <div
                key={trip.id}
                className="bg-white dark:bg-app-card border border-gray-200 dark:border-app-bd rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4"
              >
                {/* Card Top Title & Status */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-app-tx">{trip.routeName}</h3>
                    <div className="flex items-center gap-2 mt-2 text-app-mu">
                      <Ic.Calendar size={12} />
                      <span className="text-[10px] font-bold tracking-widest uppercase">
                        {new Date(trip.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${colorClass}`}>
                      {trip.status}
                    </span>
                    <button onClick={() => handleEditClick(trip)} className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10 px-2 py-1 rounded-lg transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(trip)} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Info Rows */}
                <div className="flex flex-col gap-4 flex-1">
                  
                  {/* Time Slot Row */}
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                      <Ic.Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-app-mu uppercase tracking-widest">Time Slot</span>
                      <span className="text-xs font-black uppercase text-app-tx">
                        {trip.timeSlot}
                        {trip.specificReturnTime && trip.specificReturnTime !== 'none'
                          ? ` (${trip.specificReturnTime})` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Bus Row */}
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                      <Ic.Bus className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-app-mu uppercase tracking-widest">Bus Number</span>
                      <span className="text-xs font-black uppercase text-app-tx">{trip.busNumber}</span>
                    </div>
                  </div>

                  {/* Driver Row */}
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                      <Ic.Users className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-app-mu uppercase tracking-widest">Driver</span>
                      <span className="text-xs font-bold text-app-tx">{trip.driverName || 'Unassigned'}</span>
                    </div>
                  </div>

                  {/* Passengers Row */}
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shrink-0">
                      <Ic.Users className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-app-mu uppercase tracking-widest">Passengers</span>
                      <span className="text-xs font-black uppercase text-app-tx">{trip.passengerCount} passengers</span>
                    </div>
                  </div>

                </div>

                {/* Expand Button */}
                {trip.students && trip.students.length > 0 && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : trip.id)}
                    className="w-full mt-auto py-2.5 rounded-lg border border-app-bd text-[10px] font-black uppercase tracking-widest text-app-mu hover:border-app-am hover:text-app-tx transition-all flex items-center justify-center gap-2"
                  >
                    {isExpanded ? '▲ Hide Students' : `▼ View ${trip.students.length} Student${trip.students.length !== 1 ? 's' : ''}`}
                  </button>
                )}

                {/* Expandable Student List */}
                {isExpanded && trip.students && (
                  <div className="border-t border-app-bd bg-app-bg/50 px-2 py-4 space-y-2 max-h-56 overflow-y-auto rounded-lg">
                    <p className="text-[9px] font-black uppercase tracking-widest text-app-am mb-3">Assigned Students</p>
                    {trip.students.map((s, i) => (
                      <div key={s._id || i} className="flex items-center justify-between py-2 border-b border-app-bd/30 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-app-am/10 flex items-center justify-center text-app-am text-[9px] font-black">
                            {s.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-app-tx leading-none">{s.name}</p>
                            <p className="text-[9px] text-app-mu mt-0.5">{s.email}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-app-mu">
                          #{s.bookingId?.toString().slice(-5).toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-app-card border border-app-bd rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative">
            <h2 className="text-xl font-black uppercase tracking-widest text-app-tx mb-6">Edit Trip</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-app-mu mb-2">Bus Number</label>
                <input
                  type="text"
                  value={editForm.bus_number}
                  onChange={e => setEditForm({ ...editForm, bus_number: e.target.value })}
                  className="w-full bg-app-bg text-app-tx border border-app-bd rounded-xl px-4 py-3 focus:outline-none focus:border-app-am transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-app-mu mb-2">Time Slot</label>
                <select
                  value={editForm.time_slot}
                  onChange={e => setEditForm({ ...editForm, time_slot: e.target.value })}
                  className="w-full bg-app-bg text-app-tx border border-app-bd rounded-xl px-4 py-3 focus:outline-none focus:border-app-am transition-colors"
                  required
                >
                  <option value="morning">Morning</option>
                  <option value="return_1530">Return 15:30</option>
                  <option value="return_1900">Return 19:00</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setEditingTrip(null)}
                  className="px-6 py-3 rounded-xl border border-app-bd text-[10px] font-black uppercase tracking-widest text-app-mu hover:text-app-tx transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-app-am text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-colors shadow-lg shadow-app-am/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTripsPage;