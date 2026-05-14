import React, { useState, useEffect } from 'react';
import { Ic } from '../icons';
import Api from '../services/Api';

const AdminSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings State
  const [bookingWindow, setBookingWindow] = useState({
    start: '08:00',
    end: '14:00'
  });

  // Security State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await Api.get('/settings');
        const settings = res.data?.data?.settings;
        if (settings) {
          const formatTime = (h: number, m: number) => 
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          setBookingWindow({
            start: formatTime(settings.booking_open_hour, settings.booking_open_minute),
            end: formatTime(settings.booking_close_hour, settings.booking_close_minute)
          });
        }
      } catch (err) {
        console.error("Failed to fetch system settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

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
      alert('System booking window updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update booking window.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    
    try {
      const profileRes = await Api.get('/users/profile');
      const adminId = profileRes.data._id;
      
      await Api.put(`/users/${adminId}`, {
        password: passwordForm.newPassword
      });
      
      alert('Admin password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to update password.');
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  if (loading) {
    return <div className="p-8 text-center text-app-mu font-black uppercase tracking-widest text-[11px] animate-pulse">Loading System Configurations...</div>;
  }

  return (
    <div className="p-8 space-y-8 bg-app-bg text-app-tx min-h-screen transition-colors duration-500 animate-in fade-in zoom-in-95">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-app-tx">Control Center</h2>
          <p className="text-[10px] font-black text-app-mu uppercase tracking-[0.2em] mt-1">System & Security Configurations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 1: System Settings (Booking Window) */}
        <div className="bg-app-card border border-app-bd rounded-[2.5rem] p-8 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-[1.5rem] bg-app-am/10 flex items-center justify-center text-app-am border border-app-am/20 shadow-inner">
              <Ic.Calendar />
            </div>
            <div>
              <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-app-tx">System Settings</h3>
              <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest mt-0.5">Global Trip Booking Window</p>
            </div>
          </div>

          <form onSubmit={handleUpdateBookingWindow} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-app-mu ml-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-app-ok"></span> Registration Start Time
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
                  <span className="w-1.5 h-1.5 rounded-full bg-app-err"></span> Registration End Time
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
                <strong className="text-app-tx">Note:</strong> These settings globally control when students can book or cancel trips. The AI Assistant and Student Portals will strictly adhere to these synchronized times.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                type="submit"
                disabled={saving}
                className="bg-app-am text-black font-black uppercase text-[11px] tracking-widest px-8 py-4 rounded-2xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Ic.Save size={16} />
                {saving ? 'Updating...' : 'Update Booking Window'}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Security & Preferences */}
        <div className="space-y-8 h-fit">
          
          <div className="bg-app-card border border-app-bd rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-[1.5rem] bg-app-tx/5 flex items-center justify-center text-app-tx border border-app-tx/10 shadow-inner">
                <Ic.Shield />
              </div>
              <div>
                <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-app-tx">Security</h3>
                <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest mt-0.5">Admin Authentication</p>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-app-mu ml-1">Current Password</label>
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-app-mu ml-1">New Password</label>
                  <input 
                    type="password" 
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-3.5 text-[13px] text-app-tx focus:outline-none focus:border-app-am transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-app-mu ml-1">Confirm New Password</label>
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
                  Change Password
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
                <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-app-tx">Preferences</h3>
                <p className="text-[10px] font-bold text-app-mu uppercase tracking-widest mt-0.5">Interface Appearance</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-app-card2 border border-app-bd/50">
              <div>
                <p className="text-[12px] font-black uppercase tracking-wider text-app-tx">Theme Mode</p>
                <p className="text-[10px] font-bold text-app-mu mt-0.5">Toggle between Light and Dark interface.</p>
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
