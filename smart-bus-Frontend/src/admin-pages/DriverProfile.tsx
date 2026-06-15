import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Ic } from '../icons';
import Api from '../services/Api';
import DriverHistoryView from '../components/DriverHistoryView';

interface DriverData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
  role?: string;
}

const DriverProfile: React.FC = () => {
  const { t } = useTranslation();
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();

  const [driver, setDriver] = useState<DriverData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!driverId) return;
    const load = async () => {
      try {
        const res = await Api.get('/users');
        const users = res.data?.data || res.data;
        const found = users.find((u: DriverData) => u._id === driverId);
        if (found) {
          setDriver(found);
        } else {
          setError(t('driver_not_found', 'Driver not found'));
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.response?.data?.message || t('failed_load_driver', 'Failed to load driver profile'));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [driverId, t]);

  if (isLoading) {
    return (
      <div className="flex-1 bg-app-bg p-8 flex flex-col items-center justify-center gap-4 min-h-screen">
        <div className="w-10 h-10 border-2 border-app-bd border-t-app-am rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-app-mu animate-pulse">{t('loading_driver', 'Loading driver...')}</p>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="flex-1 bg-app-bg p-8 flex flex-col items-center justify-center gap-4 min-h-screen">
        <Ic.Users size={48} className="opacity-20 text-app-mu" />
        <p className="text-app-err font-black uppercase text-[11px] tracking-widest">{error || t('driver_not_found', 'Driver not found')}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[10px] font-black uppercase tracking-widest text-app-am hover:underline">
          ← {t('go_back', 'Go Back')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-app-bg text-app-tx p-8 overflow-y-auto custom-scrollbar min-h-screen no-scrollbar">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-app-mu hover:text-app-tx transition-colors mb-6"
      >
        ← {t('back_to_users', 'Back to Users')}
      </button>

      <div className="bg-app-card border border-app-bd rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-app-am/10 flex items-center justify-center text-app-am text-3xl font-black shrink-0">
          {driver.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black uppercase tracking-widest text-app-tx">{driver.name}</h1>
          <p className="text-[11px] text-app-mu mt-1">{driver.email}</p>
          {driver.phone && <p className="text-[11px] text-app-mu">{driver.phone}</p>}
          {driver.createdAt && (
            <p className="text-[9px] font-bold text-app-mu mt-2 uppercase tracking-widest">
              {t('joined', 'Joined')} {new Date(driver.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-app-tx mb-1">{t('trip_history', 'Trip History')}</h2>
        <p className="text-[10px] font-bold text-app-mu mb-4 uppercase tracking-widest">{t('view_driver_past_trips', 'View assigned and completed trips for this driver')}</p>
      </div>

      <DriverHistoryView driverId={driverId} />
    </div>
  );
};

export default DriverProfile;
