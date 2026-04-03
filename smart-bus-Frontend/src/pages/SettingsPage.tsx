import { useState } from "react";

// ── Types (لو مش عاملة لها ملف منفصل) ──
interface PasswordForm {
  current: string;
  newPass: string;
  confirm: string;
}

interface NotificationPrefs {
  bookingAlerts: boolean;
  busArrival: boolean;
}

// ── Shared Tailwind Classes ──
const inputClass = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] outline-none transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 dark:border-white/10 dark:bg-zinc-900 dark:text-white";
const labelClass = "mb-2 ml-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400";

export default function SettingsPage() {
  // 1. States
  const [passForm, setPassForm] = useState<PasswordForm>({ current: "", newPass: "", confirm: "" });
  const [phone, setPhone] = useState("+962 79 123 4567");
  const [prefs, setPrefs] = useState<NotificationPrefs>({ bookingAlerts: true, busArrival: true });

  const handleSave = () => {
    if (passForm.newPass !== passForm.confirm) {
      alert("Passwords do not match!");
      return;
    }
    alert("Settings saved successfully! ✅");
  };

  return (
    <div className="mx-auto max-w-2xl p-6 pb-20 font-sans">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Settings</h1>
        <p className="text-xs text-gray-500">Manage your profile and app preferences</p>
      </header>

      <div className="space-y-6">
        
        {/* --- Password Section --- */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-zinc-900/50">
          <h4 className="mb-6 text-[13px] font-bold uppercase tracking-wider text-gray-800 dark:text-zinc-200">
            <span className="mr-2 text-amber-500">🔒</span> Change Password
          </h4>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Current Password</label>
              <input 
                type="password" 
                className={inputClass} 
                value={passForm.current}
                onChange={e => setPassForm({...passForm, current: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>New Password</label>
                <input 
                  type="password" 
                  className={inputClass} 
                  value={passForm.newPass}
                  onChange={e => setPassForm({...passForm, newPass: e.target.value})}
                />
              </div>
              <div>
                <label className={labelClass}>Confirm New</label>
                <input 
                  type="password" 
                  className={inputClass} 
                  value={passForm.confirm}
                  onChange={e => setPassForm({...passForm, confirm: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* --- Phone Section --- */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-zinc-900/50">
          <h4 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-green-600">
            <span className="mr-2">📞</span> Phone Number
          </h4>
          <input 
            type="text" 
            className={inputClass} 
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        {/* --- Notifications Section (Standard Toggle) --- */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-zinc-900/50">
          <h4 className="mb-6 text-[13px] font-bold uppercase tracking-wider text-red-400">
            <span className="mr-2">🔔</span> Notifications
          </h4>
          <div className="space-y-4">
            {[
              { id: 'bookingAlerts', title: 'Booking Alerts', desc: 'Window open/close reminders' },
              { id: 'busArrival', title: 'Bus Arrival', desc: 'Real-time bus proximity alerts' }
            ].map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</p>
                  <p className="text-[10px] text-gray-500">{item.desc}</p>
                </div>
                {/* Basic Checkbox as a Toggle Placeholder */}
                <input 
                  type="checkbox" 
                  className="h-5 w-5 accent-amber-500"
                  checked={prefs[item.id as keyof NotificationPrefs]}
                  onChange={() => setPrefs({...prefs, [item.id]: !prefs[item.id as keyof NotificationPrefs]})}
                />
              </div>
            ))}
          </div>
        </div>

        {/* --- Save Button --- */}
        <button
          onClick={handleSave}
          className="w-full rounded-2xl bg-amber-500 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
        >
          Save All Changes
        </button>
      </div>
    </div>
  );
}