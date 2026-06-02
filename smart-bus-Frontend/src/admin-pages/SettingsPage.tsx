import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Ic } from '../icons';
import Api from '../services/Api';

const AdminSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingQuota, setSavingQuota] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });
  
  const [bookingWindow, setBookingWindow] = useState({
    start: '08:00',
    end: '14:00'
  });

  const [quotaSettings, setQuotaSettings] = useState({
    defaultShiftLimit: 7,
    monthlyBusQuota: 280
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [res, quotaRes] = await Promise.all([
          Api.get('/settings'),
          Api.get('/admin/settings')
        ]);

        const settings = res.data?.data?.settings;
        if (settings) {
          const formatTime = (h: number, m: number) => 
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          setBookingWindow({
            start: formatTime(settings.booking_open_hour, settings.booking_open_minute),
            end: formatTime(settings.booking_close_hour, settings.booking_close_minute)
          });
        }

        const sys = quotaRes.data?.data?.settings;
        if (sys) {
          setQuotaSettings({
            defaultShiftLimit: Number(sys.defaultShiftLimit ?? 7),
            monthlyBusQuota: Number(sys.monthlyBusQuota ?? 280)
          });
        }
      } catch (err) {
        console.error("Failed to fetch system settings", err);
        setToast({ msg: t('failed_load_admin_settings'), type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [t]);

  useEffect(() => {
    if (!toast.msg) return;
    const timer = setTimeout(() => setToast({ msg: '', type: null }), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleUpdateBookingWindow = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const [openH, openM] = bookingWindow.start.split(':').map(Number);
      const [closeH, closeM] = bookingWindow.end.split(':').map(Number);
      
      await Api.put('/settings', {
        booking_open_hour: openH,
        booking_open_minute: openM,
        booking_close_hour: closeH,
        booking_close_minute: closeM
      });
      setToast({ msg: t('booking_window_updated'), type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ msg: t('failed_update_booking_window'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuotaSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuota(true);
    try {
      await Api.put('/admin/settings', {
        defaultShiftLimit: quotaSettings.defaultShiftLimit,
        monthlyBusQuota: quotaSettings.monthlyBusQuota
      });
      setToast({ msg: t('fleet_quota_updated'), type: 'success' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('update_failed_generic');
      setToast({ msg, type: 'error' });
    } finally {
      setSavingQuota(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ msg: t('passwords_mismatch'), type: 'error' });
      return;
    }
    
    try {
      const profileRes = await Api.get('/users/profile');
      const adminId = profileRes.data._id;
      
      await Api.put(`/users/${adminId}`, {
        password: passwordForm.newPassword
      });
      
      setToast({ msg: t('password_updated'), type: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      setToast({ msg: t('failed_update_password'), type: 'error' });
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  if (loading) {
    return <div className="p-8 text-center text-app-mu font-black uppercase tracking-widest text-[11px] animate-pulse">{t('loading_system_config')}</div>;
  }

  return (
    <div className="p-8 space-y-8 bg-app-bg text-app-tx min-h-screen transition-colors duration-500 animate-in fade-in zoom-in-95">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-app-tx">{t('control_center')}</h2>
          <p className="text-[10px] font-black text-app-mu uppercase tracking-[0.2em] mt-1">{t('system_security_config')}</p>
        </div>
      </div>

      {toast.msg && (
        <div className={`border p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 ${
          toast.type === 'success' ? 'bg-app-ok/20 border-app-ok text-app-ok' : 'bg-app-err/20 border-app-err text-app-err'
        }`}>
          {toast.type === 'success' ? <Ic.Check size={18} /> : <Ic.X size={18} />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-app-card border border-app-bd rounded-[2.5rem] p-8 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-[1.5rem] bg-app-am/10 flex items-center justify-center text-app-am border border-app-am/20 shadow-inner">
              <Ic.Calendar />
            </div>
            <div>
              <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-app-tx">{t('system_settings')}</h3>
              <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest mt-0.5">{t('global_booking_window')}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateBookingWindow} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-app-mu ml-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-app-ok"></span> {t('registration_start')}
                </label>
                <input 
                  type="time" 
                  value={bookingWindow.start}
                  onChange={(e) => setBookingWindow({...bookingWindow, start: e.target.value})}
                  className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-4 text-[14px] font-bold text-app-tx focus:outline-none focus:border-app-am focus:ring-1 focus:ring-app-am/30 transition-all"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-app-mu ml-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-app-err"></span> {t('registration_end')}
                </label>
                <input 
                  type="time" 
                  value={bookingWindow.end}
                  onChange={(e) => setBookingWindow({...bookingWindow, end: e.target.value})}
                  className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-4 text-[14px] font-bold text-app-tx focus:outline-none focus:border-app-am focus:ring-1 focus:ring-app-am/30 transition-all"
                  required
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-app-am/5 border border-app-am/20">
              <p className="text-[11px] font-bold text-app-mu leading-relaxed">
                <strong className="text-app-tx">{t('note_label')}</strong> {t('booking_window_note_extended')}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                type="submit"
                disabled={saving}
                className="bg-app-am text-black font-black uppercase text-[11px] tracking-widest px-8 py-4 rounded-2xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Ic.Save size={16} />
                {saving ? t('updating') : t('update_booking_window')}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-app-card border border-app-bd rounded-[2.5rem] p-8 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-[1.5rem] bg-app-am/10 flex items-center justify-center text-app-am border border-app-am/20 shadow-inner">
              <Ic.Bus />
            </div>
            <div>
              <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-app-tx">{t('fleet_quota')}</h3>
              <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest mt-0.5">{t('monthly_renewal_shift')}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateQuotaSettings} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu ml-1">{t('max_buses_per_shift')}</label>
              <input
                type="number"
                min={1}
                value={quotaSettings.defaultShiftLimit}
                onChange={(e) => setQuotaSettings(s => ({ ...s, defaultShiftLimit: Number(e.target.value) }))}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-3.5 text-[13px] text-app-tx font-bold outline-none focus:border-app-am transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu ml-1">{t('total_monthly_bus_quota')}</label>
              <input
                type="number"
                min={1}
                value={quotaSettings.monthlyBusQuota}
                onChange={(e) => setQuotaSettings(s => ({ ...s, monthlyBusQuota: Number(e.target.value) }))}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-3.5 text-[13px] text-app-tx font-bold outline-none focus:border-app-am transition-colors"
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingQuota}
                className="bg-app-am text-black font-black uppercase text-[11px] tracking-widest px-8 py-4 rounded-2xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Ic.Save size={16} />
                {savingQuota ? t('updating') : t('update_fleet_quota')}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-8 h-fit">
          
          <div className="bg-app-card border border-app-bd rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-[1.5rem] bg-app-tx/5 flex items-center justify-center text-app-tx border border-app-tx/10 shadow-inner">
                <Ic.Shield />
              </div>
              <div>
                <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-app-tx">{t('security')}</h3>
                <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest mt-0.5">{t('admin_authentication')}</p>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-app-mu ml-1">{t('current_password')}</label>
                <input 
                  type="password" 
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-3.5 text-[13px] text-app-tx focus:outline-none focus:border-app-am transition-colors"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-app-mu ml-1">{t('new_password')}</label>
                  <input 
                    type="password" 
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-3.5 text-[13px] text-app-tx focus:outline-none focus:border-app-am transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-app-mu ml-1">{t('confirm_password')}</label>
                  <input 
                    type="password" 
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-3.5 text-[13px] text-app-tx focus:outline-none focus:border-app-am transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  className="bg-app-card2 border border-app-bd text-app-tx hover:text-app-am hover:border-app-am font-black uppercase text-[11px] tracking-widest px-8 py-3.5 rounded-2xl transition-all"
                >
                  {t('change_password_btn')}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-app-card border border-app-bd rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-[1.5rem] bg-app-tx/5 flex items-center justify-center text-app-tx border border-app-tx/10 shadow-inner">
                {theme === 'dark' ? <Ic.Moon /> : <Ic.Sun />}
              </div>
              <div>
                <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-app-tx">{t('preferences')}</h3>
                <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest mt-0.5">{t('interface_appearance')}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-app-card2 border border-app-bd/50">
              <div>
                <p className="text-[12px] font-black uppercase tracking-wider text-app-tx">{t('theme_mode')}</p>
                <p className="text-[10px] font-bold text-app-mu mt-0.5">{t('theme_toggle_desc')}</p>
              </div>
              <button 
                onClick={toggleTheme}
                className="w-14 h-8 rounded-full bg-app-bd relative transition-colors"
                style={{ backgroundColor: theme === 'dark' ? 'var(--am-color, #ECA833)' : undefined }}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`}></div>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminSettingsPage;
