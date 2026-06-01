import { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import MyTripsPage from "./pages/MyTripsPage";
import RouteDetailsPage from "./pages/RouteDetailsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SupportPage from "./pages/SupportPage";
import ProfilePage from "./pages/ProfilePage";
import AttendancePage from "./pages/AttendancePage";
import TripChat from "./pages/TripChat";
import PlaceholderPage from "./pages/PlaceholderPage";
import WelcomePage from "./pages/WelcomePage";
import Login from "./pages/Login";
import TrackBusPage from "./pages/TrackBusPage";
import BookTripPage from "./pages/BookTripPage";
import DriverLayout from "./pages/DriverLayout";
import DriverTrips from "./pages/DriverTrips";
import DriverLiveTracking from "./pages/DriverLiveTracking";

// --- Admin Pages ---
import AdminDashboard from "./admin-pages/ADashboard";
import CreateTripPage from "./admin-pages/CreateTripPage";
import AdminNotifications from "./admin-pages/ANotifications";
import ManageRoutes from "./admin-pages/ManageRoutes";
import UsersPage from "./admin-pages/Users";
import TripsPage from "./admin-pages/Trips";
import LiveTrackingPage from "./admin-pages/LiveTracking";
import AdminReports from "./admin-pages/AReports";
import ASupport from "./admin-pages/ASupport";
import SettingsPage from "./admin-pages/SettingsPage";
import StudentSettingsPage from "./pages/SettingsPage";
import AdminProfilePage from "./admin-pages/AdminProfilePage";
import StudentProfile from "./admin-pages/StudentProfile";

import Chatbot from "./components/Chatbot";

// --- Types ---
type Role = "student" | "admin" | "driver" | null;
type Theme = "dark" | "light";

// --- Route Guard ---
interface GuardProps {
  role: Role;
  allowed: Role[];
  redirectTo: string;
  children: React.ReactNode;
}

const Guard = ({ role, allowed, redirectTo, children }: GuardProps) =>
  allowed.includes(role) ? <>{children}</> : <Navigate to={redirectTo} replace />;

// --- App ---
export default function App() {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem("theme") as Theme) ?? "dark"
  );

  const [role, setRole] = useState<Role>(() =>
    (localStorage.getItem("role") as Role) ?? null
  );

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      return next;
    });
  }, []);

  const handleSetRole = useCallback((r: Role) => {
    setRole(r);
    if (r) {
      localStorage.setItem("role", r);
    } else {
      localStorage.removeItem("role");
      localStorage.removeItem("token");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>

        {/* --- Public Pages --- */}
        <Route path="/welcome" element={<WelcomePage theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/login" element={<Login onSuccess={(detectedRole: Role) => handleSetRole(detectedRole)} />} />
        <Route
          path="/"
          element={
            role === "admin" ? <Navigate to="/admin/dashboard" replace /> :
              role === "student" ? <Navigate to="/dashboard" replace /> :
                role === "driver" ? <Navigate to="/driver/dashboard" replace /> :
                  <Navigate to="/signup" replace />
          }
        />

        {/* --- Shared Layout --- */}
        <Route element={<AppLayout theme={theme} setTheme={toggleTheme} role={role} onLogout={() => handleSetRole(null)} />}>

          {/* Student Routes */}
          <Route path="/dashboard"     element={<Guard role={role} allowed={["student"]} redirectTo="/login"><DashboardPage /></Guard>} />
          <Route path="/my-trips"      element={<Guard role={role} allowed={["student"]} redirectTo="/login"><MyTripsPage /></Guard>} />
          <Route path="/route-details" element={<Guard role={role} allowed={["student"]} redirectTo="/login"><RouteDetailsPage /></Guard>} />
          <Route path="/notifications" element={<Guard role={role} allowed={["student"]} redirectTo="/login"><NotificationsPage /></Guard>} />
          <Route path="/support"       element={<Guard role={role} allowed={["student"]} redirectTo="/login"><SupportPage /></Guard>} />
          <Route path="/profile"       element={<Guard role={role} allowed={["student"]} redirectTo="/login"><ProfilePage /></Guard>} />
          <Route path="/settings"      element={<Guard role={role} allowed={["student", "driver"]} redirectTo="/login"><StudentSettingsPage /></Guard>} />
          <Route path="/attendance"    element={<Guard role={role} allowed={["student"]} redirectTo="/login"><AttendancePage /></Guard>} />
          <Route path="/route-chat"    element={<Guard role={role} allowed={["student"]} redirectTo="/login"><TripChat /></Guard>} />
          <Route path="/book-trip"     element={<Guard role={role} allowed={["student"]} redirectTo="/login"><BookTripPage /></Guard>} />
          <Route path="/track-bus"     element={<Guard role={role} allowed={["student"]} redirectTo="/login"><TrackBusPage /></Guard>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard"     element={<Guard role={role} allowed={["admin"]} redirectTo="/login"><AdminDashboard /></Guard>} />
          <Route path="/admin/create-trip"   element={<Guard role={role} allowed={["admin"]} redirectTo="/login"><CreateTripPage /></Guard>} />
          <Route path="/admin/notifications" element={<Guard role={role} allowed={["admin"]} redirectTo="/login"><AdminNotifications /></Guard>} />
          <Route path="/admin/routes"        element={<Guard role={role} allowed={["admin"]} redirectTo="/login"><ManageRoutes /></Guard>} />
          <Route path="/admin/users"         element={<Guard role={role} allowed={["admin"]} redirectTo="/login"><UsersPage /></Guard>} />
          <Route path="/admin/users/:id/settings" element={<Guard role={role} allowed={["admin"]} redirectTo="/login"><StudentSettingsPage /></Guard>} />
          <Route path="/admin/trips"         element={<Guard role={role} allowed={["admin"]} redirectTo="/login"><TripsPage /></Guard>} />
          <Route path="/admin/live-tracking" element={<Guard role={role} allowed={["admin"]} redirectTo="/login"><LiveTrackingPage /></Guard>} />
          <Route path="/admin/support"       element={<Guard role={role} allowed={["admin"]} redirectTo="/login"><ASupport /></Guard>} />
          <Route path="/admin/reports"       element={<Guard role={role} allowed={["admin"]} redirectTo="/login"><AdminReports /></Guard>} />
          <Route path="/admin/settings"      element={<Guard role={role} allowed={["admin"]} redirectTo="/login"><SettingsPage /></Guard>} />
          <Route path="/admin/profile"       element={<Guard role={role} allowed={["admin"]} redirectTo="/login"><AdminProfilePage /></Guard>} />
          <Route path="/admin/students/:studentId" element={<Guard role={role} allowed={["admin"]} redirectTo="/login"><StudentProfile /></Guard>} />

          {/* Driver Routes */}
          <Route element={<Guard role={role} allowed={["driver"]} redirectTo="/login"><DriverLayout /></Guard>}>
            <Route path="/driver/dashboard" element={<DriverTrips />} />
            <Route path="/driver/live-tracking" element={<DriverLiveTracking />} />
          </Route>

        </Route>

        <Route path="*" element={<PlaceholderPage label="Page Not Found" />} />

      </Routes>
      {role === "student" && <Chatbot />}
    </BrowserRouter>
  );
}