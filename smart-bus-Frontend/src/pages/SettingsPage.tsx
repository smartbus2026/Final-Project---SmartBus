import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Ic } from "../icons";
import Api from "../services/Api";

interface PasswordForm {
  current: string;
  newPass: string;
  confirm: string;
}

interface NotificationPrefs {
  bookingAlerts: boolean;
  busArrival: boolean;
}

const inputClass = "w-full rounded-xl border border-app-bd bg-app-card2 px-4 py-3 text-[13px] text-app-tx outline-none transition-all focus:border-app-am focus:ring-1 focus:ring-app-am/20 placeholder:text-app-mu disabled:opacity-50 disabled:cursor-not-allowed";
const labelClass = "mb-2 ml-1 block text-[10px] font-bold uppercase tracking-widest text-app-mu";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { id } = useParams(); // If present, Admin is editing a user
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState<any>({
    name: "",
    email: "",
    phone: "",
    student_id: ""
  });

  const [passForm, setPassForm] = useState<PasswordForm>({ current: "", newPass: "", confirm: "" });
  const [prefs, setPrefs] = useState<NotificationPrefs>({ bookingAlerts: true, busArrival: true });

  useEffect(() => {
    const currentRole = localStorage.getItem("role");
    setRole(currentRole);

    const fetchData = async () => {
      try {
        let dataToSet;
        if (id && currentRole === "admin") {
          // Admin editing someone else
          const res = await Api.get('/users');
          const users = res.data || [];
          dataToSet = users.find((u: any) => u._id === id);
        } else {
          // Logged in user editing their own settings
          const res = await Api.get('/users/profile');
          dataToSet = res.data;
        }

        if (dataToSet) {
          setTargetUserId(dataToSet._id);
          setProfileData({
            name: dataToSet.name || "",
            email: dataToSet.email || "",
            phone: dataToSet.phone || "",
            student_id: dataToSet.student_id || ""
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSave = async () => {
    if (passForm.newPass && passForm.newPass !== passForm.confirm) {
      alert(t("passwords_mismatch"));
      return;
    }

    try {
      const updatePayload: any = {
        name: profileData.name,
        phone: profileData.phone,
      };

      if (role === "admin") {
        updatePayload.email = profileData.email;
        updatePayload.student_id = profileData.student_id;
      }

      if (passForm.newPass) {
        updatePayload.password = passForm.newPass;
      }

      await Api.put(`/users/${targetUserId}`, updatePayload);
      alert(t("settings_saved"));
      setPassForm({ current: "", newPass: "", confirm: "" });
    } catch (e) {
      console.error(e);
      alert(t("settings_save_failed"));
    }
  };

  if (loading) return <div className="p-8 text-center text-app-mu">{t("loading_settings_full")}</div>;

  const isAdminEdit = id && role === "admin";

  return (
    <div className="mx-auto max-w-2xl p-6 pb-20 font-sans animate-in fade-in zoom-in-95 duration-300">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-app-tx">{isAdminEdit ? t("edit_user") : t("settings")}</h1>
        <p className="text-xs text-app-mu">{isAdminEdit ? t("settings_manage_student") : t("settings_manage_own")}</p>
      </header>

      <div className="space-y-6">

        {/* --- Profile Information --- */}
        <div className="rounded-2xl border border-app-bd bg-app-card p-6 shadow-sm">
          <h4 className="mb-6 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-app-tx">
            <Ic.User className="text-app-am" size={16} /> {t("account_information")}
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t("full_name")}</label>
              <input
                type="text"
                className={inputClass}
                value={profileData.name}
                onChange={e => setProfileData({...profileData, name: e.target.value})}
              />
            </div>
            <div>
              <label className={labelClass}>{t("student_id")}</label>
              <input
                type="text"
                className={inputClass}
                value={profileData.student_id}
                disabled={role !== "admin"}
                onChange={e => setProfileData({...profileData, student_id: e.target.value})}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{t("email_address")} {role === "student" && <span className="text-app-err ml-1">{t("email_readonly_suffix")}</span>}</label>
              <input
                type="email"
                className={inputClass}
                value={profileData.email}
                disabled={role !== "admin"}
                onChange={e => setProfileData({...profileData, email: e.target.value})}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>{t("phone_number")}</label>
              <input
                type="text"
                className={inputClass}
                value={profileData.phone}
                onChange={e => setProfileData({...profileData, phone: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* --- Password Section --- */}
        <div className="rounded-2xl border border-app-bd bg-app-card p-6 shadow-sm">
          <h4 className="mb-6 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-app-tx">
            <Ic.Shield className="text-app-am" size={16} /> {isAdminEdit ? t("reset_password") : t("change_password")}
          </h4>
          <div className="space-y-4">
            {!isAdminEdit && (
              <div>
                <label className={labelClass}>{t("current_password")}</label>
                <input
                  type="password"
                  className={inputClass}
                  value={passForm.current}
                  onChange={e => setPassForm({...passForm, current: e.target.value})}
                />
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t("new_password")}</label>
                <input
                  type="password"
                  className={inputClass}
                  value={passForm.newPass}
                  onChange={e => setPassForm({...passForm, newPass: e.target.value})}
                />
              </div>
              <div>
                <label className={labelClass}>{t("confirm_password")}</label>
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

        {/* --- Notifications Section --- */}
        <div className="rounded-2xl border border-app-bd bg-app-card p-6 shadow-sm">
          <h4 className="mb-6 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-app-tx">
            <Ic.Bell className="text-app-am" size={16} /> {t("notifications_section")}
          </h4>
          <div className="space-y-4">
            {[
              { id: "bookingAlerts", title: t("booking_alerts"), desc: t("booking_alerts_desc_window") },
              { id: "busArrival", title: t("bus_arrival"), desc: t("bus_arrival_desc") },
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
          <Ic.Save size={15} /> {t("save_all_changes")}
        </button>

      </div>
    </div>
  );
}