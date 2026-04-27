import React, { useState } from 'react';
import { Ic } from '../icons';

const SettingsPage: React.FC = () => {
  const [profile, setProfile] = useState({
    name: 'Admin User',
    email: 'admin@smartbus.edu',
    password: ''
  });

  const [preferences, setPreferences] = useState({
    autoCancel: true,
    emailAlerts: true,
    smsAlerts: false,
    maintenanceMode: false
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Mocked update functionality
    console.log('Profile updated:', profile);
    alert('Profile successfully updated!');
  };

  const handleClearBookings = () => {
    if (window.confirm("Are you sure you want to clear all expired bookings? This action cannot be undone.")) {
      console.log('Expired bookings cleared');
      alert('Expired bookings cleared successfully.');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-app-bg text-app-tx min-h-screen transition-colors duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-app-tx">System Settings</h2>
          <p className="text-[10px] font-black text-app-mu uppercase tracking-[0.2em] mt-1">Configure Administrative Parameters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile & Danger Zone */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Admin Profile Configuration */}
          <div className="bg-app-card border border-app-bd rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-app-am/10 flex items-center justify-center text-app-am">
                <Ic.User />
              </div>
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-app-tx">Admin Profile Configuration</h3>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">Full Name</label>
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-app-card2 border border-app-bd rounded-2xl px-4 py-3 text-[13px] text-app-tx focus:outline-none focus:border-app-am transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">Email Address</label>
                  <input 
                    type="email" 
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="w-full bg-app-card2 border border-app-bd rounded-2xl px-4 py-3 text-[13px] text-app-tx focus:outline-none focus:border-app-am transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">New Password</label>
                <input 
                  type="password" 
                  placeholder="Leave blank to keep current password"
                  value={profile.password}
                  onChange={(e) => setProfile({...profile, password: e.target.value})}
                  className="w-full bg-app-card2 border border-app-bd rounded-2xl px-4 py-3 text-[13px] text-app-tx focus:outline-none focus:border-app-am transition-colors"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  className="bg-app-am text-black font-black uppercase text-[11px] tracking-widest px-8 py-3 rounded-2xl hover:bg-app-am/90 transition-all flex items-center gap-2"
                >
                  <Ic.Save size={14} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                <Ic.Shield />
              </div>
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-red-500">Danger Zone</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-app-card/50 border border-red-500/10 p-5 rounded-[2rem]">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-app-tx">Clear Expired Bookings</h4>
                  <p className="text-[10px] font-bold text-app-mu mt-1">Permanently remove all past and cancelled trip records.</p>
                </div>
                <button 
                  onClick={handleClearBookings}
                  className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-2xl transition-all"
                >
                  Execute Purge
                </button>
              </div>

              <div className="flex items-center justify-between bg-app-card/50 border border-red-500/10 p-5 rounded-[2rem]">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-app-tx">System Maintenance Mode</h4>
                  <p className="text-[10px] font-bold text-app-mu mt-1">Suspend student access and halt all automated routing.</p>
                </div>
                <button 
                  onClick={() => setPreferences(p => ({ ...p, maintenanceMode: !p.maintenanceMode }))}
                  className={`border font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-2xl transition-all ${
                    preferences.maintenanceMode 
                    ? 'bg-red-500 text-white border-red-500' 
                    : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-red-500/20'
                  }`}
                >
                  {preferences.maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
                </button>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Column: System Preferences */}
        <div className="space-y-8">
          <div className="bg-app-card border border-app-bd rounded-[2.5rem] p-8 shadow-sm h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-app-am/10 flex items-center justify-center text-app-am">
                <Ic.Gear />
              </div>
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-app-tx">System Preferences</h3>
            </div>

            <div className="space-y-6">
              {/* Toggle 1 */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="pr-4">
                  <span className="block text-[11px] font-black uppercase tracking-widest text-app-tx mb-1">Auto-Cancel Empty Routes</span>
                  <span className="block text-[9px] font-bold text-app-mu">Automatically deactivate buses with 0 passengers 30 mins before departure.</span>
                </div>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={preferences.autoCancel}
                    onChange={() => setPreferences(p => ({ ...p, autoCancel: !p.autoCancel }))}
                  />
                  <div className={`block w-12 h-6 rounded-full transition-colors ${preferences.autoCancel ? 'bg-app-am' : 'bg-app-card2 border border-app-bd'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white dark:bg-black w-4 h-4 rounded-full transition-transform ${preferences.autoCancel ? 'translate-x-6' : ''}`}></div>
                </div>
              </label>

              {/* Toggle 2 */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="pr-4">
                  <span className="block text-[11px] font-black uppercase tracking-widest text-app-tx mb-1">Email Notifications</span>
                  <span className="block text-[9px] font-bold text-app-mu">Receive daily operational summaries.</span>
                </div>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={preferences.emailAlerts}
                    onChange={() => setPreferences(p => ({ ...p, emailAlerts: !p.emailAlerts }))}
                  />
                  <div className={`block w-12 h-6 rounded-full transition-colors ${preferences.emailAlerts ? 'bg-app-am' : 'bg-app-card2 border border-app-bd'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white dark:bg-black w-4 h-4 rounded-full transition-transform ${preferences.emailAlerts ? 'translate-x-6' : ''}`}></div>
                </div>
              </label>

              {/* Toggle 3 */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="pr-4">
                  <span className="block text-[11px] font-black uppercase tracking-widest text-app-tx mb-1">SMS Emergency Alerts</span>
                  <span className="block text-[9px] font-bold text-app-mu">Direct SMS for system critical failures.</span>
                </div>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={preferences.smsAlerts}
                    onChange={() => setPreferences(p => ({ ...p, smsAlerts: !p.smsAlerts }))}
                  />
                  <div className={`block w-12 h-6 rounded-full transition-colors ${preferences.smsAlerts ? 'bg-app-am' : 'bg-app-card2 border border-app-bd'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white dark:bg-black w-4 h-4 rounded-full transition-transform ${preferences.smsAlerts ? 'translate-x-6' : ''}`}></div>
                </div>
              </label>
              
              <div className="pt-6 border-t border-app-bd">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">Data Retention Period</label>
                  <select className="w-full bg-app-card2 border border-app-bd rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-app-tx focus:outline-none focus:border-app-am transition-colors appearance-none">
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="365">1 Year</option>
                    <option value="indefinite">Indefinite</option>
                  </select>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
