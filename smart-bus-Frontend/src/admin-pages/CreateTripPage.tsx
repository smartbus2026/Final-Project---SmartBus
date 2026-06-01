import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ic } from '../icons';
import Api from '../services/Api'; 


interface BookingSettings {
  booking_open_hour: number;
  booking_open_minute: number;
  booking_close_hour: number;
  booking_close_minute: number;
}

const CreateBusPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [formData, setFormData] = useState({
    busCode: '',
    driver: '',
    capacity: 45
  });

  const [drivers, setDrivers] = useState<Array<{_id: string; name: string}>>([]);

  const [settings, setSettings] = useState<BookingSettings>({
    booking_open_hour: 20,
    booking_open_minute: 0,
    booking_close_hour: 23,
    booking_close_minute: 0,
  });

  // Monthly Quota State
  const [quota, setQuota] = useState({ used: 0, total: 308 });

  const [modal, setModal] = useState({ 
    isOpen: false, 
    type: "success",
    message: "" 
  });

  useEffect(() => {
    const fetchAllData = async () => {
      // 1. Fetch Critical Data (Drivers and Settings)
      try {
        const [settingsRes, usersRes] = await Promise.all([
          Api.get('/settings'),
          Api.get('/users')
        ]);
        setSettings(settingsRes.data.data.settings);
        const allUsers = usersRes.data || [];
        setDrivers(allUsers.filter((u: { role: string }) => u.role === 'driver'));
      } catch (err) {
        console.error("Failed to fetch critical settings and drivers", err);
      }

      // 2. Fetch Non-Critical Data (Fleet Quota — count of Bus documents)
      try {
        const quotaRes = await Api.get('/buses/quota');
        if (quotaRes.data) {
          setQuota({ used: quotaRes.data.usedCapacity || 0, total: quotaRes.data.totalCapacity || 308 });
        }
      } catch (err) {
        console.error("Failed to fetch fleet quota", err);
      }
    };

    fetchAllData();
  }, []);

  const quotaPercentage = Math.min((quota.used / quota.total) * 100, 100);
  const quotaColor = quotaPercentage < 70 ? 'bg-emerald-500' : quotaPercentage < 85 ? 'bg-amber-500' : 'bg-red-500';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("Submitting Trip Payload with Driver ID:", formData.driver);
    try {
      await Api.post('/buses', formData);
      setModal({ isOpen: true, type: "success", message: "Bus created successfully!" });
      setFormData({ busCode: '', driver: '', capacity: 45 });
      // If we are sharing state, it's generally best to refetch.
      // But we handled this in ADashboard with setInterval(fetchBuses, 5000), so it will auto-update!
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setModal({ isOpen: true, type: "error", message: error.response?.data?.message || "Failed to create bus" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await Api.put('/settings', settings);
      setModal({ isOpen: true, type: "success", message: "Booking window updated successfully!" });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setModal({ isOpen: true, type: "error", message: error.response?.data?.message || "Failed to save settings" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="flex-1 bg-app-bg text-app-tx p-8 overflow-y-auto custom-scrollbar min-h-screen space-y-8">
      
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <div className="bg-app-am/10 p-3 rounded-2xl text-app-am">
          <Ic.Plus size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-app-tx">Create Bus</h1>
          <p className="text-[10px] font-black text-app-mu uppercase tracking-[0.2em] mt-1">Add new vehicles to your fleet</p>
        </div>
      </div>

      {/* ── Monthly Quota Progress Bar ── */}
      <div className="bg-app-card border border-app-bd rounded-[2.5rem] p-8 shadow-xl">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-black uppercase tracking-widest text-app-tx">Monthly Fleet Quota</h2>
          <span className="text-[12px] font-bold text-app-mu uppercase tracking-widest">
            {quota.used} / {quota.total} Buses Used
          </span>
        </div>
        <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-app-bd">
          <div 
            className={`h-full ${quotaColor} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${quotaPercentage}%` }}
          />
        </div>
      </div>

      {/* ── Create Bus Form ── */}
      <div className="bg-app-card border border-app-bd rounded-[2.5rem] p-10 max-w-3xl shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu flex items-center gap-2">
                <Ic.Bus size={14} /> Bus Number / Plate
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Bus 101 or 123-ABC"
                value={formData.busCode}
                onChange={e => setFormData({ ...formData, busCode: e.target.value })}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-4 text-[13px] text-app-tx font-bold outline-none focus:border-app-am transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu flex items-center gap-2">
                <Ic.Users size={14} /> Driver
              </label>
              <select 
                required
                name="driver"
                value={formData.driver}
                onChange={e => setFormData({ ...formData, driver: e.target.value })}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-4 text-[13px] text-app-tx font-bold outline-none focus:border-app-am transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled>-- Select Driver --</option>
                {drivers.map(driver => (
                  <option key={driver._id} value={driver._id}>{driver.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu flex items-center gap-2">
                <Ic.Users size={14} /> Total Seats Capacity
              </label>
              <input 
                type="number" 
                required
                min="1"
                value={formData.capacity}
                onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-4 text-[13px] text-app-tx font-bold outline-none focus:border-app-am transition-colors"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-app-bd flex justify-end gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-app-am text-black px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-3
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {isSubmitting ? "Creating..." : <><Ic.Plus size={16} /> Create Bus</>}
            </button>
          </div>
        </form>
      </div>

      {/* ── Booking Window Settings ── */}
      {/* ── Booking Window Settings ── */}
<div className="bg-app-card border border-app-bd rounded-[2.5rem] p-10 max-w-3xl shadow-xl">
  <div className="flex items-center gap-3 mb-8">
    <div className="bg-app-am/10 p-2.5 rounded-xl text-app-am">
      <Ic.Time size={18} />
    </div>
    <div>
      <h2 className="font-syne text-[15px] font-black uppercase tracking-wider text-app-tx">Booking Window</h2>
      <p className="text-[10px] font-bold text-app-mu mt-0.5">Control when students can register for trips</p>
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    
    {/* Open Time */}
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">Booking Opens At</label>
      <div className="flex gap-2">
        <select
          value={settings.booking_open_hour > 12 ? settings.booking_open_hour - 12 : settings.booking_open_hour === 0 ? 12 : settings.booking_open_hour}
          onChange={e => {
            const h = parseInt(e.target.value);
            const isAm = settings.booking_open_hour < 12;
            setSettings({ ...settings, booking_open_hour: isAm ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12) });
          }}
          className="flex-1 bg-app-card2 border border-app-bd rounded-xl px-3 py-3 text-[13px] text-app-tx font-bold outline-none focus:border-app-am transition-colors text-center appearance-none cursor-pointer"
        >
          {[12,1,2,3,4,5,6,7,8,9,10,11].map(h => (
            <option key={h} value={h}>{String(h).padStart(2,"0")}</option>
          ))}
        </select>

        <select
          value={settings.booking_open_minute}
          onChange={e => setSettings({ ...settings, booking_open_minute: parseInt(e.target.value) })}
          className="flex-1 bg-app-card2 border border-app-bd rounded-xl px-3 py-3 text-[13px] text-app-tx font-bold outline-none focus:border-app-am transition-colors text-center appearance-none cursor-pointer"
        >
          {[0,15,30,45].map(m => (
            <option key={m} value={m}>{String(m).padStart(2,"0")}</option>
          ))}
        </select>

        <select
          value={settings.booking_open_hour >= 12 ? "PM" : "AM"}
          onChange={e => {
            const isPM = e.target.value === "PM";
            const h = settings.booking_open_hour % 12;
            setSettings({ ...settings, booking_open_hour: isPM ? (h === 0 ? 12 : h + 12) : (h === 0 ? 0 : h) });
          }}
          className="bg-app-card2 border border-app-bd rounded-xl px-3 py-3 text-[13px] text-app-am font-black outline-none focus:border-app-am transition-colors appearance-none cursor-pointer"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      <div className="text-[10px] text-app-ok font-bold">
        Opens: {settings.booking_open_hour === 0 ? "12" : settings.booking_open_hour > 12 ? settings.booking_open_hour - 12 : settings.booking_open_hour}:{String(settings.booking_open_minute).padStart(2,"0")} {settings.booking_open_hour >= 12 ? "PM" : "AM"}
      </div>
    </div>

    {/* Close Time */}
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase tracking-widest text-app-mu">Booking Closes At</label>
      <div className="flex gap-2">
        <select
          value={settings.booking_close_hour > 12 ? settings.booking_close_hour - 12 : settings.booking_close_hour === 0 ? 12 : settings.booking_close_hour}
          onChange={e => {
            const h = parseInt(e.target.value);
            const isAm = settings.booking_close_hour < 12;
            setSettings({ ...settings, booking_close_hour: isAm ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12) });
          }}
          className="flex-1 bg-app-card2 border border-app-bd rounded-xl px-3 py-3 text-[13px] text-app-tx font-bold outline-none focus:border-app-am transition-colors text-center appearance-none cursor-pointer"
        >
          {[12,1,2,3,4,5,6,7,8,9,10,11].map(h => (
            <option key={h} value={h}>{String(h).padStart(2,"0")}</option>
          ))}
        </select>

        <select
          value={settings.booking_close_minute}
          onChange={e => setSettings({ ...settings, booking_close_minute: parseInt(e.target.value) })}
          className="flex-1 bg-app-card2 border border-app-bd rounded-xl px-3 py-3 text-[13px] text-app-tx font-bold outline-none focus:border-app-am transition-colors text-center appearance-none cursor-pointer"
        >
          {[0,15,30,45].map(m => (
            <option key={m} value={m}>{String(m).padStart(2,"0")}</option>
          ))}
        </select>

        <select
          value={settings.booking_close_hour >= 12 ? "PM" : "AM"}
          onChange={e => {
            const isPM = e.target.value === "PM";
            const h = settings.booking_close_hour % 12;
            setSettings({ ...settings, booking_close_hour: isPM ? (h === 0 ? 12 : h + 12) : (h === 0 ? 0 : h) });
          }}
          className="bg-app-card2 border border-app-bd rounded-xl px-3 py-3 text-[13px] text-app-am font-black outline-none focus:border-app-am transition-colors appearance-none cursor-pointer"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      <div className="text-[10px] text-app-err font-bold">
        Closes: {settings.booking_close_hour === 0 ? "12" : settings.booking_close_hour > 12 ? settings.booking_close_hour - 12 : settings.booking_close_hour}:{String(settings.booking_close_minute).padStart(2,"0")} {settings.booking_close_hour >= 12 ? "PM" : "AM"}
      </div>
    </div>
  </div>

  <div className="pt-6 border-t border-app-bd mt-6 flex justify-end">
    <button
      onClick={handleSaveSettings}
      disabled={isSavingSettings}
      className={`bg-app-am text-black px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center gap-3
        ${isSavingSettings ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
    >
      {isSavingSettings ? "Saving..." : <><Ic.Check size={16} /> Save Settings</>}
    </button>
  </div>
</div>
      {/* ── Modal ── */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-app-card border border-app-bd rounded-[24px] p-8 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`flex h-20 w-20 items-center justify-center rounded-full border-4 ${
                modal.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-app-ok' : 'bg-red-500/10 border-red-500/20 text-app-err'
              }`}>
                {modal.type === 'success' ? <Ic.Check /> : <span className="font-bold text-3xl">!</span>}
              </div>
              <h3 className="font-syne text-xl font-black text-app-tx uppercase tracking-wider mt-2">
                {modal.type === 'success' ? 'Success!' : 'Action Failed'}
              </h3>
              <p className="text-sm text-app-mu font-medium px-2">{modal.message}</p>
              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => setModal({ ...modal, isOpen: false })}
                  className="flex-1 py-4 rounded-xl font-syne font-black text-[13px] uppercase tracking-widest bg-app-card2 border border-app-bd text-app-tx hover:text-app-mu transition-all"
                >
                  Close
                </button>
                {modal.type === 'success' && (
                  <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex-1 py-4 rounded-xl font-syne font-black text-[13px] uppercase tracking-widest bg-app-am text-black hover:brightness-110 transition-all"
                  >
                    Go to Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateBusPage;