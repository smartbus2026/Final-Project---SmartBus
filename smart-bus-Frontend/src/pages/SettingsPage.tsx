import { useState } from "react";
import SettingCard from "../components/Topbar";
import Toggle from "../components/Toggle";
import type { PasswordForm, NotificationPrefs } from "../types";

const inputClass =
  "w-full bg-gray-50 dark:bg-darkBg border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all dark:text-white";

const labelClass =
  "text-[10px] text-textGray uppercase font-bold tracking-wider mb-2 block ml-1";

function ChangePasswordCard() {
  const [form, setForm] = useState<PasswordForm>({ current: "", newPass: "", confirm: "" });

  return (
    <SettingCard>
      <h4 className="font-bold text-sm mb-5 flex items-center gap-3 dark:text-white">
        <i className="fa-solid fa-lock text-accent" /> Change Password
      </h4>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Current Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={form.current}
            onChange={(e) => setForm({ ...form, current: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.newPass}
              onChange={(e) => setForm({ ...form, newPass: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </SettingCard>
  );
}

function PhoneCard() {
  const [phone, setPhone] = useState<string>("+962 79 123 4567");

  return (
    <SettingCard>
      <h4 className="font-bold text-sm mb-4 flex items-center gap-3 text-success">
        <i className="fa-solid fa-phone" /> Phone Number
      </h4>
      <input
        type="text"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className={inputClass}
      />
    </SettingCard>
  );
}

interface NotifItem {
  key: keyof NotificationPrefs;
  title: string;
  desc: string;
}

const notifItems: NotifItem[] = [
  { key: "bookingAlerts", title: "Booking window alerts", desc: "Get notified when registration opens/closes" },
  { key: "busArrival", title: "Bus arrival updates", desc: "Know when your bus is approaching" },
];

function NotificationsCard() {
  const [prefs, setPrefs] = useState<NotificationPrefs>({ bookingAlerts: true, busArrival: true });

  const toggle = (key: keyof NotificationPrefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <SettingCard>
      <h4 className="font-bold text-sm mb-6 flex items-center gap-3 text-red-400">
        <i className="fa-solid fa-bell" /> Notification Preferences
      </h4>
      <div className="space-y-6">
        {notifItems.map(({ key, title, desc }) => (
          <div key={key} className="flex justify-between items-center gap-4">
            <div>
              <p className="text-sm font-bold dark:text-white text-gray-900">{title}</p>
              <p className="text-[10px] text-textGray mt-0.5 leading-relaxed">{desc}</p>
            </div>
            <Toggle checked={prefs[key]} onChange={() => toggle(key)} />
          </div>
        ))}
      </div>
    </SettingCard>
  );
}

function RouteChangeCard() {
  return (
    <SettingCard>
      <h4 className="font-bold text-sm mb-2 flex items-center gap-3 dark:text-white">
        <i className="fa-solid fa-location-dot text-accent" /> Route Change Request
      </h4>
      <p className="text-[10px] text-textGray mb-5">
        Request to change your assigned route. Review required by admin.
      </p>
      <button className="w-full bg-gray-50 dark:bg-darkBg border border-gray-200 dark:border-white/10 rounded-xl py-3 text-[11px] font-bold transition-all flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-white/5 dark:text-white">
        <i className="fa-solid fa-route text-accent" /> Request Route Change
      </button>
    </SettingCard>
  );
}

export default function SettingsPage() {
  const handleSave = (): void => {
    alert("Changes saved!");
  };

  return (
    <div className="p-4 lg:p-8 pb-12 transition-all duration-300">
      <div className="w-full max-w-2xl mx-auto lg:mx-0 space-y-4 lg:space-y-5">
        <ChangePasswordCard />
        <PhoneCard />
        <NotificationsCard />
        <RouteChangeCard />
        <button
          onClick={handleSave}
          className="w-full bg-accent text-black py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-[0_8px_20px_rgba(249,178,51,0.2)] hover:scale-[1.01] active:scale-95 transition-all"
        >
          <i className="fa-solid fa-floppy-disk mr-2" /> Save Changes
        </button>
      </div>
    </div>
  );
}
