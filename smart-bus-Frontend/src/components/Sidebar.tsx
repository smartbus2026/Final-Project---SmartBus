import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Ic } from "../icons";

interface Props {  
  open: boolean; 
  setOpen: (v: boolean) => void;
  role: "student" | "admin" | "driver" | null;
  onLogout: () => void;
}

const STUDENT_NAV = [
  { id: "dashboard", path: "/dashboard", labelKey: "dashboard", icon: <Ic.Grid /> },
  { id: "bookTrip", path: "/book-trip", labelKey: "nav_bookTrip", icon: <Ic.Calendar /> },
  { id: "myTrips", path: "/my-trips", labelKey: "nav_myTrips", icon: <Ic.Route /> },
  { id: "routeDetails", path: "/route-details", labelKey: "nav_routeDetails", icon: <Ic.Map /> },
  { id: "trackBus", path: "/track-bus", labelKey: "nav_trackBus", icon: <Ic.Target /> },
  { id: "attendance", path: "/attendance", labelKey: "nav_attendance", icon: <Ic.Chart /> },
  { id: "notifications", path: "/notifications", labelKey: "nav_notifications", icon: <Ic.Bell /> },
  { id: "routeChat", path: "/route-chat", labelKey: "nav_liveChat", icon: <Ic.Chat /> },
];

const ADMIN_NAV = [
  { id: "dashboard", path: "/admin/dashboard", labelKey: "dashboard", icon: <Ic.Grid /> },
  { id: "createTrip", path: "/admin/create-trip", labelKey: "nav_createTrip", icon: <Ic.Plus /> },
  { id: "users", path: "/admin/users", labelKey: "nav_users", icon: <Ic.Users /> },
  { id: "routes", path: "/admin/routes", labelKey: "nav_manageRoutes", icon: <Ic.Route /> },
  { id: "manageTrips", path: "/admin/trips", labelKey: "nav_manageTrips", icon: <Ic.Route /> },
  { id: "liveTracking", path: "/admin/live-tracking", labelKey: "nav_liveTracking", icon: <Ic.Target /> },
  { id: "notifications", path: "/admin/notifications", labelKey: "nav_notifications", icon: <Ic.Bell /> },
  { id: "support", path: "/admin/support", labelKey: "nav_supportInbox", icon: <Ic.Chat /> },
];

const ADMIN_BOTTOM = [
  { id: "reports", path: "/admin/reports", labelKey: "nav_systemReports", icon: <Ic.Chart /> },
  { id: "settings", path: "/admin/settings", labelKey: "settings", icon: <Ic.Gear /> },
];

const DRIVER_NAV = [
  { id: "driverDashboard", path: "/driver/dashboard", labelKey: "nav_myTrips", icon: <Ic.Bus /> },
  { id: "liveTracking", path: "/driver/live-tracking", labelKey: "nav_liveTracking", icon: <Ic.Target /> },
  { id: "tripHistory", path: "/driver/history", labelKey: "trip_history", icon: <Ic.Clock /> },
];

const DRIVER_BOTTOM = [
  { id: "settings", path: "/settings", labelKey: "nav_profileSettings", icon: <Ic.Gear /> },
];

const STUDENT_BOTTOM = [
  { id: "support", path: "/support", labelKey: "nav_supportCenter", icon: <Ic.Help /> },
  { id: "settings", path: "/settings", labelKey: "nav_profileSettings", icon: <Ic.Gear /> },
];

export default function Sidebar({ open, setOpen, role, onLogout }: Props) {
  const { t } = useTranslation();

  const NAV = role === "admin" ? ADMIN_NAV : role === "driver" ? DRIVER_NAV : STUDENT_NAV;
  const BOTTOM_NAV  = role === "admin" ? ADMIN_BOTTOM : role === "driver" ? DRIVER_BOTTOM : STUDENT_BOTTOM;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-all duration-500 lg:hidden 
        ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} 
        onClick={() => setOpen(false)}
      />

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-68 flex flex-col border-r border-app-bd/50 bg-app-card transition-all duration-500 ease-in-out lg:relative lg:translate-x-0
        ${open ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}>
        
        {/* Logo */}
        <div className="flex h-20 shrink-0 items-center px-7 border-b border-app-bd/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-app-am text-white shadow-lg shadow-app-am/20">
              <Ic.Bus />
            </div>
            <h1 className="font-syne text-lg font-black tracking-tighter text-app-tx uppercase">
              Smart<span className="text-app-am">Bus</span>
              {role === "admin" && (
                <span className="text-[8px] bg-app-am/10 text-app-am px-1.5 py-0.5 rounded-md ml-2 border border-app-am/20 font-black">
                  {t("badge_admin")}
                </span>
              )}
              {role === "driver" && (
                <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-md ml-2 border border-blue-400/20 font-black">
                  {t("badge_driver")}
                </span>
              )}
            </h1>
          </div>
        </div>

        {/* Scrollable Nav */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-8 pb-4">
          <nav className="space-y-1.5">
            {NAV.map((n) => (
              <NavLink 
                key={n.id} 
                to={n.path}
                end
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
                <span className="text-[13px] font-bold tracking-tight">{t(n.labelKey)}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Fixed Bottom */}
        <div className="shrink-0 px-4 pb-6 border-t border-app-bd/40 pt-4 space-y-1.5">

          {BOTTOM_NAV.map((n) => (
            <NavLink
              key={n.id}
              to={n.path}
              end
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
              <span className="text-[13px] font-bold tracking-tight">{t(n.labelKey)}</span>
            </NavLink>
          ))}

          <button 
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onLogout();
            }}
            className="group mt-2 flex w-full cursor-pointer items-center gap-3 px-4 py-4 rounded-2xl text-app-mu transition-all duration-300 hover:bg-app-err/10 hover:text-app-err"
          >
            <span className="group-hover:rotate-12 transition-transform duration-300">
              <Ic.Logout />
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest">{t("sign_out")}</span>
          </button>
        </div>

      </aside>
    </>
  );
}