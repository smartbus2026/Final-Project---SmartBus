import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Theme } from "../types";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

interface Props {
  theme: Theme;
  setTheme: () => void;
  role: "student" | "admin" | null;
  onLogout: () => void;
}

export default function AppLayout({ theme, setTheme, role, onLogout }: Props) {
  const [sbOpen, setSbOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const effectiveRole = location.pathname.startsWith("/admin") ? "admin" : (role ?? "student");

  const handleLogout = () => {
    onLogout();
    navigate("/welcome", { replace: true });
  };

  return (
    <div className={`${theme === "dark" ? "dark" : ""} min-h-screen`}>
      <div className="flex h-screen overflow-hidden bg-app-bg text-app-tx transition-colors duration-300">
        
        <Sidebar 
          open={sbOpen} 
          setOpen={setSbOpen}
          role={effectiveRole}
          onLogout={handleLogout}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar 
            theme={theme} 
            setTheme={setTheme}
            onMenu={() => setSbOpen(true)}
            role={effectiveRole}
          />          
          <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-app-bd scrollbar-track-transparent">
            <Outlet />
          </main>
        </div>

      </div>
    </div>
  );
}