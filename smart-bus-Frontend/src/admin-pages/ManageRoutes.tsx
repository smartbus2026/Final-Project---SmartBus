import React, { useState, useEffect, useRef } from 'react';
import { Ic } from '../icons';

interface BusRoute {
  id: string;
  code: string;
  name: string;
  distance: string;
  duration: string;
  activeBuses: number;
  stops: string[];
}

interface NewRouteForm {
  name: string;
  distance: string;
  duration: string;
  stops: string[];
}

const INITIAL_FORM: NewRouteForm = {
  name: '',
  distance: '',
  duration: '',
  stops: [''],
};

/* ── stagger hook ── */
function useStaggeredIn(deps: unknown[]) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return visible;
}

/* ── mock progress per route ── */
const mockProgress = (id: string) => {
  const map: Record<string, number> = { '1': 72, '2': 45 };
  return map[id] ?? Math.floor(30 + (parseInt(id, 10) % 5) * 12);
};

const ManageRoutesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('1');
  const [form, setForm]                       = useState<NewRouteForm>(INITIAL_FORM);
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  const firstInputRef                         = useRef<HTMLInputElement>(null);

  const [routes, setRoutes] = useState<BusRoute[]>([
    {
      id: '1',
      code: 'R-001',
      name: 'Aqaleem → University',
      distance: '12.5 km',
      duration: '40 min',
      activeBuses: 3,
      stops: ['Aqaleem Gate', 'Plaza Mall', 'University Main'],
    },
    {
      id: '2',
      code: 'R-002',
      name: 'Stadium → University',
      distance: '8.3 km',
      duration: '25 min',
      activeBuses: 2,
      stops: ['Stadium Entrance', 'West Station', 'University Main'],
    },
  ]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (isModalOpen) setTimeout(() => firstInputRef.current?.focus(), 80);
  }, [isModalOpen]);

  const openModal  = () => { setForm(INITIAL_FORM); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);

  const addStop = () =>
    setForm((prev) => ({ ...prev, stops: [...prev.stops, ''] }));

  const updateStop = (index: number, value: string) =>
    setForm((prev) => {
      const stops = [...prev.stops];
      stops[index] = value;
      return { ...prev, stops };
    });

  const removeStop = (index: number) =>
    setForm((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }));

  const deployRoute = () => {
    const filledStops = form.stops.filter((s) => s.trim() !== '');
    if (!form.name.trim() || filledStops.length === 0) return;
    const newRoute: BusRoute = {
      id: String(Date.now()),
      code: `R-${String(routes.length + 1).padStart(3, '0')}`,
      name: form.name.toUpperCase(),
      distance: form.distance || '—',
      duration: form.duration || '—',
      activeBuses: 0,
      stops: filledStops,
    };
    setRoutes((prev) => [...prev, newRoute]);
    setSelectedRouteId(newRoute.id);
    closeModal();
  };

  const deleteRoute = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    setTimeout(() => {
      setRoutes((prev) => prev.filter((r) => r.id !== id));
      if (selectedRouteId === id) {
        setSelectedRouteId(routes.find((r) => r.id !== id)?.id ?? '');
      }
      setDeletingId(null);
    }, 280);
  };

  const filteredRoutes = routes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);
  const listVisible   = useStaggeredIn([filteredRoutes.length]);

  return (
    <div className="flex-1 flex flex-col bg-app-bg text-app-tx min-h-screen">

      {/* ════════ keyframes (injected once) ════════ */}
      <style>{`
        @keyframes modalIn  { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes slideDown{ from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
        @keyframes cardIn   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes fadeScale{ from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
      `}</style>

      {/* ════════════════════════════════════════
          MODAL
      ════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeModal} />

          <div
            className="bg-app-card border border-app-bd w-full max-w-lg rounded-[2.5rem] relative z-10 shadow-2xl overflow-hidden"
            style={{ animation: 'modalIn .25s cubic-bezier(.22,1,.36,1) both' }}
          >
            {/* header */}
            <div className="p-8 border-b border-app-bd flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-app-am/20 p-3 rounded-2xl text-app-am">
                  <Ic.Route />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-widest">New Route</h2>
                  <p className="text-[10px] text-app-mu font-bold uppercase tracking-widest mt-1">Configure logistics</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-app-card2 border border-app-bd text-app-mu hover:text-app-tx hover:border-app-am/40 transition-all"
              >
                <Ic.Close />
              </button>
            </div>

            {/* body */}
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-app-mu text-[10px] uppercase font-black tracking-[0.2em] ml-1">Route Descriptor</label>
                <input
                  ref={firstInputRef}
                  type="text"
                  placeholder="E.G. NORTH SECTOR → CAMPUS"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-4 outline-none focus:border-app-am transition-all text-xs font-bold text-app-tx placeholder:opacity-30 uppercase tracking-widest"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-app-mu text-[10px] uppercase font-black tracking-[0.2em] ml-1">Total Distance</label>
                  <input
                    type="text"
                    placeholder="10.0 KM"
                    value={form.distance}
                    onChange={(e) => setForm((p) => ({ ...p, distance: e.target.value }))}
                    className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-4 outline-none focus:border-app-am transition-all text-xs font-bold text-app-tx uppercase tracking-widest"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-app-mu text-[10px] uppercase font-black tracking-[0.2em] ml-1">EST. Time</label>
                  <input
                    type="text"
                    placeholder="30 MIN"
                    value={form.duration}
                    onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                    className="w-full bg-app-card2 border border-app-bd rounded-2xl px-5 py-4 outline-none focus:border-app-am transition-all text-xs font-bold text-app-tx uppercase tracking-widest"
                  />
                </div>
              </div>

              {/* stops — connected rail */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-app-mu text-[10px] uppercase font-black tracking-[0.2em] ml-1">Checkpoint Chain</label>
                  <button
                    onClick={addStop}
                    className="text-app-am text-[9px] font-black hover:brightness-125 hover:bg-app-am/10 transition-all uppercase tracking-widest border border-app-am/30 px-3 py-1 rounded-full"
                  >
                    + ADD STOP
                  </button>
                </div>

                <div className="max-h-52 overflow-y-auto pr-1 custom-scrollbar space-y-0">
                  {form.stops.map((stop, index) => (
                    <div key={index} className="flex gap-3" style={{ animation: 'slideDown .2s ease both' }}>
                      {/* rail */}
                      <div className="flex flex-col items-center pt-[18px] w-5 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-app-am bg-app-bg shrink-0 z-10" />
                        {index < form.stops.length - 1 && (
                          <div className="w-[2px] flex-1 bg-app-am/20 mt-1 min-h-[10px]" />
                        )}
                      </div>
                      {/* input */}
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-3 bg-app-card2 border border-app-bd rounded-2xl px-4 py-3.5 group focus-within:border-app-am transition-all">
                          <input
                            type="text"
                            placeholder={`STOP ${index + 1}`}
                            value={stop}
                            onChange={(e) => updateStop(index, e.target.value)}
                            className="bg-transparent border-none outline-none text-[11px] font-bold w-full text-app-tx uppercase tracking-widest"
                          />
                          {form.stops.length > 1 && (
                            <button
                              onClick={() => removeStop(index)}
                              className="text-app-mu hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                            >
                              <Ic.Close />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="p-8 bg-app-card2 border-t border-app-bd flex justify-end gap-4">
              <button
                onClick={closeModal}
                className="px-8 py-4 text-app-mu font-black text-[10px] uppercase tracking-widest hover:text-app-tx transition-all"
              >
                Discard
              </button>
              <button
                onClick={deployRoute}
                disabled={!form.name.trim()}
                className="bg-app-am text-black px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-app-am/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Deploy Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TOPBAR
      ════════════════════════════════════════ */}
      <div className="px-4 sm:px-10 pt-8 pb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shrink-0">
        <div className="bg-app-card border border-app-bd px-5 py-3.5 rounded-2xl flex items-center gap-4 w-full sm:w-[350px] shadow-sm focus-within:border-app-am/50 transition-all">
          <span className="text-app-mu"><Ic.Search /></span>
          <input
            type="text"
            placeholder="FILTER ROUTES..."
            className="bg-transparent border-none outline-none text-app-tx w-full text-[10px] font-black tracking-widest placeholder:opacity-20 uppercase"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-app-mu hover:text-app-tx transition-colors">
              <Ic.Close />
            </button>
          )}
        </div>
        <button
          onClick={openModal}
          className="bg-app-am text-black font-black px-8 py-4 rounded-2xl hover:brightness-110 active:scale-95 transition-all text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-app-am/10 whitespace-nowrap"
        >
          + New Route
        </button>
      </div>

      {/* ════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════ */}
      <section className="flex-1 overflow-hidden px-4 sm:px-10 pb-10">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-app-mu text-[10px] font-black uppercase tracking-[0.2em]">
            {filteredRoutes.length} Registered Sector{filteredRoutes.length !== 1 ? 's' : ''}
          </span>
          <div className="h-[1px] flex-1 bg-app-bd opacity-30" />
        </div>

        {/* ── Empty state ── */}
        {filteredRoutes.length === 0 && (
          <div
            className="flex flex-col items-center justify-center h-64 gap-6"
            style={{ animation: 'fadeScale .35s ease both' }}
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-[2rem] bg-app-card border border-app-bd flex items-center justify-center text-app-mu opacity-40">
                <Ic.Route />
              </div>
              <div className="absolute inset-0 rounded-[2rem] border border-app-am/10 scale-110" />
              <div className="absolute inset-0 rounded-[2rem] border border-app-am/5  scale-125" />
            </div>
            <div className="text-center space-y-2 opacity-40">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-app-tx">No routes found</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-app-mu">
                {searchQuery ? 'Try a different search term' : 'Deploy your first route above'}
              </p>
            </div>
          </div>
        )}

        {filteredRoutes.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-6 lg:gap-10 h-full pb-10">

            {/* ── Routes list ── */}
            <div className="overflow-y-auto pr-1 lg:pr-4 space-y-4 custom-scrollbar">
              {filteredRoutes.map((route, idx) => (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`group relative bg-app-card border rounded-[2rem] p-6 lg:p-8 cursor-pointer transition-all duration-300 ${
                    deletingId === route.id ? 'opacity-0 scale-95 pointer-events-none' : ''
                  } ${
                    selectedRouteId === route.id
                      ? 'border-app-am shadow-2xl shadow-app-am/5 scale-[1.02]'
                      : 'border-app-bd hover:border-app-am/30 hover:shadow-lg hover:shadow-app-am/5'
                  }`}
                  style={listVisible ? { animation: `cardIn .3s ease ${idx * 60}ms both` } : { opacity: 0 }}
                >
                  {/* selected left strip */}
                  {selectedRouteId === route.id && (
                    <div className="absolute left-0 top-6 bottom-6 w-[3px] bg-app-am rounded-r-full" />
                  )}

                  {/* header */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="min-w-0 flex-1 pr-3">
                      <h3 className="text-sm font-black uppercase tracking-tighter text-app-tx mb-1.5 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${route.activeBuses > 0 ? 'bg-app-ok animate-pulse' : 'bg-app-mu'}`} />
                        <span className="truncate">{route.name}</span>
                      </h3>
                      <div className="text-app-mu text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-1 flex-wrap">
                        <span>{route.code}</span>
                        <span className="text-app-bd">·</span>
                        <span>{route.distance}</span>
                        <span className="text-app-bd">·</span>
                        <span>{route.duration}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="bg-app-card2 p-2 rounded-xl border border-app-bd group-hover:border-app-am/30 transition-all text-app-mu">
                        <Ic.Route />
                      </div>
                      <button
                        onClick={(e) => deleteRoute(route.id, e)}
                        className="bg-app-card2 p-2 rounded-xl border border-app-bd hover:border-red-400/40 hover:text-red-400 text-app-mu transition-all"
                      >
                        <Ic.Close />
                      </button>
                    </div>
                  </div>

                  {/* stops chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-5 min-h-[26px] overflow-hidden max-h-[26px]">
                    {route.stops.map((stop, index) => (
                      <React.Fragment key={index}>
                        <span className="bg-app-card2 border border-app-bd px-2.5 py-1.5 rounded-lg text-[8px] font-black text-app-tx uppercase tracking-tighter whitespace-nowrap">
                          {stop}
                        </span>
                        {index < route.stops.length - 1 && (
                          <svg width="8" height="8" viewBox="0 0 8 8" className="text-app-mu opacity-30 shrink-0">
                            <path d="M1 4h6M5 2l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          </svg>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* progress bar */}
                  <div className="mb-5">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[8px] font-black text-app-mu uppercase tracking-widest">Route Coverage</span>
                      <span className="text-[8px] font-black text-app-am">{mockProgress(route.id)}%</span>
                    </div>
                    <div className="h-[3px] w-full bg-app-card2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-app-am rounded-full transition-all duration-700"
                        style={{ width: `${mockProgress(route.id)}%` }}
                      />
                    </div>
                  </div>

                  {/* footer */}
                  <div className="flex justify-between items-center pt-5 border-t border-app-bd/50">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {route.activeBuses > 0
                          ? [...Array(Math.min(route.activeBuses, 5))].map((_, i) => (
                              <div key={i} className="w-6 h-6 rounded-full border-2 border-app-card bg-app-am flex items-center justify-center">
                                <div className="w-2 h-2 bg-black rounded-full" />
                              </div>
                            ))
                          : <div className="w-6 h-6 rounded-full border-2 border-dashed border-app-bd bg-app-card2" />
                        }
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${route.activeBuses > 0 ? 'text-app-am' : 'text-app-mu'}`}>
                        {route.activeBuses > 0 ? `${route.activeBuses} Active Fleet` : 'No buses assigned'}
                      </span>
                    </div>
                    <Ic.Dots className="text-app-mu group-hover:text-app-am transition-colors" />
                  </div>
                </div>
              ))}
            </div>

            {/* ── Detail panel (desktop) ── */}
            <div className="hidden lg:flex bg-app-card border border-app-bd rounded-[3rem] relative overflow-hidden flex-col shadow-inner">
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
                  backgroundSize: '50px 50px',
                }}
              />

              {/* live badge */}
              <div className="absolute top-8 left-8 z-10">
                <span className="bg-black/40 backdrop-blur-xl text-app-ok px-5 py-2.5 rounded-2xl text-[10px] font-black border border-app-ok/20 flex items-center gap-3 tracking-[0.2em] uppercase shadow-2xl">
                  <span className="w-2.5 h-2.5 bg-app-ok rounded-full animate-ping" />
                  Spatial Visualization
                </span>
              </div>

              {/* selected route card */}
              {selectedRoute && (
                <div
                  key={selectedRoute.id}
                  className="absolute top-8 right-8 z-10 bg-app-card2/80 backdrop-blur-md border border-app-bd rounded-2xl p-5 min-w-[200px]"
                  style={{ animation: 'fadeScale .25s ease both' }}
                >
                  <p className="text-[9px] font-black text-app-mu uppercase tracking-widest mb-3">Selected Route</p>
                  <p className="text-xs font-black text-app-tx uppercase tracking-tight mb-1">{selectedRoute.name}</p>
                  <p className="text-[9px] text-app-am font-bold mb-4">{selectedRoute.code}</p>

                  {/* mini stop chain */}
                  <div className="space-y-1.5 mb-4">
                    {selectedRoute.stops.map((stop, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          i === 0 || i === selectedRoute.stops.length - 1
                            ? 'bg-app-am'
                            : 'border border-app-am'
                        }`} />
                        <span className="text-[8px] font-black text-app-tx uppercase tracking-wider truncate">{stop}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 border-t border-app-bd/50 pt-3">
                    {[
                      { label: 'Distance', val: selectedRoute.distance },
                      { label: 'Duration', val: selectedRoute.duration },
                      { label: 'Stops',    val: String(selectedRoute.stops.length) },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-[9px] text-app-mu uppercase tracking-widest">{label}</span>
                        <span className="text-[9px] font-black text-app-tx">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* map placeholder */}
              <div className="flex-1 flex flex-col items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-app-am/5 via-transparent to-transparent opacity-50" />
                <div className="relative text-app-mu opacity-10">
                  <Ic.Map size={240} />
                </div>
                <p className="mt-10 font-black tracking-[0.4em] text-[10px] uppercase opacity-30 text-app-tx relative">
                  Terminal Node Interface
                </p>
              </div>

              {/* panel footer */}
              <div className="h-24 bg-app-card2/50 backdrop-blur-md border-t border-app-bd px-10 flex items-center justify-between">
                <div className="flex gap-10">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-app-mu uppercase tracking-widest">Network Load</span>
                    <span className="text-xs font-black text-app-ok uppercase">Optimized</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-app-mu uppercase tracking-widest">Active Links</span>
                    <span className="text-xs font-black text-app-tx uppercase">
                      {routes.reduce((acc, r) => acc + r.stops.length, 0)} Active Stops
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-app-mu uppercase tracking-widest">Total Fleet</span>
                    <span className="text-xs font-black text-app-am uppercase">
                      {routes.reduce((acc, r) => acc + r.activeBuses, 0)} Buses
                    </span>
                  </div>
                </div>
                <button className="bg-app-card border border-app-bd px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-app-tx hover:border-app-am active:scale-95 transition-all">
                  Toggle Telemetry
                </button>
              </div>
            </div>

            {/* ── Detail panel (mobile) ── */}
            {selectedRoute && (
              <div className="lg:hidden bg-app-card border border-app-bd rounded-[2rem] p-6">
                <p className="text-[9px] font-black text-app-mu uppercase tracking-widest mb-3">Selected Route</p>
                <p className="text-sm font-black text-app-tx uppercase tracking-tight mb-1">{selectedRoute.name}</p>
                <p className="text-[9px] text-app-am font-bold mb-4">{selectedRoute.code}</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Distance', val: selectedRoute.distance },
                    { label: 'Duration', val: selectedRoute.duration },
                    { label: 'Stops',    val: String(selectedRoute.stops.length) },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-app-card2 border border-app-bd rounded-xl p-3 text-center">
                      <p className="text-[8px] text-app-mu uppercase tracking-widest mb-1">{label}</p>
                      <p className="text-xs font-black text-app-tx">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </section>
    </div>
  );
};

export default ManageRoutesPage;