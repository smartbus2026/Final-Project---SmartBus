import { useState } from "react";
import type { Theme } from "../types";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";

interface Props {
  theme: Theme;
  setTheme: (t: Theme) => void;
  children: React.ReactNode;
}

export default function AppLayout({ theme, setTheme }: Props) {
  const [sbOpen, setSbOpen] = useState(false);


  return (
    <div className={`${theme === "dark" ? "dark" : ""} min-h-screen`}>
      <div className="flex h-screen overflow-hidden bg-app-bg text-app-tx transition-colors duration-300">
        
        {/* Sidebar */}
          <Sidebar 
          open={sbOpen} 
          setOpen={setSbOpen} 
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <Topbar 
            theme={theme} 
            setTheme={setTheme} 
            onMenu={() => setSbOpen(true)} 
          />          
          {/* Main Content Area (PC Container) */}
          <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-app-bd scrollbar-track-transparent">
              <Outlet />
          </main>
        </div>

      </div>
    </div>
  );
}