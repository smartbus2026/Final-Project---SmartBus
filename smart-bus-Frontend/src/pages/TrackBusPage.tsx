import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Loader2, MapPin } from 'lucide-react';

// تأكدي إن ده رابط الباك إند بتاعك
const socket = io("http://localhost:5001"); 

export default function TrackBusPage() {
  // للتبسيط: هنفترض إن الـ ID ثابت دلوقتي، بعدين تقدري تاخديه من الـ URL (useParams)
  const tripId = "trip_123"; 
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // الطالب بيدخل الـ Room بتاعت الرحلة
    socket.emit("join-trip-room", tripId);

    return () => {
      socket.emit("leave-trip-room", tripId);
      socket.disconnect();
    };
  }, [tripId]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsTracking(true);
    
    // سحب اللوكيشن لايف
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Sending:", latitude, longitude);
        
        socket.emit("send-live-location", {
          tripId,
          lat: latitude,
          lng: longitude,
        });
      },
      (err) => {
        setError(err.message);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
          <MapPin size={32} />
        </div>
        <h1 className="text-xl font-black text-white uppercase tracking-widest mb-2">Live Emitter</h1>
        <p className="text-xs font-semibold text-zinc-500 uppercase mb-8">Trip: {tripId}</p>

        {error && <p className="text-red-500 text-xs font-bold mb-4">{error}</p>}

        <button
          onClick={startTracking}
          disabled={isTracking}
          className="w-full bg-amber-500 text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isTracking ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Transmitting...
            </>
          ) : (
            "Start Tracking"
          )}
        </button>
      </div>
    </div>
  );
}