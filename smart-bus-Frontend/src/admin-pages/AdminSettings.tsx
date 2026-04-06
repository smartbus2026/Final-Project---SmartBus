import React from 'react';
import { Ic } from '../icons';

const AdminSettings: React.FC = () => {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h3 className="font-bold text-app-tx uppercase tracking-widest text-xs mb-1">System Settings</h3>
        <p className="text-[11px] text-app-mu font-medium">Configure global parameters and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Registration Window Control */}
        <div className="bg-app-card border border-app-bd rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 text-app-am">
            <Ic.Calendar />
            <h4 className="text-sm font-black text-app-tx uppercase tracking-tight">Registration Window</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-app-mu mb-2">Daily Closing Time</label>
              <input type="time" defaultValue="14:00" className="w-full bg-app-card2 border border-app-bd rounded-xl px-4 py-3 text-sm text-app-tx outline-none focus:border-app-am/50" />
            </div>
            <div className="flex items-center justify-between p-4 bg-app-card2 rounded-xl border border-app-bd">
              <span className="text-xs font-bold text-app-tx">Allow Weekend Booking</span>
              <div className="w-10 h-5 bg-app-am rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Notifications */}
        <div className="bg-app-card border border-app-bd rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3 text-app-am">
            <Ic.Bell />
            <h4 className="text-sm font-black text-app-tx uppercase tracking-tight">Global Alerts</h4>
          </div>
          <div className="space-y-3">
            {["Push Notifications", "Email Receipts", "SMS Alerts"].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 hover:bg-app-card2 rounded-xl transition-colors">
                <span className="text-xs text-app-mu font-medium">{item}</span>
                <input type="checkbox" defaultChecked className="accent-app-am" />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button className="bg-app-am text-black px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-app-am/20">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;