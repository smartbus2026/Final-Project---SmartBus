import React, { useState, useEffect } from 'react';
import { Ic } from '../icons';
import Api from '../services/Api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet marker icon fix
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Coordinates for Aswan as default center
const ASWAN_CENTER: [number, number] = [24.0889, 32.8998];

const ManageRoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });
  
  // Confirmation states
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'route' | 'stop'; routeId: string; stopId?: string; stopName?: string } | null>(null);
  const [quickAddId, setQuickAddId] = useState<string | null>(null);
  const [newStopName, setNewStopName] = useState('');

  const [form, setForm] = useState({
    name: '', distance: '', duration: '', startTime: '07:30',
    startLocation: { lat: 24.0889, lng: 32.8998 },
    stops: ['']
  });

  useEffect(() => { fetchRoutes(); }, []);

  // Auto-hide Toast
  useEffect(() => {
    if (toast.msg) {
      const t = setTimeout(() => setToast({ msg: '', type: null }), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchRoutes = async () => {
    try {
      const res = await Api.get('/routes');
      setRoutes(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const handleDeploy = async () => {
    if (!form.name.trim() || form.stops.some(s => !s.trim())) {
      setToast({ msg: ' Please fill all required fields', type: 'error' });
      return;
    }
    setIsLoading(true);
    try {
      await Api.post('/routes', form);
      await fetchRoutes();
      setIsModalOpen(false);
      setForm({ name: '', distance: '', duration: '', startTime: '07:30', startLocation: { lat: 24.0889, lng: 32.8998 }, stops: [''] });
      setToast({ msg: ' Route deployed successfully', type: 'success' });
    } catch (e) { setToast({ msg: ' Deployment failed', type: 'error' }); }
    finally { setIsLoading(false); }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === 'route') {
        await Api.delete(`/routes/${confirmDelete.routeId}`);
        setRoutes(prev => prev.filter(r => r._id !== confirmDelete.routeId));
        setToast({ msg: ' Route deleted successfully', type: 'success' });
      } else {
        await Api.delete(`/routes/${confirmDelete.routeId}/remove-stop/${confirmDelete.stopId}`);
        await fetchRoutes();
        setToast({ msg: ` Stop "${confirmDelete.stopName}" removed`, type: 'success' });
      }
    } catch (e) { 
      setToast({ msg: ' Delete failed: Check server connection', type: 'error' }); 
    } finally { 
      setConfirmDelete(null); 
    }
  };

  const handleQuickAddStop = async (routeId: string) => {
    if (!newStopName.trim()) return;
    try {
      await Api.post(`/routes/${routeId}/stops`, { stop_name: newStopName, lat: 0, lng: 0 });
      await fetchRoutes();
      setNewStopName('');
      setQuickAddId(null);
      setToast({ msg: ' Stop added successfully', type: 'success' });
    } catch (e) { setToast({ msg: ' Failed to add stop', type: 'error' }); }
  };

  const MapPicker = () => {
    useMapEvents({ click(e) { setForm(p => ({ ...p, startLocation: { lat: e.latlng.lat, lng: e.latlng.lng } })); } });
    return <Marker position={[form.startLocation.lat, form.startLocation.lng]} />;
  };

  return (
    <div className="flex-1 bg-[#0a0a0c] text-white min-h-screen p-8 font-sans relative">
      
      {/* Toast Notification */}
      {toast.msg && (
        <div className={`fixed top-10 right-10 z-[3000] px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border backdrop-blur-xl shadow-2xl ${
          toast.type === 'success' ? 'bg-app-ok/20 border-app-ok text-app-ok' : 'bg-red-500/20 border-red-500 text-red-500'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-[#151518] border border-white/10 p-10 rounded-[2.5rem] max-w-sm text-center shadow-2xl">
            <h2 className="text-xl font-black uppercase mb-4 text-red-500">Confirm Delete</h2>
            <p className="text-white/60 text-[10px] mb-8 uppercase font-bold">
              {confirmDelete.type === 'route' ? 'Are you sure you want to delete this route permanently?' : `Remove stop "${confirmDelete.stopName}" from this route?`}
            </p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-4 rounded-2xl bg-white/5 font-black uppercase text-[10px]">Cancel</button>
              <button onClick={executeDelete} className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black uppercase text-[10px]">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end mb-12 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Aswan <span className="text-app-am">Fleet</span></h1>
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.5em] mt-2">Operational Command Center</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-10 py-4 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-app-am transition-all shadow-xl active:scale-95">
          + New Route
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {routes.map((route) => (
          <div key={route._id} className="group bg-[#151518] border border-white/5 rounded-[3rem] p-8 hover:border-app-am/50 transition-all duration-500 relative">
            <button onClick={() => setConfirmDelete({ type: 'route', routeId: route._id })} className="absolute top-8 right-8 text-white/20 hover:text-red-500 transition-colors">
              <Ic.Close size={20} />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-app-am/10 border border-app-am/20 flex items-center justify-center text-app-am font-black text-xs">
                {route.startTime || '07:30'}
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight truncate pr-6">{route.name}</h3>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Stops</span>
                <button onClick={() => setQuickAddId(route._id)} className="w-6 h-6 rounded-full bg-app-am/10 text-app-am flex items-center justify-center hover:bg-app-am hover:text-black transition-all font-bold">+</button>
              </div>

              {route.stops?.map((stop: any, i: number) => (
                <div key={stop._id || i} className="flex items-center justify-between group/stop">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-app-am shadow-[0_0_8px_#f7a01b]' : 'bg-white/10'}`} />
                    <span className="text-[10px] font-black text-white/50 uppercase group-hover/stop:text-white transition-colors">{stop.name || stop}</span>
                  </div>
                  <button onClick={() => setConfirmDelete({ type: 'stop', routeId: route._id, stopId: stop._id, stopName: stop.name || stop })} className="opacity-0 group-hover/stop:opacity-100 text-red-500/40 hover:text-red-500 transition-all">
                    <Ic.Close size={12} />
                  </button>
                </div>
              ))}
              
              {quickAddId === route._id && (
                <div className="flex gap-2 pt-2 animate-in fade-in slide-in-from-left">
                  <input autoFocus type="text" placeholder="STOP NAME" className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:border-app-am" value={newStopName} onChange={(e) => setNewStopName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuickAddStop(route._id)} />
                  <button onClick={() => handleQuickAddStop(route._id)} className="bg-app-am text-black px-4 rounded-xl font-black text-[10px]">ADD</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Deploy Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)} />
          <div className="bg-[#151518] border border-white/10 w-full max-w-5xl rounded-[3.5rem] relative z-10 grid grid-cols-1 lg:grid-cols-2 overflow-hidden shadow-2xl">
            <div className="p-12 space-y-8 overflow-y-auto max-h-[85vh] custom-scrollbar">
              <h2 className="text-3xl font-black uppercase tracking-tighter">New <span className="text-app-am">Sector</span></h2>
              <div className="space-y-4">
                <input type="text" placeholder="ROUTE NAME" className="w-full bg-black border border-white/5 p-5 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-app-am" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input type="time" className="w-full bg-black border border-white/5 p-5 rounded-2xl text-[10px] font-black outline-none" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
                  <input type="text" placeholder="DISTANCE (KM)" className="w-full bg-black border border-white/5 p-5 rounded-2xl text-[10px] font-black outline-none" value={form.distance} onChange={e => setForm({...form, distance: e.target.value})} />
                </div>
                {form.stops.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" placeholder={`STATION #${i+1}`} className="w-full bg-black border border-white/5 p-4 rounded-xl text-[10px] font-black uppercase" value={s} onChange={e => { const ns = [...form.stops]; ns[i] = e.target.value; setForm({...form, stops: ns})}} />
                  </div>
                ))}
                <button onClick={() => setForm({...form, stops: [...form.stops, '']})} className="text-app-am text-[9px] font-black uppercase tracking-widest">+ Add stop</button>
              </div>
              <button onClick={handleDeploy} disabled={isLoading} className="w-full bg-app-am text-black py-6 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 active:scale-95 transition-all">
                {isLoading ? 'Processing...' : 'Deploy to Aswan'}
              </button>
            </div>
            <div className="relative bg-black min-h-[400px]">
              <MapContainer center={ASWAN_CENTER} zoom={13} style={{ height: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                <MapPicker />
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRoutesPage;