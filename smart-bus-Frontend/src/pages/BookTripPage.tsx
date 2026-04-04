import { useState } from "react";
import { Ic } from "../icons";

export default function BookTripPage() {
  const [selectedPickup, setSelectedPickup] = useState("");
  const [selectedReturn, setSelectedReturn] = useState("");
  const timeLeft = "01h 49m";

  const pickupPoints = ["Aqaleem Gate", "Seil", "Stadium Gate"];
  const returnTimes = ["3:30 PM", "7:00 PM"];

  return (
    <div className="p-6 space-y-6 max-w-4xl animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black font-syne text-app-tx uppercase tracking-tighter">
          Book <span className="text-app-am">Trip</span>
        </h1>
        <p className="text-xs text-app-mu font-medium">Reserve your seat for tomorrow's morning trip</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          {/* Booking Window Card */}
          <div className="bg-app-card rounded-[24px] p-6 border border-app-bd shadow-xl relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-app-am/5 rounded-full blur-3xl transition-colors"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-2 text-app-am text-[11px] font-black uppercase tracking-widest">
                <Ic.Calendar /> Booking Window
              </div>
              <span className="bg-green-500/10 text-app-ok px-3 py-1 rounded-full text-[9px] border border-green-500/20 font-black animate-pulse">
                OPEN
              </span>
            </div>

            <div className="flex justify-between items-end mb-3 relative z-10">
              <span className="text-app-mu text-[10px] font-bold uppercase tracking-tight">Time remaining</span>
              <span className="text-app-am font-syne font-black text-3xl tracking-tighter">{timeLeft}</span>
            </div>

            <div className="w-full bg-app-card2 h-2 rounded-full overflow-hidden shadow-inner">
              <div className="bg-app-am h-full rounded-full w-[65%]"></div>
            </div>
          </div>

          {/* Seat Availability Card - تم استبدال Ic.Users بـ Ic.User */}
          <div className="bg-app-card rounded-[24px] p-6 border border-app-bd shadow-xl group">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2 text-app-mu text-[11px] font-black uppercase tracking-widest">
                <Ic.User /> Seat Availability
              </div>
              <span className="text-app-tx text-xs font-black">
                13 <span className="text-app-mu font-medium">/ 45 left</span>
              </span>
            </div>
            <div className="w-full bg-app-card2 h-2.5 rounded-full overflow-hidden mb-3">
              <div className="bg-app-am h-full w-[71%] rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pickup Selection */}
          <div className="bg-app-card rounded-[24px] p-6 border border-app-bd shadow-xl">
            <div className="flex items-center gap-2 text-app-am text-[11px] font-black uppercase tracking-widest mb-6">
              <Ic.Pin /> Select Pickup Point
            </div>
            <div className="grid gap-3">
              {pickupPoints.map((point) => (
                <button
                  key={point}
                  onClick={() => setSelectedPickup(point)}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-300 font-bold text-sm flex justify-between items-center
                    ${selectedPickup === point 
                      ? "bg-app-am/10 border-app-am text-app-am shadow-lg" 
                      : "bg-app-card2 border-app-bd text-app-mu hover:border-app-am/50 hover:text-app-tx"}`}
                >
                  {point}
                  {selectedPickup === point && <Ic.Check />}
                </button>
              ))}
            </div>
          </div>

          {/* Return Selection */}
          <div className="bg-app-card rounded-[24px] p-6 border border-app-bd shadow-xl">
            <div className="flex items-center gap-2 text-app-tx text-[11px] font-black uppercase tracking-widest mb-6">
              <Ic.Calendar /> Select Return Time
            </div>
            <div className="grid grid-cols-2 gap-4">
              {returnTimes.map((time) => (
                <button
                  key={time}
                  onClick={() => setSelectedReturn(time)}
                  className={`py-4 rounded-xl border font-syne font-black text-center transition-all duration-300 text-sm
                    ${selectedReturn === time 
                      ? "bg-app-am border-app-am text-black shadow-lg" 
                      : "bg-app-card2 border-app-bd text-app-mu hover:border-app-am/50 hover:text-app-tx"}`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Button - تم استبدال Ic.CheckCircle بـ Ic.Bus */}
      <button 
        disabled={!selectedPickup || !selectedReturn}
        className={`w-full py-5 rounded-[24px] font-syne font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all duration-500
          ${(selectedPickup && selectedReturn)
            ? "bg-app-am text-black cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
            : "bg-app-card2 border border-app-bd text-app-mu2 cursor-not-allowed opacity-50"}`}
      >
        <Ic.Bus />
        Confirm Booking
      </button>

    </div>
  );
}