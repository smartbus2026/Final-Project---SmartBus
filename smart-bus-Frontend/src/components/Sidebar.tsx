import { NavLink } from "react-router-dom";
import { Ic } from "../icons";

interface Props {  
  open: boolean; 
  setOpen: (v: boolean) => void;
  role: "student" | "admin" | null;
  onLogout: () => void;
}

const STUDENT_NAV = [
  { id: "dashboard",      path: "/dashboard",      label: "Dashboard",     icon: <Ic.Grid /> },
  { id: "bookTrip",       path: "/book-trip",       label: "Book Trip",     icon: <Ic.Calendar /> },
  { id: "myTrips",        path: "/my-trips",        label: "My Trips",      icon: <Ic.Route /> },
  { id: "routeDetails",   path: "/route-details",   label: "Route Details", icon: <Ic.Map /> },
  { id: "trackBus",       path: "/track-bus",       label: "Track Bus",     icon: <Ic.Target /> },
  { id: "attendance",     path: "/attendance",      label: "Attendance",    icon: <Ic.Chart /> },
  { id: "notifications",  path: "/notifications",   label: "Notifications", icon: <Ic.Bell /> },
  { id: "routeChat",      path: "/route-chat",      label: "Route Chat",    icon: <Ic.Chat /> },
];

const ADMIN_NAV = [
  { id: "dashboard",      path: "/admin/dashboard",     label: "Dashboard",        icon: <Ic.Grid /> },
  { id: "users",          path: "/admin/users",         label: "Users Management", icon: <Ic.Users /> },
  { id: "routes",         path: "/admin/routes",        label: "Manage Routes",    icon: <Ic.Route /> },
  { id: "liveTracking",   path: "/admin/trips",         label: "Live Tracking",    icon: <Ic.Target /> },
  { id: "notifications",  path: "/admin/notifications", label: "Notifications",    icon: <Ic.Bell /> },
  { id: "reports",        path: "/admin/reports",       label: "System Reports",   icon: <Ic.Chart /> },
  { id: "settings",       path: "/admin/settings",      label: "Settings",         icon: <Ic.Gear /> },
];

export default function Sidebar({ open, setOpen, role, onLogout }: Props) {

  const NAV = role === "admin" ? ADMIN_NAV : STUDENT_NAV;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px] transition-all duration-500 lg:hidden 
        ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} 
        onClick={() => setOpen(false)}
      />

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-68 transform border-r border-app-bd/50 bg-app-card transition-all duration-500 lg:relative lg:translate-x-0
        ${open ? "translate-x-0 shadow-xl" : "-translate-x-full"}
      `}>
        
        {/* Logo */}
        <div className="flex h-20 items-center px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-tx text-app-card">
              <Ic.Bus />
            </div>
            <h1 className="font-syne text-lg font-bold tracking-tight text-app-tx">
              Smart<span className="text-app-am">Bus</span>
              {role === "admin" && (
                <span className="text-[10px] bg-app-am/10 text-app-am px-1.5 py-0.5 rounded ml-2">
                  ADMIN
                </span>
              )}
            </h1>
          </div>
        </div>

        <div className="flex h-[calc(100%-5rem)] flex-col justify-between px-4 pb-8">
          
          {/* Main Nav */}
          <div className="mt-6">
            <p className="mb-4 px-4 text-[9px] font-bold uppercase tracking-[0.3em] text-app-mu2">
              {role === "admin" ? "Admin Panel" : "Menu"}
            </p>
            
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

          {/* Bottom Actions — student only extras */}
          <div className="mt-auto space-y-1 border-t border-app-bd/40 pt-6">
            
            {role !== "admin" && (
              <>
                <NavLink 
                  to="/support" 
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                    ${isActive ? "bg-app-card2 text-app-am font-bold" : "text-app-mu hover:text-app-tx hover:bg-app-card2/50"}`}
                  onClick={() => setOpen(false)}
                >
                  <Ic.Help />
                  <span className="text-[13px]">Support</span>
                </NavLink>

                <NavLink 
                  to="/settings"
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                    ${isActive ? "bg-app-card2 text-app-am font-bold" : "text-app-mu hover:text-app-tx hover:bg-app-card2/50"}`}
                  onClick={() => setOpen(false)}
                >
                  <Ic.Gear />
                  <span className="text-[13px]">Settings</span>
                </NavLink>
              </>
            )}

            <button 
              onClick={onLogout}
              className="mt-4 flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-app-mu transition-colors hover:text-red-500"
            >
              <Ic.Logout />
              <span className="text-[12px] font-bold uppercase tracking-wider">Sign Out</span>
            </button>

          </div>
        </div>
      </aside>
    </>
  );
}