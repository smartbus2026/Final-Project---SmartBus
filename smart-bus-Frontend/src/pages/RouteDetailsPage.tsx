import { ROUTES } from "../data"; 
// import { Ic } from "../icons";

export default function RouteDetailsPage() {
  return (
    <div className="p-6">
      {/* Grid container with auto-fill for responsiveness */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-4">
        {ROUTES.map((r) => (
          <div 
            key={r.name} 
            className="group flex flex-col rounded-2xl border border-app-bd bg-app-card p-5 transition-all hover:border-app-am-g hover:shadow-xl hover:shadow-app-am-d/10"
          >
            {/* Header: Route Name & Bus ID */}
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-syne text-[14px] font-extrabold text-app-tx group-hover:text-app-am transition-colors">
                {r.name}
              </h3>
              <span className="rounded-md bg-app-am-d px-2 py-0.5 text-[9px] font-bold text-app-am uppercase tracking-wider border border-app-am-g">
                {r.bus}
              </span>
            </div>

            {/* Route Timeline */}
            <div className="flex-1 space-y-0">
              {r.stops.map((stop, i) => {
                const isFirst = i === 0;
                const isLast = i === r.stops.length - 1;
                const isEnd = isFirst || isLast;

                return (
                  <div key={stop} className="flex gap-3.5">
                    {/* Visual Line & Dot */}
                    <div className="flex flex-col items-center">
                      <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full transition-all
                        ${isEnd 
                          ? "bg-app-am scale-110 shadow-[0_0_8px_var(--am-g)]" 
                          : "border-2 border-app-mu bg-app-card2"}`} 
                      />
                      {!isLast && (
                        <div className="h-6 w-[1.5px] bg-linear-to-b from-app-bd to-transparent" />
                      )}
                    </div>

                    {/* Stop Name */}
                    <div className={`text-[12px] transition-colors leading-tight
                      ${isEnd ? "font-bold text-app-tx" : "font-medium text-app-mu"}
                      ${!isLast ? "pb-5" : "pb-1"}`}
                    >
                      {stop}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer: Driver & Time Info */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-app-bd2 bg-app-card2 px-3 py-2.5 transition-colors group-hover:bg-app-bg">
                <div className="mb-1 text-[8px] font-bold uppercase tracking-widest text-app-mu">Driver</div>
                <div className="flex items-center gap-1.5 font-dm text-[11px] font-bold text-app-tx">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {r.driver}
                </div>
              </div>

              <div className="rounded-xl border border-app-bd2 bg-app-card2 px-3 py-2.5 transition-colors group-hover:bg-app-bg">
                <div className="mb-1 text-[8px] font-bold uppercase tracking-widest text-app-mu text-right">Departure</div>
                <div className="text-right font-dm text-[12px] font-extrabold text-app-am tracking-tight">
                  {r.time}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}