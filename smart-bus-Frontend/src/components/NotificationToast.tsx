import React, { useEffect, useState } from "react";
import socket from "../services/socket";
import { Ic } from "../icons";

export default function NotificationToast() {
  const [messages, setMessages] = useState<{ id: number; text: string }[]>([]);

  useEffect(() => {
    const handleTripReminder = (data: { message: string }) => {
      const id = Date.now();
      setMessages((prev) => [...prev, { id, text: data.message }]);
      
      // Auto dismiss after 10 seconds
      setTimeout(() => {
        setMessages((prev) => prev.filter((msg) => msg.id !== id));
      }, 10000);
    };

    socket.on("trip_reminder", handleTripReminder);
    return () => {
      socket.off("trip_reminder", handleTripReminder);
    };
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className="bg-app-card border border-app-am shadow-2xl rounded-2xl p-4 flex items-start gap-3 w-80 animate-in slide-in-from-right-8 fade-in duration-300"
        >
          <div className="w-10 h-10 rounded-full bg-app-am/20 flex items-center justify-center shrink-0 text-app-am">
            <Ic.Bell size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-[12px] font-black uppercase tracking-widest text-app-tx mb-1">Reminder</h4>
            <p className="text-[11px] text-app-mu font-medium leading-relaxed">{msg.text}</p>
          </div>
          <button 
            onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
            className="text-app-mu hover:text-app-tx transition-colors p-1"
          >
            <Ic.X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
