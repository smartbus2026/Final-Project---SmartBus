import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import socket from "../services/socket";
import Api from "../services/Api";
import { Ic } from "../icons";

interface Message {
  _id: string;
  roomId: string;
  message: string;
  sender: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export default function GroupChat() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messageLabel, setMessageLabel] = useState("");
  const [roomId, setRoomId] = useState("");
  const [routeName, setRouteName] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [tripId, setTripId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // tripActive: true once the driver starts the trip.
  // Controls whether the chat input is unlocked.
  const [tripActive, setTripActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = localStorage.getItem("userId");

  // ── Fetch chat status on mount ───────────────────────────────────────────────
  useEffect(() => {
    const fetchChatStatus = async () => {
      try {
        const res = await Api.get("/chat/active-group");
        const data = res.data;
        if (data.isOpen) {
          setIsOpen(true);
          setRoomId(data.roomId);
          setRouteName(data.routeName);
          setTimeSlot(data.timeSlot);
          setMessages(data.messages || []);

          // If the API already says the trip is in_progress, unlock immediately
          if (
            data.tripStatus === "in_progress" ||
            data.tripStatus === "in-progress" ||
            data.tripStatus === "active"
          ) {
            setTripActive(true);
          }

          // Store tripId for the socket room subscription
          if (data.tripId) {
            setTripId(data.tripId);
            socket.emit("join_trip_room", data.tripId);
          }

          socket.emit("joinRoom", data.roomId);
        } else {
          setIsOpen(false);
          setMessageLabel(data.message || t("chat_is_closed"));
        }
      } catch (err) {
        console.error("Failed to fetch chat status", err);
        setMessageLabel(t("chat_failed_status"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchChatStatus();

    return () => {
      if (roomId) socket.emit("leaveRoom", roomId);
    };
  }, [t]);

  // ── tripStarted — unlock the chat input when driver starts the trip ──────────
  // Listens globally: if the tripId matches ours, setTripActive(true).
  // If tripId info is unavailable yet, unlock on any tripStarted event
  // (the chat is already gated behind isOpen which requires a valid booking).
  useEffect(() => {
    const handleTripStarted = (payload: { tripId?: string; routeId?: string }) => {
      console.log("[TripChat] tripStarted received:", payload);
      // If we know our tripId, only unlock for the matching trip
      if (tripId && payload.tripId && String(payload.tripId) !== String(tripId)) return;
      setTripActive(true);
    };

    const handleTripStartedLegacy = () => setTripActive(true);

    socket.on("tripStarted", handleTripStarted);
    socket.on("trip_started", handleTripStartedLegacy);

    return () => {
      socket.off("tripStarted", handleTripStarted);
      socket.off("trip_started", handleTripStartedLegacy);
    };
  }, [tripId]);

  // ── New message listener ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleNewMessage = (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    };
    socket.on("newMessage", handleNewMessage);
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [isOpen]);

  // ── Auto-scroll to latest message ───────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId) return;
    try {
      await Api.post(`/chat/${roomId}`, { message: newMessage });
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin text-app-am"><Ic.Loader /></div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-6 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-app-card border border-app-bd rounded-full flex items-center justify-center text-app-mu mb-6 shadow-inner">
          <Ic.Clock size={40} />
        </div>
        <h2 className="font-syne text-2xl font-black text-app-tx tracking-tight mb-2 uppercase">
          {t("chat_window_closed")}
        </h2>
        <p className="text-sm font-bold text-app-mu uppercase tracking-widest max-w-sm leading-relaxed">
          {messageLabel || t("chat_is_closed")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-app-bg animate-in fade-in duration-500">
      {/* Chat Header */}
      <div className="bg-app-card border-b border-app-bd px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
        <div>
          <h2 className="font-syne text-lg font-black text-app-tx tracking-tight">{t("route_group_chat")}</h2>
          <div className="flex items-center gap-2 text-[10px] font-bold text-app-mu mt-1 uppercase tracking-widest">
            <span className="text-app-am flex items-center gap-1"><Ic.Pin size={10}/> {routeName}</span>
            <span>•</span>
            <span>{timeSlot} {t("chat_wave")}</span>
          </div>
        </div>

        {/* Live / Awaiting badge — driven by tripActive state */}
        {tripActive ? (
          <div className="flex items-center gap-2 bg-app-ok/10 border border-app-ok/20 text-app-ok px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-app-ok animate-pulse" />
            {t("live")}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-app-am/10 border border-app-am/20 text-app-am px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
            <Ic.Clock size={10} />
            {t("awaiting_trip_start") || "Awaiting Start"}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar no-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40 text-center">
            <div className="w-16 h-16 bg-app-card2 rounded-full flex items-center justify-center text-app-mu mb-4 shadow-inner">
              <Ic.Send size={24} />
            </div>
            <p className="text-xs font-bold text-app-tx uppercase tracking-widest">{t("no_messages_yet")}</p>
            <p className="text-[10px] text-app-mu mt-1">{t("be_first_hello")}</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender._id === currentUserId;
            return (
              <div key={m._id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2`}>
                <div className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                  isMe ? "bg-app-am text-black rounded-br-sm" : "bg-app-card border border-app-bd text-app-tx rounded-bl-sm"
                }`}>
                  {!isMe && (
                    <div className="text-[10px] font-black opacity-50 mb-1 uppercase tracking-wider">
                      {m.sender.name}
                    </div>
                  )}
                  <p className="text-sm font-medium leading-relaxed">{m.message}</p>
                  <div className={`text-[9px] font-bold mt-2 text-right ${isMe ? "text-black/60" : "text-app-mu"}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area — locked until trip is active */}
      <div className="bg-app-card border-t border-app-bd p-4 shrink-0">
        {/* Lock notice: shown until driver taps Start Trip */}
        {!tripActive && (
          <div className="max-w-4xl mx-auto mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-app-am/5 border border-app-am/20">
            <Ic.Clock size={13} className="text-app-am shrink-0" />
            <p className="text-[10px] font-bold text-app-am uppercase tracking-widest">
              {t("chat_unlocks_on_trip_start") || "Chat unlocks when the driver starts the trip"}
            </p>
          </div>
        )}
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!tripActive}
            placeholder={
              tripActive
                ? t("type_message_placeholder")
                : (t("chat_locked_placeholder") || "Waiting for trip to start…")
            }
            className={`flex-1 bg-app-card2 border rounded-xl px-5 py-4 text-sm font-medium text-app-tx outline-none transition-all placeholder:opacity-40 ${
              tripActive
                ? "border-app-bd focus:border-app-am/50 cursor-text"
                : "border-app-bd/30 opacity-40 cursor-not-allowed"
            }`}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !tripActive}
            className="bg-app-am hover:brightness-110 text-black px-6 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-app-am/10"
          >
            {t("send")} <Ic.Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}