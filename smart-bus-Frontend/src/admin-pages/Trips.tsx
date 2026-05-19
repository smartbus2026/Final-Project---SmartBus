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
}

const today = new Date().toISOString().split('T')[0];

const ManageTripsPage: React.FC = () => {
  const [trips, setTrips] = useState<AssignedTripData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
                className="bg-app-card border border-app-bd rounded-[2.5rem] overflow-hidden hover:border-app-am/30 transition-all shadow-sm hover:shadow-xl flex flex-col"
              >
                {/* Card Header */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-app-tx">{trip.routeName}</h3>
                      <div className="flex items-center gap-2 mt-2 text-app-mu">
                        <Ic.Calendar size={12} />
                        <span className="text-[10px] font-bold tracking-widest uppercase">
                          {new Date(trip.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${colorClass}`}>
                      {trip.status}
                    </span>
                  </div>

                  {/* Info Rows */}
                  <div className="space-y-3 mb-5 flex-1">
                    <div className="flex justify-between items-center pb-3 border-b border-app-bd/50">
                      <span className="text-[10px] font-black text-app-mu uppercase tracking-widest">Time Slot</span>
                      <span className="text-xs font-black uppercase text-app-tx">
                        {trip.timeSlot}
                        {trip.specificReturnTime && trip.specificReturnTime !== 'none'
                          ? ` (${trip.specificReturnTime})` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-app-bd/50">
                      <span className="text-[10px] font-black text-app-mu uppercase tracking-widest">Bus</span>
                      <div className="flex items-center gap-2 text-app-tx">
                        <Ic.Bus size={12} className="text-app-am" />
                        <span className="text-xs font-black uppercase">{trip.busNumber}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-app-bd/50">
                      <span className="text-[10px] font-black text-app-mu uppercase tracking-widest">Driver</span>
                      <span className="text-xs font-bold text-app-tx">{trip.driverName || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-app-mu uppercase tracking-widest">Passengers</span>
                      <div className="flex items-center gap-2">
                        <Ic.Users size={12} className="text-app-am" />
                        <span className="text-xs font-black uppercase text-app-tx">{trip.passengerCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expand Button */}
                  {trip.students && trip.students.length > 0 && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : trip.id)}
                      className="w-full mt-2 py-2 rounded-xl border border-app-bd text-[10px] font-black uppercase tracking-widest text-app-mu hover:border-app-am hover:text-app-tx transition-all flex items-center justify-center gap-2"
                    >
                      {isExpanded ? '▲ Hide Students' : `▼ View ${trip.students.length} Student${trip.students.length !== 1 ? 's' : ''}`}
                    </button>
                  )}
                </div>

                {/* Expandable Student List */}
                {isExpanded && trip.students && (
                  <div className="border-t border-app-bd bg-app-bg/50 px-6 py-4 space-y-2 max-h-56 overflow-y-auto">
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
    </div>
  );
};

export default ManageTripsPage;