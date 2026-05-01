import { NavLink } from "react-router-dom";
import { Ic } from "../icons";

interface Props {  
  open: boolean; 
  setOpen: (v: boolean) => void;
  role: "student" | "admin" | null;
  onLogout: () => void;
}

const STUDENT_NAV = [
  { id: "dashboard",     path: "/dashboard",      label: "Dashboard",      icon: <Ic.Grid /> },
  { id: "bookTrip",       path: "/book-trip",       label: "Book Trip",      icon: <Ic.Calendar /> },
  { id: "myTrips",        path: "/my-trips",        label: "My Trips",       icon: <Ic.Route /> },
  { id: "routeDetails",   path: "/route-details",   label: "Route Details",  icon: <Ic.Map /> },
  { id: "trackBus",       path: "/track-bus",       label: "Track Bus",      icon: <Ic.Target /> },
  { id: "attendance",     path: "/attendance",     label: "Attendance",     icon: <Ic.Chart /> },
  { id: "notifications",  path: "/notifications",   label: "Notifications",  icon: <Ic.Bell /> },
  // مربوط بصفحة الشات المباشر اللي عملناها
  { id: "routeChat",      path: "/route-chat",      label: "Live Chat",      icon: <Ic.Chat /> }, 
];

const ADMIN_NAV = [
  { id: "dashboard",      path: "/admin/dashboard",     label: "Dashboard",          icon: <Ic.Grid /> },
  { id: "createTrip",     path: "/admin/create-trip",   label: "Create Trip",        icon: <Ic.Plus /> },
  { id: "users",           path: "/admin/users",         label: "Users Management",  icon: <Ic.Users /> },
  { id: "routes",          path: "/admin/routes",        label: "Manage Routes",      icon: <Ic.Route /> },
  { id: "manageTrips",     path: "/admin/trips",         label: "Manage Trips",       icon: <Ic.Route /> },
  { id: "liveTracking",    path: "/admin/live-tracking", label: "Live Tracking",      icon: <Ic.Target /> },
  { id: "notifications",   path: "/admin/notifications", label: "Notifications",      icon: <Ic.Bell /> },
  { id: "support",         path: "/admin/support",       label: "Support Inbox",      icon: <Ic.Chat /> },
  { id: "reports",         path: "/admin/reports",       label: "System Reports",     icon: <Ic.Chart /> },
  // مربوط بصفحة الـ ASettings الجديدة
  { id: "settings",        path: "/admin/settings",      label: "Settings",           icon: <Ic.Gear /> }, 
];

export default function Sidebar({ open, setOpen, role, onLogout }: Props) {

  const NAV = role === "admin" ? ADMIN_NAV : STUDENT_NAV;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-all duration-500 lg:hidden 
        ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} 
        onClick={() => setOpen(false)}
      />

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-68 transform border-r border-app-bd/50 bg-app-card transition-all duration-500 ease-in-out lg:relative lg:translate-x-0
        ${open ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
        
        {/* Logo Section */}
        <div className="flex h-20 items-center px-7 border-b border-app-bd/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-app-am text-white shadow-lg shadow-app-am/20">
              <Ic.Bus />
            </div>
            <h1 className="font-syne text-lg font-black tracking-tighter text-app-tx uppercase">
              Smart<span className="text-app-am">Bus</span>
              {role === "admin" && (
                <span className="text-[8px] bg-app-am/10 text-app-am px-1.5 py-0.5 rounded-md ml-2 border border-app-am/20 font-black">
                  ADMIN
                </span>
              )}
            </h1>
          </div>
        </div>

        <div className="flex h-[calc(100%-5rem)] flex-col justify-between px-4 pb-8 overflow-y-auto no-scrollbar">
          
          <div className="mt-8">
            <p className="mb-4 px-4 text-[9px] font-black uppercase tracking-[0.3em] text-app-mu2 opacity-60">
              {role === "admin" ? "Operational Command" : "Student Menu"}
            </p>
            
            <nav className="space-y-1.5">
              {NAV.map((n) => (
                <NavLink 
                  key={n.id} 
                  to={n.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative
                    ${isActive 
                      ? "bg-app-am/10 text-app-am font-bold"
                      : "text-app-mu hover:text-app-tx hover:bg-app-card2/60"}
                  `}
                  onClick={() => setOpen(false)}
                >
                  <span className="absolute left-0 w-1 h-5 bg-app-am rounded-r-full scale-0 transition-transform duration-300 group-[.active]:scale-100" />
                  <span className="transition-colors duration-300 group-[.active]:text-app-am">
                    {n.icon}
                  </span>
                  <span className="text-[13px] font-bold tracking-tight">{n.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="mt-auto space-y-1.5 border-t border-app-bd/40 pt-6">
            
            {/* إظهار الروابط السفلية للطلاب فقط لأن الإدمن عنده إعداداته الخاصة فوق */}
            {role !== "admin" && (
              <>
                <NavLink 
                  to="/support" 
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300
                    ${isActive ? "bg-app-card2 text-app-am font-bold" : "text-app-mu hover:text-app-tx hover:bg-app-card2/50"}`}
                  onClick={() => setOpen(false)}
                >
                  <Ic.Help />
                  <span className="text-[13px] font-bold">Support Center</span>
                </NavLink>

                <NavLink 
                  to="/settings"
                  className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300
                    ${isActive ? "bg-app-card2 text-app-am font-bold" : "text-app-mu hover:text-app-tx hover:bg-app-card2/50"}`}
                  onClick={() => setOpen(false)}
                >
                  <Ic.Gear />
                  <span className="text-[13px] font-bold">Profile Settings</span>
                </NavLink>
              </>
            )}

            <button 
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="group mt-4 flex w-full cursor-pointer items-center gap-3 px-4 py-4 rounded-2xl text-app-mu transition-all duration-300 hover:bg-app-err/10 hover:text-app-err"
            >
              <span className="group-hover:rotate-12 transition-transform duration-300">
                <Ic.Logout />
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest">Sign Out</span>
            </button>

          </div>
        </div>
      </aside>
    </>
  );
}