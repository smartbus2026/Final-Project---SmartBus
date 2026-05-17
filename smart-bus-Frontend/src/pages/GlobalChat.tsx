import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Api from '../services/Api';
import { Ic } from '../icons';

interface ChatMessage {
  _id: string;
  sender: { _id: string; name: string };
  message: string;
  createdAt: string;
}

const GlobalChat: React.FC<{ currentUserId: string }> = ({ currentUserId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // 1. جلب الرسائل القديمة من الـ الباك إند
    const fetchHistory = async () => {
      try {
        const res = await Api.get(`/chat`);
        setMessages(res.data);
        setTimeout(scrollToBottom, 100);
      } catch (error: any) {
        console.error("Failed to load chat history", error);
      }
    };
    fetchHistory();

    // 2. تفعيل الـ Socket للاستماع العام (Global Broadcast)
    socketRef.current = io("http://localhost:5001", {
      transports: ["websocket", "polling"]
    }); 

    socketRef.current.on("new-message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      setTimeout(scrollToBottom, 100);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage(""); 

    try {
      await Api.post(`/chat`, { message: messageText });
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-app-bg text-app-tx border border-app-bd/50 rounded-3xl overflow-hidden shadow-sm relative transition-colors duration-500 font-sans">
      
      {/* ── Chat Header ── */}
      <div className="bg-app-card border-b border-app-bd/50 px-8 py-5 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-app-am/10 flex items-center justify-center text-app-am border border-app-am/20">
            <Ic.Chat size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-app-tx">Global System Chat</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-app-ok animate-pulse"></span>
              <p className="text-[10px] font-black text-app-ok uppercase tracking-widest">Public Channel</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chat Messages Area ── */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 relative custom-scrollbar">
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%, currentColor), linear-gradient(45deg, currentColor 25%, transparent 25%, transparent 75%, currentColor 75%, currentColor)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}
        />

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
             <Ic.Chat size={40} />
             <p className="text-[10px] font-bold uppercase mt-4 tracking-[0.2em]">Start the conversation</p>
          </div>
        ) : (
          messages.map((msg, index) => {
   
            const isMe = msg.sender._id === currentUserId;
            
            return (
              <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative z-10`}>
                <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  
                  {/* اسم الراسل (يظهر لغير رسايلي بس عشان يبقى زي الواتساب) */}
                  {!isMe && (
                    <span className="text-[9px] font-black text-app-mu mb-1 ml-2 uppercase tracking-widest">
                      {msg.sender.name}
                    </span>
                  )}
                  
                  {/* بابل الرسالة */}
                  <div className={`px-5 py-3 shadow-sm ${
                    isMe 
                      ? 'bg-app-am text-white dark:text-black rounded-[22px] rounded-br-none' // رسايلي على اليمين باللون الأصفر/البرتقالي
                      : 'bg-app-card border border-app-bd/50 text-app-tx rounded-[22px] rounded-bl-none' // رسايلهم على الشمال غامقة
                  }`}>
                    <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                    
                    {/* الوقت وعلامة الصح */}
                    <div className={`flex items-center gap-1.5 mt-1 justify-end ${isMe ? 'text-white/60 dark:text-black/60' : 'text-app-mu'}`}>
                      <span className="text-[8px] font-black">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && <Ic.Check size={10} />}
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Chat Input Area ── */}
      <div className="bg-app-card border-t border-app-bd/50 p-5 z-10">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a public message..."
            className="flex-1 bg-app-bg2 border border-app-bd/50 rounded-2xl px-6 py-4 text-sm font-medium text-app-tx outline-none focus:border-app-am transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-14 h-14 rounded-2xl bg-app-am flex items-center justify-center text-white dark:text-black disabled:opacity-50 hover:brightness-110 transition-all active:scale-95 shadow-md shadow-app-am/20"
          >
            <Ic.Send size={20} />
          </button>
        </form>
      </div>

    </div>
  );
};

export default GlobalChat;