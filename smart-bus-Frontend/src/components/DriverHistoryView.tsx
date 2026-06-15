import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Ic } from '../icons';
import Api from '../services/Api';

interface TripRecord {
  _id: string;
  date: string;
  time_slot: string;
  status: string;
  usersCount?: number;
  route?: { name: string };
  bus?: { busCode: string };
}

interface DriverHistoryViewProps {
  driverId?: string; // If undefined, fetch driver's own history
}

const DriverHistoryView: React.FC<DriverHistoryViewProps> = ({ driverId }) => {
  const { t } = useTranslation();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [timeSlotFilter, setTimeSlotFilter] = useState('All');
  const [returnTimeFilter, setReturnTimeFilter] = useState('All');

  const fetchHistory = async () => {
    setIsLoading(true);
    setError('');
    try {
      const endpoint = driverId ? `/trips/driver/${driverId}/history` : `/trips/my-history`;
      
      const params = new URLSearchParams();
      if (dateFilter) params.append('date', dateFilter);
      if (timeSlotFilter !== 'All') params.append('timeSlot', timeSlotFilter);
      if (timeSlotFilter === 'Return' && returnTimeFilter !== 'All') {
        params.append('specificReturnTime', returnTimeFilter);
      }

      const res = await Api.get(`${endpoint}?${params.toString()}`);
      setTrips(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || t('failed_load_history'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId, dateFilter, timeSlotFilter, returnTimeFilter]);

  const handleClearFilters = () => {
    setDateFilter('');
    setTimeSlotFilter('All');
    setReturnTimeFilter('All');
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-500/10 text-app-ok border border-green-500/20';
      case 'active':
      case 'in-progress':
      case 'in_progress': return 'bg-app-am/10 text-app-am border border-app-am/20';
      case 'cancelled': return 'bg-red-500/10 text-app-err border border-red-500/20';
      case 'scheduled': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      default: return 'bg-app-bd text-app-mu border border-app-bd';
    }
  };

  const formatTimeSlot = (ts: string) => {
    if (ts === 'morning') return t('morning_shift', 'Morning (7:30 AM)');
    if (ts === 'return_1530') return t('return_1530_shift', 'Return (3:30 PM)');
    if (ts === 'return_1900') return t('return_1900_shift', 'Return (7:00 PM)');
    return ts;
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Filters Bar */}
      <div className="bg-app-card border border-app-bd rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-app-mu">{t('date')}</label>
          <div className="relative flex items-center bg-app-bg border border-app-bd rounded-xl px-3 py-2 focus-within:border-app-am transition-colors cursor-pointer group w-full sm:w-[160px]">
            <span className="text-app-mu group-focus-within:text-app-am transition-colors mr-2 pointer-events-none">
              <Ic.Calendar size={14} />
            </span>
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-app-tx text-[11px] font-bold outline-none cursor-pointer w-full relative z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-app-mu">{t('shift')}</label>
          <select
            value={timeSlotFilter}
            onChange={(e) => {
              setTimeSlotFilter(e.target.value);
              if (e.target.value !== 'Return') setReturnTimeFilter('All');
            }}
            className="bg-app-bg text-app-tx border border-app-bd rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:border-app-am"
          >
            <option value="All">{t('all')}</option>
            <option value="Morning">{t('morning')}</option>
            <option value="Return">{t('return')}</option>
          </select>
        </div>

        {timeSlotFilter === 'Return' && (
          <div className="flex flex-col gap-1 animate-fadeIn">
            <label className="text-[9px] font-black uppercase tracking-widest text-app-mu">{t('return_time')}</label>
            <select
              value={returnTimeFilter}
              onChange={(e) => setReturnTimeFilter(e.target.value)}
              className="bg-app-bg text-app-tx border border-app-bd rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:border-app-am"
            >
              <option value="All">{t('all')}</option>
              <option value="15:30">{t('time_1530', '3:30 PM')}</option>
              <option value="19:00">{t('time_1900', '7:00 PM')}</option>
            </select>
          </div>
        )}

        {(dateFilter || timeSlotFilter !== 'All') && (
          <button 
            onClick={handleClearFilters}
            className="mt-auto mb-1 text-[10px] font-black uppercase tracking-widest text-app-am hover:text-red-400 transition-colors"
          >
            {t('clear_filters', 'Clear')}
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-app-card border border-app-bd rounded-2xl overflow-hidden min-h-[300px] flex flex-col relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-app-card/80 backdrop-blur-sm flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-app-bd border-t-app-am rounded-full animate-spin" />
          </div>
        )}

        {error && !isLoading && (
          <div className="p-8 text-center flex flex-col items-center gap-2 m-auto">
            <Ic.AlertCircle size={32} className="text-app-err opacity-80" />
            <p className="text-[11px] font-black uppercase tracking-widest text-app-err">{error}</p>
          </div>
        )}

        {!isLoading && !error && trips.length === 0 && (
          <div className="p-10 text-center flex flex-col items-center gap-3 m-auto opacity-50">
            <Ic.Clock size={40} className="text-app-mu" />
            <p className="text-[11px] font-black uppercase tracking-widest text-app-mu">
              {t('no_trips_found', 'No trips found for these filters')}
            </p>
          </div>
        )}

        {!isLoading && !error && trips.length > 0 && (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-app-bd bg-app-bg/30">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-app-mu">{t('date')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-app-mu">{t('route')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-app-mu">{t('bus', 'Bus')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-app-mu">{t('time_slot')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-app-mu">{t('students')}</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-app-mu">{t('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-bd">
                {trips.map((trip) => (
                  <tr key={trip._id} className="hover:bg-app-bg/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-bold text-app-tx whitespace-nowrap">
                        {new Date(trip.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 text-[12px] font-bold text-app-tx whitespace-nowrap">
                        <span className="text-app-am"><Ic.Pin size={13} /></span>
                        {trip.route?.name || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 text-[12px] font-bold text-app-tx whitespace-nowrap">
                        <span className="text-app-mu"><Ic.Bus size={13} /></span>
                        {trip.bus?.busCode || (trip as any).bus_number || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-app-mu whitespace-nowrap">
                        {formatTimeSlot(trip.time_slot)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-[12px] font-bold text-app-tx">
                        <Ic.Users size={14} className="text-app-mu" />
                        {trip.usersCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${getStatusClass(trip.status)}`}>
                        {t(trip.status.replace('-', '_'))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverHistoryView;
