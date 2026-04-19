import React from 'react';

const AdminSettings: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h3 className="font-bold text-app-tx uppercase tracking-widest text-xs mb-1">System Settings</h3>
        <p className="text-[11px] text-app-mu font-medium">Configure global parameters and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Registration Window */}
        <div className="bg-app-card border border-app-bd rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-app-am">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
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

        {/* Global Alerts */}
        <div className="bg-app-card border border-app-bd rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-app-am">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
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

      <div className="flex justify-end pt-4">
        <button className="bg-app-am text-black px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;