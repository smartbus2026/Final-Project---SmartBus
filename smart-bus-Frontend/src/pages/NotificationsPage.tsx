import { NOTIFS } from "../data"; 
import { Ic } from "../icons";

export default function NotificationsPage() {
  return (
    <div className="p-6">
      
      <div className="mx-auto max-w-[800px] space-y-3">
        
        {NOTIFS.map((n) => (
          <div 
            key={n.id} 
            className="group flex items-start gap-4 rounded-2xl border border-app-bd bg-app-card p-4 transition-all hover:border-app-am-g hover:bg-app-card2/50"
          >
            {/* Notification Icon Wrapper */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-am-d text-app-am shadow-sm transition-transform group-hover:scale-105">
              <Ic.Bell  />
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
              {/* Header Row: Title + Target Badge */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate font-syne text-[13.5px] font-bold text-app-tx leading-tight">
                    {n.title}
                  </h3>
                  <div className="mt-0.5 text-[10px] font-medium text-app-mu2">
                    {n.time}
                  </div>
                </div>
                
                <span className="shrink-0 rounded-md bg-app-bd2 px-2 py-0.5 text-[9px] font-bold text-app-mu uppercase tracking-wider">
                  {n.target}
                </span>
              </div>

              {/* Message Body */}
              <p className="mt-2 text-[12.5px] leading-relaxed text-app-mu">
                {n.message}
              </p>

              {/* Footer Row: Read Count / Status */}
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-app-ok">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500/10">
                  <Ic.Check  />
                </div>
                <span>Read by {n.readCount} users</span>
              </div>
            </div>

            {/* Optional: Hover Action Indicator */}
            <div className="hidden self-center text-app-bd group-hover:block transition-all">
               <Ic.ChevDown  />
            </div>
          </div>
        ))}

        {/* Empty State Handler */}
        {NOTIFS.length === 0 && (
          <div className="flex flex-col items-center py-20 opacity-30 text-center">
            <Ic.Bell />
            <p className="font-syne font-bold">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}