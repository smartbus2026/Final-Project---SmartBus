import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const Chatbot = () => {
    const { t } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, loading]);

    const sendMessage = async () => {
        if (!message.trim()) return;
        const token = localStorage.getItem('token');
        const userMsg = { role: 'user' as const, content: message };

        setChatHistory(prev => [...prev, userMsg]);
        setMessage('');
        setLoading(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api'}/ai/chat`,
                { message: userMsg.content },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: response.data.reply || response.data.message || 'Done'
            }]);
        } catch (error) {
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: t('chatbot_error')
            }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isMounted) return null;
    const token = localStorage.getItem('token');
    if (!token) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[10000] font-sans antialiased">
            {/* Floating Button with Pulse Effect */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative w-14 h-14 flex items-center justify-center rounded-2xl shadow-2xl transition-all duration-500 group ${isOpen ? 'bg-zinc-800 rotate-90' : 'bg-app-am hover:scale-110 active:scale-95'
                    }`}
            >
                {/* Pulse Aura (Only when closed) */}
                {!isOpen && (
                    <span className="absolute inset-0 rounded-2xl bg-app-am animate-ping opacity-10"></span>
                )}

                {isOpen ? (
                    <span className="text-white text-2xl">✕</span>
                ) : (
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <rect x="3" y="11" width="18" height="10" rx="2" />
                        <circle cx="12" cy="5" r="2" />
                        <path d="M12 7v4" />
                        <line x1="8" y1="16" x2="8" y2="16" />
                        <line x1="16" y1="16" x2="16" y2="16" />
                    </svg>
                )}
            </button>

            {/* Main Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[550px] flex flex-col 
                                bg-app-card/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] 
                                overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-300 origin-bottom-right">

                    {/* Header - Glassmorphism style */}
                    <div className="relative p-5 bg-gradient-to-br from-app-am/90 to-app-am/40 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-black font-black text-xl tracking-tight leading-none">{t('chatbot_title')}</h3>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-[10px] text-black/70 font-bold uppercase tracking-widest">{t('chatbot_operational')}</span>
                                </div>
                            </div>
                            <div className="bg-black/10 px-3 py-1.5 rounded-xl border border-black/5 text-center">
                                <span className="block text-[8px] text-black/50 font-black uppercase leading-none mb-0.5 text-left">{t('chatbot_reg_window')}</span>
                                <span className="text-[10px] text-black font-black whitespace-nowrap uppercase tracking-tighter">12:00 AM – 2:00 PM</span>
                            </div>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-transparent to-black/20 custom-scrollbar space-y-4 no-scrollbar">
                        {chatHistory.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 grayscale-[0.5]">
                                <div className="w-20 h-20 bg-app-am/10 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-5xl">🚌</span>
                                </div>
                                <p className="text-[11px] font-black text-app-tx uppercase tracking-[0.2em] text-center px-10 leading-relaxed">
                                    {t('chatbot_ready')}
                                </p>
                            </div>
                        )}

                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                <div className={`whitespace-pre-wrap max-w-[85%] px-4 py-3 rounded-[20px] text-[13px] font-medium leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-app-am text-black rounded-tr-none font-bold'
                                    : 'bg-app-card2/80 text-app-tx border border-white/5 rounded-tl-none'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-app-card2/50 border border-white/5 px-4 py-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-app-am rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-app-am rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-app-am rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    </div>
                                    <span className="text-[10px] text-app-mu font-black uppercase tracking-widest">{t('chatbot_calculating')}</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer / Input */}
                    <div className="p-4 bg-app-card border-t border-white/5">
                        <div className="relative group flex items-center">
                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder={t('chatbot_placeholder')}
                                className="w-full bg-app-card2/50 border border-white/10 px-5 py-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-app-am/50 focus:border-app-am transition-all text-app-tx placeholder:text-app-mu/50 pr-14"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={loading || !message.trim()}
                                className="absolute right-2 p-2.5 bg-app-am text-black rounded-xl hover:scale-105 active:scale-90 transition-all disabled:opacity-0 disabled:scale-50 shadow-lg"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-center text-[9px] text-app-mu mt-3 font-medium opacity-50 uppercase tracking-tighter">
                            {t('chatbot_powered')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;