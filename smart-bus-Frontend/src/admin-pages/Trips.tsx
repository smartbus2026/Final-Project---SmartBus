import React, { useState, useEffect } from 'react';
import { Ic } from '../icons';
import Api from '../services/Api';

interface AssignedTripData {
  id: string;
  routeId: string;
  routeName: string;
  busId: string;
  busNumber: string;
  timeSlot: string;
  specificReturnTime: string;
  passengerCount: number;
  date: string;
  status: string;
}

const ManageTripsPage: React.FC = () => {
  const [trips, setTrips] = useState<AssignedTripData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      const res = await Api.get('/bookings/admin/assigned-trips');
      const rawTrips = res.data?.data?.trips || [];
      
      setTrips(rawTrips.map((t: any) => ({
        ...t,
        date: t.date ? new Date(t.date).toLocaleDateString() : 'N/A'
      })));
    } catch (err) {
      console.error("Failed to fetch assigned trips", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return (
    <div className="flex-1 bg-app-bg text-app-tx p-8 overflow-y-auto custom-scrollbar min-h-screen">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-app-tx">Assigned Trips</h1>
          <p className="text-[10px] font-black text-app-mu uppercase tracking-[0.2em] mt-1">Overview of all dispatched fleet schedules</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
           <div className="animate-pulse text-app-mu font-black uppercase tracking-widest text-[10px]">Loading Trips Data...</div>
        </div>
      ) : trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-30">
          <Ic.Bus size={48} />
          <p className="text-[10px] font-black uppercase tracking-widest text-app-mu">No trips currently assigned</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {trips.map(trip => {
            const statusColors: Record<string, string> = {
              'assigned': 'text-blue-400 border-blue-400/30 bg-blue-500/10',
              'active': 'text-app-ok border-app-ok/30 bg-app-ok/10',
              'completed': 'text-app-am border-app-am/30 bg-app-am/10',
            };
            
            const colorClass = statusColors[trip.status] || 'text-app-mu border-app-bd bg-app-card2';

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
                    <span className="text-xs font-black uppercase text-app-tx">
                      {trip.timeSlot} {trip.timeSlot === 'Return' && trip.specificReturnTime !== 'none' ? `(${trip.specificReturnTime})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-app-bd/50">
                    <span className="text-[10px] font-black text-app-mu uppercase tracking-widest">Bus Number</span>
                    <div className="flex items-center gap-2 text-app-tx">
                       <Ic.Bus size={12} className="text-app-am" />
                       <span className="text-xs font-black uppercase">{trip.busNumber}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-app-bd/50">
                    <span className="text-[10px] font-black text-app-mu uppercase tracking-widest">Passengers</span>
                    <div className="flex items-center gap-2 text-app-tx">
                       <Ic.Users size={12} className="text-app-am" />
                       <span className="text-xs font-black uppercase">{trip.passengerCount}</span>
                    </div>
                  </div>
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