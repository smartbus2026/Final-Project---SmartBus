import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Api from '../services/Api';
import { Ic } from '../icons';

export default function AdminSettings() {
  const { t } = useTranslation();
  const [openTime, setOpenTime] = useState("20:00");
  const [closeTime, setCloseTime] = useState("23:00");
  const [morningStart, setMorningStart] = useState("08:30 AM");
  const [returnTimes, setReturnTimes] = useState<string[]>([]);
  const [newReturnTime, setNewReturnTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Api.get('/settings').then(res => {
      const s = res.data?.data?.settings;
      if (s) {
        setOpenTime(`${String(s.booking_open_hour).padStart(2,'0')}:${String(s.booking_open_minute).padStart(2,'0')}`);
        setCloseTime(`${String(s.booking_close_hour).padStart(2,'0')}:${String(s.booking_close_minute).padStart(2,'0')}`);
        setMorningStart(s.morningStartTime || "08:30 AM");
        setReturnTimes(s.returnTimeOptions || ["3:30 PM", "7:00 PM"]);
      }
    }).finally(() => setIsLoading(false));
  }, []);

  const handleAddReturnTime = () => {
    if (newReturnTime && !returnTimes.includes(newReturnTime)) {
      setReturnTimes([...returnTimes, newReturnTime]);
      setNewReturnTime("");
    }
  };

  const handleRemoveReturnTime = (time: string) => {
    setReturnTimes(returnTimes.filter(rt => rt !== time));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const [oh, om] = openTime.split(":").map(Number);
      const [ch, cm] = closeTime.split(":").map(Number);
      await Api.put('/settings', {
        booking_open_hour: oh,
        booking_open_minute: om,
        booking_close_hour: ch,
        booking_close_minute: cm,
        morningStartTime: morningStart,
        returnTimeOptions: returnTimes
      });
      setMessage(t('settings_saved'));
    } catch {
      setMessage(t('failed_save_settings'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-app-tx">{t('loading_settings')}</div>;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h3 className="font-bold text-app-tx uppercase tracking-widest text-xs mb-1">{t('system_settings')}</h3>
        <p className="text-[11px] text-app-mu font-medium">{t('configure_global_params')}</p>
      </div>

      {message && (
        <div className="bg-app-am/10 border border-app-am text-app-am p-4 rounded-xl text-xs font-bold uppercase tracking-widest">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-app-card border border-app-bd rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="text-app-am"><Ic.Calendar size={18} /></div>
            <h4 className="text-sm font-black text-app-tx uppercase tracking-tight">{t('registration_window')}</h4>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-app-mu mb-2">{t('daily_opening_time')}</label>
                <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full bg-app-card2 border border-app-bd rounded-xl px-4 py-3 text-sm text-app-tx outline-none focus:border-app-am/50" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-app-mu mb-2">{t('daily_closing_time')}</label>
                <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full bg-app-card2 border border-app-bd rounded-xl px-4 py-3 text-sm text-app-tx outline-none focus:border-app-am/50" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-app-mu mb-2">{t('morning_trip_start')}</label>
              <p className="text-[9px] text-app-mu2 mb-2">{t('morning_start_hint')}</p>
              <input type="text" placeholder={t('morning_start_placeholder')} value={morningStart} onChange={(e) => setMorningStart(e.target.value)}
                className="w-full bg-app-card2 border border-app-bd rounded-xl px-4 py-3 text-sm text-app-tx outline-none focus:border-app-am/50" />
            </div>
          </div>
        </div>

        <div className="bg-app-card border border-app-bd rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="text-app-am"><Ic.Route size={18} /></div>
            <h4 className="text-sm font-black text-app-tx uppercase tracking-tight">{t('return_time_options')}</h4>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder={t('return_time_placeholder')} 
                value={newReturnTime}
                onChange={(e) => setNewReturnTime(e.target.value)}
                className="flex-1 bg-app-card2 border border-app-bd rounded-xl px-4 py-3 text-sm text-app-tx outline-none focus:border-app-am/50" 
              />
              <button 
                onClick={handleAddReturnTime}
                className="bg-app-am/10 text-app-am px-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-app-am hover:text-black transition-all"
              >
                {t('add_btn')}
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {returnTimes.map(rt => (
                <div key={rt} className="flex items-center gap-2 bg-app-card2 border border-app-bd rounded-lg pl-3 pr-2 py-2">
                  <span className="text-[11px] font-bold text-app-tx uppercase">{rt}</span>
                  <button 
                    onClick={() => handleRemoveReturnTime(rt)}
                    className="text-app-err hover:bg-red-500/10 p-1 rounded-md transition-colors"
                  >
                    <Ic.X size={12} />
                  </button>
                </div>
              ))}
              {returnTimes.length === 0 && (
                <div className="text-[10px] text-app-mu font-bold uppercase w-full text-center py-4">{t('no_return_times')}</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-app-card border border-app-bd rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="text-app-am"><Ic.Bell size={18} /></div>
            <h4 className="text-sm font-black text-app-tx uppercase tracking-tight">{t('global_alerts')}</h4>
          </div>
          <div className="space-y-3">
            {[t('push_notifications'), t('email_receipts'), t('sms_alerts')].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 hover:bg-app-card2 rounded-xl transition-colors">
                <span className="text-xs text-app-mu font-medium">{item}</span>
                <input type="checkbox" defaultChecked className="accent-app-am" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-app-am text-black px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? t('saving') : t('save_changes')}
        </button>
      </div>
    </div>
  );
}
