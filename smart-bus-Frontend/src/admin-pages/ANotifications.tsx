import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Ic } from '../icons';
import { useAdminNotifications } from '../hooks/useAdminNotifications';
import Api from '../services/Api';

interface NotifItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const AdminNotifications: React.FC = () => {
  // ── Broadcast Composer state ────────────────────────────────────────────────
  const { isLoading, toast, history, setHistory, sendBroadcast } = useAdminNotifications();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('All Users');
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');

  // ── Received Notifications (Admin inbox) ───────────────────────────────────
  const [inbox, setInbox] = useState<NotifItem[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);

  // Fetch on mount
  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await Api.get('/notifications');
        setInbox(res.data?.data?.notifications || []);
      } catch (err) {
        console.error('Failed to fetch admin notifications', err);
      } finally {
        setInboxLoading(false);
      }
    };
    fetchInbox();
  }, []);

  // Real-time socket listener
  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001');
    socket.emit('join-admins');

    socket.on('new_notification', (notif: Partial<NotifItem>) => {
      setInbox(prev => [{
        _id: notif._id || Date.now().toString(),
        title: notif.title || 'New Alert',
        message: notif.message || '',
        type: notif.type || 'general',
        read: false,
        createdAt: notif.createdAt || new Date().toISOString(),
      }, ...prev]);
    });

    return () => { socket.disconnect(); };
  }, []);

  const handleMarkRead = async (id: string) => {
    setInbox(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    try {
      await Api.put(`/notifications/${id}/read`);
    } catch {
      setInbox(prev => prev.map(n => n._id === id ? { ...n, read: false } : n));
    }
  };

  const handleMarkAllRead = async () => {
    const unread = inbox.filter(n => !n.read);
    setInbox(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await Promise.all(unread.map(n => Api.put(`/notifications/${n._id}/read`)));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const unreadCount = inbox.filter(n => !n.read).length;

  const templates = [
    { icon: <Ic.Calendar />, label: 'Registration Reminder', msg: "Don't forget to register for tomorrow's bus. Window closes at 2:00 PM." },
    { icon: <Ic.Bus />,      label: 'Trip Delay',             msg: 'Your bus is delayed. Please wait at the pickup point.' },
    { icon: <Ic.Map />,      label: 'Route Change',           msg: 'Route has been changed due to road conditions. Please check the new route.' },
    { icon: <Ic.Bell />,     label: 'General Announcement',   msg: 'Important announcement from SmartBus administration.' },
  ];

  const handleSend = async () => {
    const success = await sendBroadcast({ title, message, target });
    if (success) { setTitle(''); setMessage(''); }
  };

  return (
    <div className="p-8 space-y-8 bg-app-bg text-app-tx min-h-screen transition-colors duration-500 relative">

      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-10 right-10 z-[5000] px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top ${
          toast.type === 'success' ? 'bg-app-ok/20 border-app-ok text-app-ok' : 'bg-app-err/20 border-app-err text-app-err'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-syne text-2xl font-black text-app-tx tracking-tight">Notification Center</h1>
          <p className="text-[11px] font-bold text-app-mu uppercase tracking-widest mt-1">Broadcast & Inbox</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-app-ok animate-pulse" />
          <span className="text-[10px] font-black text-app-ok tracking-tighter uppercase">Socket Live</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-app-card border border-app-bd rounded-2xl w-fit">
        {(['inbox', 'compose'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab
                ? 'bg-app-am text-white shadow-lg shadow-app-am/20'
                : 'text-app-mu hover:text-app-tx'
            }`}
          >
            {tab === 'inbox' ? (
              <span className="flex items-center gap-2">
                Inbox
                {unreadCount > 0 && (
                  <span className="bg-white/20 text-white rounded-full px-1.5 py-0.5 text-[9px]">{unreadCount}</span>
                )}
              </span>
            ) : 'Compose'}
          </button>
        ))}
      </div>

      {/* ── INBOX TAB ── */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-app-mu uppercase tracking-widest">
              {inbox.length} notification{inbox.length !== 1 ? 's' : ''}
              {unreadCount > 0 && <span className="ml-2 text-app-am">· {unreadCount} unread</span>}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[9px] font-black text-app-am hover:text-app-tx transition-colors uppercase tracking-widest"
              >
                Mark All Read
              </button>
            )}
          </div>

          {inboxLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-6 h-6 border-2 border-app-am border-t-transparent rounded-full animate-spin" />
            </div>
          ) : inbox.length === 0 ? (
            <div className="flex flex-col items-center py-24 opacity-30 text-center gap-4">
              <Ic.Bell />
              <p className="font-syne font-bold text-sm">Your inbox is empty</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl">
              {inbox.map(n => (
                <div
                  key={n._id}
                  className={`group flex items-start gap-4 rounded-2xl border p-5 transition-all cursor-pointer hover:border-app-am/30 ${
                    n.read
                      ? 'bg-app-card border-app-bd opacity-70'
                      : 'bg-app-card border-app-am/20 shadow-sm shadow-app-am/5'
                  }`}
                  onClick={() => !n.read && handleMarkRead(n._id)}
                >
                  {/* Unread dot */}
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full transition-all ${n.read ? 'bg-transparent' : 'bg-app-am'}`} />

                  {/* Icon */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-am-d text-app-am shadow-sm group-hover:scale-105 transition-transform ${n.read ? 'opacity-50' : ''}`}>
                    <Ic.Bell />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-syne text-[13px] font-bold text-app-tx leading-tight">{n.title}</h4>
                        <p className="text-[10px] text-app-mu2 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-app-bd2 px-2 py-0.5 text-[9px] font-bold text-app-mu uppercase tracking-wider">
                        {n.type}
                      </span>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-app-mu">{n.message}</p>
                    {!n.read && (
                      <p className="mt-2 text-[10px] font-bold text-app-am">Click to mark as read</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COMPOSE TAB ── */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">

          {/* Left: Compose */}
          <div className="space-y-6">
            <div className="bg-app-card border border-app-bd p-6 rounded-2xl shadow-sm">
              <h3 className="text-[10px] font-black text-app-mu uppercase tracking-[0.2em] mb-6">Compose New</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-app-mu mb-2">Subject</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter title..."
                    className="w-full bg-app-card2 border border-app-bd rounded-xl px-4 py-3 text-xs font-medium text-app-tx outline-none focus:border-app-am/50 transition-all placeholder:opacity-30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-app-mu mb-2">Message Body</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type your announcement..."
                    rows={4}
                    className="w-full bg-app-card2 border border-app-bd rounded-xl px-4 py-3 text-xs font-medium text-app-tx outline-none focus:border-app-am/50 transition-all resize-none placeholder:opacity-30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-app-mu mb-2">Recipient Group</label>
                  <select
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    className="w-full bg-app-card2 border border-app-bd rounded-xl px-4 py-3 text-xs font-bold text-app-tx outline-none cursor-pointer focus:border-app-am/50 transition-all appearance-none"
                  >
                    <option value="All Users">All Users</option>
                    <option value="Students Only">Students Only</option>
                  </select>
                </div>
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="w-full bg-app-am hover:brightness-110 text-white dark:text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-app-am/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Ic.Send /> {isLoading ? 'Transmitting...' : 'Send Notification'}
                </button>
              </div>
            </div>

            {/* Templates */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-app-mu uppercase tracking-widest">Presets</h3>
              <div className="grid grid-cols-1 gap-2">
                {templates.map(t => (
                  <button
                    key={t.label}
                    onClick={() => { setTitle(t.label); setMessage(t.msg); }}
                    className="flex items-center gap-3 p-3 bg-app-card border border-app-bd rounded-xl hover:border-app-am/40 transition-all text-left group"
                  >
                    <span className="text-app-am group-hover:scale-110 transition-transform">{t.icon}</span>
                    <span className="text-[10px] font-bold text-app-tx uppercase tracking-tight">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Broadcast History */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[10px] font-black text-app-mu uppercase tracking-widest">Broadcast History</h3>
              <button onClick={() => setHistory([])} className="text-[9px] font-black text-app-mu hover:text-app-am transition-colors">CLEAR LOG</button>
            </div>
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="bg-app-card border border-app-bd border-dashed p-10 rounded-2xl flex items-center justify-center text-app-mu text-xs font-bold uppercase tracking-widest opacity-50">
                  No active broadcasts in session
                </div>
              ) : history.map(notif => (
                <div
                  key={notif.id}
                  className="bg-app-card border border-app-bd p-6 rounded-2xl group hover:border-app-am/20 transition-all relative overflow-hidden animate-in slide-in-from-top-4"
                >
                  <div className="absolute top-0 right-0 bg-app-card2 border-l border-b border-app-bd px-3 py-1 text-[9px] font-black text-app-mu rounded-bl-xl uppercase tracking-tighter">
                    {notif.id}
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-app-am-g flex items-center justify-center text-app-am shrink-0 border border-app-am/10">
                      <Ic.Bell />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                        <h4 className="font-black text-sm text-app-tx tracking-tight">{notif.title}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-app-mu uppercase">{notif.time}</span>
                          <span className="px-3 py-1 bg-app-card2 border border-app-bd rounded-full text-[9px] font-black text-app-am uppercase tracking-tighter">{notif.target}</span>
                        </div>
                      </div>
                      <p className="text-xs text-app-mu font-medium leading-relaxed mb-4 max-w-2xl">{notif.message}</p>
                      <div className="flex items-center gap-2 text-[10px] font-black text-app-ok uppercase tracking-tighter">
                        <div className="w-1.5 h-1.5 rounded-full bg-app-ok" />
                        Delivered successfully
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;