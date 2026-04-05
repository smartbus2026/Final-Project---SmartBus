import { useState } from "react";
import { Ic } from "../icons";

interface PasswordForm {
  current: string;
  newPass: string;
  confirm: string;
}

interface NotificationPrefs {
  bookingAlerts: boolean;
  busArrival: boolean;
}

const inputClass = "w-full rounded-xl border border-app-bd bg-app-card2 px-4 py-3 text-[13px] text-app-tx outline-none transition-all focus:border-app-am focus:ring-1 focus:ring-app-am/20 placeholder:text-app-mu";
const labelClass = "mb-2 ml-1 block text-[10px] font-bold uppercase tracking-widest text-app-mu";

export default function SettingsPage() {
  const [passForm, setPassForm] = useState<PasswordForm>({ current: "", newPass: "", confirm: "" });
  const [phone, setPhone] = useState("+962 79 123 4567");
  const [prefs, setPrefs] = useState<NotificationPrefs>({ bookingAlerts: true, busArrival: true });

  const handleSave = () => {
    if (passForm.newPass !== passForm.confirm) {
      alert("Passwords do not match!");
      return;
    }
    alert("Settings saved successfully!");
  };

  return (
    <div className="mx-auto max-w-2xl p-6 pb-20 font-sans">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-app-tx">Settings</h1>
        <p className="text-xs text-app-mu">Manage your profile and app preferences</p>
      </header>

      <div className="space-y-6">

        {/* --- Password Section --- */}
        <div className="rounded-2xl border border-app-bd bg-app-card p-6 shadow-sm">
          <h4 className="mb-6 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-app-tx">
            <Ic.Shield className="text-app-am" size={16} /> Change Password
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
        <div className="rounded-2xl border border-app-bd bg-app-card p-6 shadow-sm">
          <h4 className="mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-app-tx">
            <Ic.User className="text-app-am" size={16} /> Phone Number
          </h4>
          <input
            type="text"
            className={inputClass}
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        {/* --- Notifications Section --- */}
        <div className="rounded-2xl border border-app-bd bg-app-card p-6 shadow-sm">
          <h4 className="mb-6 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-app-tx">
            <Ic.Bell className="text-app-am" size={16} /> Notifications
          </h4>
          <div className="space-y-4">
            {[
              { id: 'bookingAlerts', title: 'Booking Alerts', desc: 'Window open/close reminders' },
              { id: 'busArrival',    title: 'Bus Arrival',    desc: 'Real-time bus proximity alerts' }
            ].map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-app-tx">{item.title}</p>
                  <p className="text-[10px] text-app-mu">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-app-am cursor-pointer"
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
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-app-am py-4 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-app-am/20 transition-all hover:brightness-110 active:scale-95 cursor-pointer"
        >
          <Ic.Save size={15} /> Save All Changes
        </button>

      </div>
    </div>
  );
}