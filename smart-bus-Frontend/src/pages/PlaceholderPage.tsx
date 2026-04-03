import { Ic } from "../icons";

export default function PlaceholderPage({ label }: { label: string }) {
  return (
    <div className="flex min-h-[450px] flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
      
      {/* Icon Wrapper with Animated Border */}
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
        {/* The Dashed Circle/Square Background */}
        <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-2xl border-2 border-dashed border-app-mu2/30" />
        
        {/* The Icon */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-app-card2 text-app-mu2 shadow-inner">
          <Ic.Grid  />
        </div>
      </div>

      {/* Text Content */}
      <div className="max-w-[280px] space-y-2">
        <h2 className="font-syne text-2xl font-extrabold tracking-tight text-app-tx uppercase">
          {label}
        </h2>
        <p className="text-[13px] font-medium leading-relaxed text-app-mu2 italic">
          We're currently fine-tuning this feature.<br/>
          It'll be ready for your next trip soon.
        </p>
      </div>

      {/* Decorative Dots */}
      <div className="mt-8 flex gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-app-am/40 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-app-am/40 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-app-am/40 animate-bounce" />
      </div>

    </div>
  );
}