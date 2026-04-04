import { NavLink } from "react-router-dom";
import { Ic } from "../icons";

interface Props {  
  open: boolean; 
  setOpen: (v: boolean) => void; 
}

const NAV = [
  {id:"dashboard", path:"/dashboard", label:"Dashboard", icon:<Ic.Grid/>},
  {id:"bookTrip", path:"/book-trip", label:"Book Trip", icon:<Ic.Calendar/>},
  {id:"myTrips", path:"/my-trips", label:"My Trips", icon:<Ic.Route/>},
  {id:"routeDetails", path:"/route-details", label:"Route Details", icon:<Ic.Map/>},
  {id:"trackBus", path:"/track-bus", label:"Track Bus", icon:<Ic.Target/>},
  {id:"attendance", path:"/attendance", label:"Attendance", icon:<Ic.Chart/>},
  {id:"notifications", path:"/notifications", label:"Notifications", icon:<Ic.Bell/>},
  {id:"routeChat", path:"/route-chat", label:"Route Chat", icon:<Ic.Chat/>},
] as const;

export default function Sidebar({ open, setOpen }: Props) {

  const navItemClass = ({ isActive }: { isActive: boolean }) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
    ${isActive 
      ? "bg-app-am text-white shadow-[0_8px_20px_var(--am-g)] scale-[1.02]" 
      : "text-app-mu hover:bg-app-card2 hover:text-app-tx dark:hover:bg-white/5"}
  `;

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px] transition-all duration-500 lg:hidden 
        ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} 
        onClick={() => setOpen(false)}
      />

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-68 transform border-r border-app-bd/50 bg-app-card transition-all duration-500 lg:relative lg:translate-x-0
        ${open ? "translate-x-0 shadow-xl" : "-translate-x-full"}
      `}>
        
        <div className="flex h-20 items-center px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-tx text-app-card">
              <Ic.Bus  />
            </div>
            <h1 className="font-syne text-lg font-bold tracking-tight text-app-tx">
              Smart<span className="text-app-am">Bus</span>
            </h1>
          </div>
        </div>

        <div className="flex h-[calc(100%-5rem)] flex-col justify-between px-4 pb-8">
          
          <div className="mt-6">
            <p className="mb-4 px-4 text-[9px] font-bold uppercase tracking-[0.3em] text-app-mu2">Menu</p>
            
            <nav className="space-y-1">
              {NAV.map((n) => (
                <NavLink 
                  key={n.id} 
                  to={n.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? "bg-app-card2 text-app-am font-bold"
                      : "text-app-mu hover:text-app-tx hover:bg-app-card2/50"}
                  `}
                  onClick={() => setOpen(false)}
                >
                  <span className="opacity-70 group-[.active]:opacity-100">{n.icon}</span>
                  <span className="text-[13px] tracking-wide">{n.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="mt-auto space-y-1 border-t border-app-bd/40 pt-6">
            <NavLink to="/support" className={navItemClass} onClick={() => setOpen(false)}>
              <Ic.Help  />
              <span className="text-[13px]">Support</span>
            </NavLink>
            
            <NavLink to="/settings" className={navItemClass} onClick={() => setOpen(false)}>
              <Ic.Gear  />
              <span className="text-[13px]">Settings</span>
            </NavLink>
            
            <button className="mt-4 flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-app-mu transition-colors hover:text-red-500">
              <Ic.Logout  />
              <span className="text-[12px] font-bold uppercase tracking-wider">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}