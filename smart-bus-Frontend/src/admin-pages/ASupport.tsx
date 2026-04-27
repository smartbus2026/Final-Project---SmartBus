import React, { useState, useEffect } from 'react';
import { Ic } from '../icons';
import Api from '../services/Api';

const STATUS_MAP = {
  resolved: "bg-green-500/10 text-app-ok border-green-500/20",
  open: "bg-app-am-d text-app-am border-app-am-g",
  pending: "bg-app-bd2 text-app-mu border-app-bd",
};

interface Ticket {
  _id: string;
  subject: string;
  description: string;
  status: "open" | "pending" | "resolved";
  createdAt: string;
  user: {
    name: string;
    email: string;
    student_id?: string;
  };
}

const ASupport: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });

  const fetchTickets = async () => {
    try {
      const res = await Api.get('/support');
      setTickets(res.data.data.tickets || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (toast.msg) {
      const t = setTimeout(() => setToast({ msg: '', type: null }), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await Api.put(`/support/${id}`, { status });
      setTickets(prev => prev.map(t => t._id === id ? { ...t, status: status as any } : t));
      if (selectedTicket?._id === id) setSelectedTicket({ ...selectedTicket, status: status as any });
      setToast({ msg: `Ticket marked as ${status}`, type: 'success' });
    } catch (e) {
      setToast({ msg: 'Update failed', type: 'error' });
    }
  };

  return (
    <div className="flex-1 bg-app-bg text-app-tx min-h-screen p-8 font-sans transition-colors duration-500">
      
      {toast.msg && (
        <div className={`fixed top-10 right-10 z-[5000] px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top ${
          toast.type === 'success' ? 'bg-app-ok/20 border-app-ok text-app-ok' : 'bg-app-err/20 border-app-err text-app-err'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end mb-12 border-b border-app-bd pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-app-tx">
            Support <span className="text-app-am">Inbox</span>
          </h1>
          <p className="text-app-mu text-[10px] font-bold uppercase tracking-[0.5em] mt-2 italic">Student Complaints & Queries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tickets List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-app-card border border-app-bd rounded-[2rem]" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20 bg-app-card border border-app-bd rounded-[3rem] opacity-50">
              <p className="text-[12px] font-black uppercase tracking-widest">No tickets in inbox</p>
            </div>
          ) : (
            tickets.map(t => (
              <div 
                key={t._id} 
                onClick={() => setSelectedTicket(t)}
                className={`group cursor-pointer bg-app-card border transition-all duration-300 rounded-[2rem] p-6 flex items-center justify-between hover:scale-[1.01] ${
                  selectedTicket?._id === t._id ? 'border-app-am shadow-lg shadow-app-am/10' : 'border-app-bd hover:border-app-am/40'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${
                    t.status === 'resolved' ? 'bg-green-500/10 text-app-ok' : 'bg-app-am-d text-app-am'
                  }`}>
                    {t.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-[13px] font-black uppercase tracking-tight text-app-tx">{t.subject}</h3>
                    <p className="text-[10px] font-bold text-app-mu uppercase">{t.user.name} • {new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${STATUS_MAP[t.status]}`}>
                  {t.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-1">
          {selectedTicket ? (
            <div className="bg-app-card border border-app-bd rounded-[3rem] p-8 sticky top-24 animate-in slide-in-from-right duration-500">
              <div className="mb-8">
                <span className={`inline-block mb-4 rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${STATUS_MAP[selectedTicket.status]}`}>
                  {selectedTicket.status}
                </span>
                <h2 className="text-xl font-black uppercase tracking-tight text-app-tx mb-2">{selectedTicket.subject}</h2>
                <div className="p-4 bg-app-bg2 rounded-2xl border border-app-bd">
                  <p className="text-[10px] font-black text-app-mu uppercase mb-1">From: <span className="text-app-tx">{selectedTicket.user.name}</span></p>
                  <p className="text-[10px] font-black text-app-mu uppercase mb-1">Email: <span className="text-app-tx lowercase">{selectedTicket.user.email}</span></p>
                  <p className="text-[10px] font-black text-app-mu uppercase">ID: <span className="text-app-tx">{selectedTicket.user.student_id || 'N/A'}</span></p>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-[9px] font-black text-app-mu uppercase tracking-widest mb-3">Issue Details</p>
                <div className="text-[12px] leading-relaxed text-app-tx p-6 bg-app-card2 border border-app-bd rounded-2xl italic">
                  "{selectedTicket.description || 'No description provided.'}"
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[9px] font-black text-app-mu uppercase tracking-widest mb-3">Update Status</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => updateStatus(selectedTicket._id, 'pending')}
                    disabled={selectedTicket.status === 'pending'}
                    className="py-3 rounded-xl bg-app-bd2 text-app-mu font-black uppercase text-[10px] hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    Pending
                  </button>
                  <button 
                    onClick={() => updateStatus(selectedTicket._id, 'resolved')}
                    disabled={selectedTicket.status === 'resolved'}
                    className="py-3 rounded-xl bg-green-500 text-white font-black uppercase text-[10px] shadow-lg shadow-green-500/20 hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    Resolve
                  </button>
                </div>
                {selectedTicket.status !== 'open' && (
                  <button 
                    onClick={() => updateStatus(selectedTicket._id, 'open')}
                    className="w-full py-3 rounded-xl border border-app-bd text-app-mu font-black uppercase text-[10px] hover:bg-app-card2 transition-all"
                  >
                    Re-open Ticket
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-app-card/30 border border-app-bd border-dashed rounded-[3rem] p-10 text-center opacity-40">
              <div>
                <Ic.Chat className="mx-auto mb-4" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest">Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ASupport;
