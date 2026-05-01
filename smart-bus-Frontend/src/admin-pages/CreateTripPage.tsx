import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ic } from '../icons';
import Api from '../services/Api'; 

interface RouteOption {
  _id: string;
  name: string;
}

const CreateTripPage: React.FC = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    route_id: '',
    departure_time: '',
    time_slot: 'morning',
    bus_number: '',
    total_seats: 40
  });

  const [modal, setModal] = useState({ 
    isOpen: false, 
    type: "success",
    message: "" 
  });

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await Api.get('/routes');
        setRoutes(res.data.data || res.data || []);
      } catch (err) {
        console.error("Failed to fetch routes", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await Api.post('/trips', formData);
      setModal({ 
        isOpen: true, 
        type: "success", 
        message: "Trip created successfully!" 
      });
      // Optionally reset form
      setFormData({
        route_id: '',
        departure_time: '',
        time_slot: 'morning',
        bus_number: '',
        total_seats: 40
      });
    } catch (err: any) {
      setModal({ 
        isOpen: true, 
        type: "error", 
        message: err.response?.data?.message || "Failed to create trip" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-app-bg text-app-tx p-8 overflow-y-auto custom-scrollbar min-h-screen">
      
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-app-am/10 p-3 rounded-2xl text-app-am">
          <Ic.Plus size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-app-tx">Create Trip</h1>
          <p className="text-[10px] font-black text-app-mu uppercase tracking-[0.2em] mt-1">Deploy new fleet schedules</p>
        </div>
      </div>

      <div className="bg-app-card border border-app-bd rounded-[2.5rem] p-10 max-w-3xl shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-app-mu flex items-center gap-2">
              <Ic.Route size={14} /> Select Route
            </label>
            <select 
              required
              value={formData.route_id}
              onChange={e => setFormData({ ...formData, route_id: e.target.value })}
              className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-4 text-[13px] text-app-tx font-bold outline-none focus:border-app-am transition-colors appearance-none cursor-pointer"
            >
              <option value="">{isLoading ? "Loading Routes..." : "-- Choose Route --"}</option>
              {routes.map(r => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu flex items-center gap-2">
                <Ic.Calendar size={14} /> Trip Date
              </label>
              <input 
                type="date" 
                required
                value={formData.departure_time}
                onChange={e => setFormData({ ...formData, departure_time: e.target.value })}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-4 text-[13px] text-app-tx font-bold outline-none focus:border-app-am transition-colors cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu flex items-center gap-2">
                <Ic.Time size={14} /> Time Slot
              </label>
              <select 
                value={formData.time_slot}
                onChange={e => setFormData({ ...formData, time_slot: e.target.value })}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-4 text-[13px] text-app-tx font-bold outline-none focus:border-app-am transition-colors appearance-none cursor-pointer"
              >
                <option value="morning">Morning Outbound</option>
                <option value="return_1530">Return (3:30 PM)</option>
                <option value="return_1900">Return (7:00 PM)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu flex items-center gap-2">
                <Ic.Bus size={14} /> Bus Number
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Bus 101 or Plate #123"
                value={formData.bus_number}
                onChange={e => setFormData({ ...formData, bus_number: e.target.value })}
                className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-4 text-[13px] text-app-tx font-bold outline-none focus:border-app-am transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-app-mu flex items-center gap-2">
                <Ic.Users size={14} /> Total Seats Capacity
              </label>
              <input 
                type="number" 
                required
                min="1"
                value={formData.total_seats}
                onChange={e => setFormData({ ...formData, total_seats: parseInt(e.target.value) || 0 })}
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
              {isSubmitting ? "Creating..." : <><Ic.Plus size={16} /> Create Schedule</>}
            </button>
          </div>
        </form>
      </div>

      {/* Modal for Success/Error Notification */}
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
                {modal.type === 'success' ? 'Trip Created!' : 'Action Failed'}
              </h3>
              
              <p className="text-sm text-app-mu font-medium px-2">
                {modal.message}
              </p>
              
              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => setModal({ ...modal, isOpen: false })}
                  className="flex-1 py-4 rounded-xl font-syne font-black text-[13px] uppercase tracking-widest bg-app-card2 border border-app-bd text-app-tx hover:text-app-mu transition-all"
                >
                  Close
                </button>
                {modal.type === 'success' && (
                  <button
                    onClick={() => navigate('/admin/trips')}
                    className="flex-1 py-4 rounded-xl font-syne font-black text-[13px] uppercase tracking-widest bg-app-am text-black hover:brightness-110 transition-all"
                  >
                    View Trips
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

export default CreateTripPage;
