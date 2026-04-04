import { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import type { Theme } from "./types";

// Layout & Pages
import AppLayout from "./components/AppLayout";
import DashboardPage     from "./pages/DashboardPage";
import MyTripsPage       from "./pages/MyTripsPage";
import RouteDetailsPage  from "./pages/RouteDetailsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SupportPage       from "./pages/SupportPage";
import ProfilePage       from "./pages/ProfilePage";
import ReportPage        from "./pages/ReportPage";
import NewNotifPage      from "./pages/NewNotifPage";
// import UsersPage         from "./pages/UsersPage";
import PlaceholderPage   from "./pages/PlaceholderPage";
import WelcomePage from "./pages/WelcomePage";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggleTheme = useCallback(() => {
    setTheme(t => t === "dark" ? "light" : "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/welcome" element={<WelcomePage theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        {/* redirect */}
        <Route path="/" element={<Navigate to="/welcome" replace />} />

        <Route element={<AppLayout theme={theme} setTheme={toggleTheme} />}>

          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/my-trips" element={<MyTripsPage />} />
          <Route path="/route-details" element={<RouteDetailsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/settings" element={<ProfilePage />} />
          <Route path="/attendance" element={<ReportPage />} />
          <Route path="/route-chat" element={<NewNotifPage />} />

          <Route path="/book-trip" element={<PlaceholderPage label="Book Trip" />} />
          <Route path="/track-bus" element={<PlaceholderPage label="Track Bus" />} />

        </Route>

        {/* 404 */}
        <Route path="*" element={<PlaceholderPage label="Page Not Found" />} />

      </Routes>
    </BrowserRouter>
  );
}