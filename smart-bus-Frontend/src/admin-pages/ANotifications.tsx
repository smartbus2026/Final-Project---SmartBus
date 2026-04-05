import React, { useState } from 'react';
import { Ic } from '../icons';

interface Notification {
  id: string;
  title: string;
  time: string;
  target: string;
  message: string;
  readCount: number;
}

const AdminNotifications: React.FC = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("All Users");

  const templates = [
    { icon: <Ic.Calendar />, label: "Registration Reminder", msg: "Don't forget to register for tomorrow's bus. Window closes at 2:00 PM." },
    { icon: <Ic.Bus />,      label: "Trip Delay",             msg: "Your bus is delayed. Please wait at the pickup point." },
    { icon: <Ic.Map />,      label: "Route Change",           msg: "Route has been changed due to road conditions. Please check the new route." },
    { icon: <Ic.Bell />,     label: "General Announcement",   msg: "Important announcement from SmartBus administration." },
  ];

  const notifications: Notification[] = [
    { id: "N-001", title: "Registration Window Reminder", time: "Feb 7, 2026 • 11:00 AM", target: "All Students",           message: "Don't forget to register for tomorrow's bus. Window closes at 2:00 PM.", readCount: 892 },
    { id: "N-002", title: "Route Change Notice",           time: "Feb 6, 2026 • 4:00 PM",  target: "Aqaleem Route Students", message: "Aqaleem route will use an alternative road due to construction. Please arrive early.", readCount: 234 },
    { id: "N-003", title: "Return Trip Update",            time: "Feb 5, 2026 • 2:30 PM",  target: "Evening Return",         message: "Evening return trip has been moved from 7:00 PM to 7:15 PM for today only.", readCount: 156 },
    { id: "N-004", title: "New Driver Assigned",           time: "Feb 4, 2026 • 9:00 AM",  target: "All Drivers",            message: "A new driver, Khaled Saeed, has been assigned to the Seil route.", readCount: 6 },
  ];

  return (
    <div className="p-8 space-y-8">
      
      {/* Page Header Like Dashboard Tabs */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-app-tx uppercase tracking-widest text-xs">Notification Center</h3>
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-app-ok animate-pulse"></span>
           <span className="text-[10px] font-black text-app-ok tracking-tighter uppercase">Broadcast Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">

        {/* ── Left Column: Compose ── */}
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
                  <option>All Users</option>
                  <option>Drivers Only</option>
                  <option>Students Only</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button className="flex-1 bg-app-am hover:brightness-110 text-black py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-app-am/10">
                  <Ic.Send /> Send Notification
                </button>
              </div>
            </div>
          </div>

          {/* Templates - Dashboard Alert Style */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-app-mu uppercase tracking-widest">Presets</h3>
            <div className="grid grid-cols-1 gap-2">
              {templates.map((t) => (
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

        {/* ── Right Column: History ── */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
             <h3 className="text-[10px] font-black text-app-mu uppercase tracking-widest">Broadcast History</h3>
             <button className="text-[9px] font-black text-app-mu hover:text-app-am transition-colors">CLEAR LOG</button>
          </div>

          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-app-card border border-app-bd p-6 rounded-2xl group hover:border-app-am/20 transition-all relative overflow-hidden"
              >
                {/* ID Tag */}
                <div className="absolute top-0 right-0 bg-app-card2 border-l border-b border-app-bd px-3 py-1 text-[9px] font-black text-app-mu rounded-bl-xl uppercase tracking-tighter">
                  {notif.id}
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-app-am/10 flex items-center justify-center text-app-am shrink-0 border border-app-am/5">
                    <Ic.Bell />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                      <h4 className="font-black text-sm text-app-tx tracking-tight">
                        {notif.title}
                      </h4>
                      <div className="flex items-center gap-3">
                         <span className="text-[9px] font-bold text-app-mu uppercase">{notif.time}</span>
                         <span className="px-3 py-1 bg-app-card2 border border-app-bd rounded-full text-[9px] font-black text-app-am uppercase tracking-tighter">
                            {notif.target}
                         </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-app-mu font-medium leading-relaxed mb-4 max-w-2xl">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] font-black text-app-ok uppercase tracking-tighter">
                      <div className="w-1.5 h-1.5 rounded-full bg-app-ok"></div>
                      Confirmed by {notif.readCount} recipients
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;