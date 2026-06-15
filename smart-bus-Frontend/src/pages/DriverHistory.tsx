import React from 'react';
import { useTranslation } from 'react-i18next';
import DriverHistoryView from '../components/DriverHistoryView';

const DriverHistory: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 bg-app-bg p-4 sm:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-app-tx mb-2">
          {t('trip_history', 'Trip History')}
        </h1>
        <p className="text-[11px] font-bold uppercase tracking-widest text-app-mu mb-8">
          {t('view_past_trips', 'View your past and completed trips')}
        </p>

        <DriverHistoryView />
      </div>
    </div>
  );
};

export default DriverHistory;
