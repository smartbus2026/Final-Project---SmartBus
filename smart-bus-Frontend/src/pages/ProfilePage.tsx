import { useState, useEffect } from "react";
import { Ic } from "../icons";
import Api from "../services/Api";

interface Form {
  name: string; email: string; phone: string;
  curPass: string; newPass: string; confPass: string;
}

export default function ProfilePage() {
  const [userId, setUserId] = useState<string>("");
  const [initials, setInitials] = useState("?");
  const [form, setForm] = useState<Form>({
    name: "", email: "", phone: "",
    curPass: "", newPass: "", confPass: "",
  });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await Api.get("/users/profile");
        const u = res.data;
        setUserId(u._id || u.id || "");
        setInitials((u.name || "?").charAt(0).toUpperCase());
        setForm(f => ({
          ...f,
          name: u.name || "",
          email: u.email || "",
          phone: u.phone_number || "",
        }));
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const s = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaveError(null);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        phone_number: form.phone,
      };
      if (form.newPass) {
        if (form.newPass !== form.confPass) {
          setSaveError("New passwords do not match.");
          return;
        }
        payload.password = form.newPass;
      }
      await Api.put(`/users/${userId}`, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setSaveError(err.response?.data?.message || "Failed to save profile.");
    }
  };

  // Reusable Field Component
  const Field = ({ label,  children }: { label: string; icon?: any; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="ml-1 block text-[10px] font-bold uppercase tracking-widest text-app-mu2">
        {label}
      </label>
      {children}
    </div>
  );

  const inputClass = "w-full rounded-xl border border-app-bd bg-app-card2 px-4 py-2.5 text-[13px] text-app-tx outline-none transition-all placeholder:text-app-mu2 focus:border-app-am focus:ring-1 focus:ring-app-am/20";

  return (
    <div className="mx-auto max-w-3xl p-6 pb-20">
      
      {/* ── Avatar Header Card ── */}
      <div className="mb-4 flex items-center gap-6 rounded-2xl border border-app-bd bg-app-card p-6 shadow-sm">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-app-card bg-app-am-d font-syne text-3xl font-black text-app-am shadow-lg">
          {initials}
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-syne text-2xl font-extrabold text-app-tx tracking-tight">{isLoading ? "Loading..." : form.name}</h2>
          <p className="mb-3 text-[11px] font-medium text-app-mu">{form.email}</p>
          <div className="inline-flex items-center gap-2 rounded-lg bg-green-500/10 px-2.5 py-1 text-[10px] font-bold text-app-ok border border-green-500/20 uppercase tracking-wider">
             <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-app-ok" />
             Active Account
          </div>
        </div>
      </div>

      {/* ── Main Settings Form ── */}
      <div className="rounded-3xl border border-app-bd bg-app-card p-6 shadow-md md:p-8">
        
        {/* Section 1: Personal Info */}
        <section className="mb-10">
          <div className="mb-6 flex items-center gap-2 font-syne text-[14px] font-bold uppercase tracking-wider text-app-tx">
            <Ic.User className="text-app-am" size={18} /> Personal Information
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <Field label="Full Name">
              <input className={inputClass} value={form.name} onChange={s("name")} placeholder="Full Name" />
            </Field>
            <Field label="Email Address">
              <input className={inputClass} type="email" value={form.email} onChange={s("email")} placeholder="Email" />
            </Field>
            <Field label="Phone Number">
              <div className="flex">
                <span className="flex items-center rounded-l-xl border border-r-0 border-app-bd bg-app-card2 px-3 text-[12px] font-bold text-app-mu">
                  +20
                </span>
                <input className={`${inputClass} rounded-l-none`} value={form.phone} onChange={s("phone")} placeholder="01xxxxxxxxx" />
              </div>
            </Field>
          </div>
        </section>

        {/* Section 2: Route Preferences — Informational only, routes are set per booking */}
        <section className="mb-10 border-t border-app-bd pt-10">
          <div className="mb-6 flex items-center gap-2 font-syne text-[14px] font-bold uppercase tracking-wider text-app-tx">
            <Ic.Map className="text-app-am" size={18} /> Route Preferences
          </div>
          <p className="text-[12px] text-app-mu font-medium">
            Route and pickup point are selected per booking. Visit <span className="text-app-am font-bold">Book Trip</span> to register for tomorrow's trip.
          </p>
        </section>

        {/* Section 3: Security */}
        <section className="mb-10 border-t border-app-bd pt-10">
          <div className="mb-6 flex items-center gap-2 font-syne text-[14px] font-bold uppercase tracking-wider text-app-tx">
            <Ic.Shield className="text-app-am" size={18} /> Security & Password
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <div className="md:col-span-2 md:max-w-xs">
              <Field label="Current Password">
                <input className={inputClass} type="password" placeholder="••••••••" value={form.curPass} onChange={s("curPass")} />
              </Field>
            </div>
            <Field label="New Password">
              <input className={inputClass} type="password" placeholder="Leave blank to keep" value={form.newPass} onChange={s("newPass")} />
            </Field>
            <Field label="Confirm New Password">
              <input className={inputClass} type="password" placeholder="Confirm your new password" value={form.confPass} onChange={s("confPass")} />
            </Field>
          </div>
        </section>

        {/* Action Buttons */}
        {saveError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium">
            {saveError}
          </div>
        )}
        <div className="flex items-center justify-end gap-4 border-t border-app-bd pt-8">
          <button
            className="cursor-pointer text-[13px] font-bold text-app-mu transition-colors hover:text-app-tx"
            onClick={() => { setSaveError(null); setForm(f => ({ ...f, curPass: "", newPass: "", confPass: "" })); }}
          >
            Discard Changes
          </button>
          <button 
            className={`flex min-w-[140px] cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-bold transition-all
              ${saved ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-app-am text-white shadow-lg shadow-app-am/20 hover:scale-[1.02] active:scale-95"}
            `}
            onClick={save}
          >
            {saved ? (
              <><Ic.Check  /> Saved!</>
            ) : (
              <><Ic.Save  /> Save Profile</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}