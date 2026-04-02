
import { useState, useCallback } from "react";
import type { Page, Theme } from "./types";
import AppLayout from "./components/AppLayout";
import DashboardPage     from "./pages/DashboardPage";
import MyTripsPage       from "./pages/MyTripsPage";
import RouteDetailsPage  from "./pages/RouteDetailsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SupportPage       from "./pages/SupportPage";
import ProfilePage       from "./pages/ProfilePage";
import ReportPage        from "./pages/ReportPage";
import NewNotifPage      from "./pages/NewNotifPage";
import UsersPage         from "./pages/UsersPage";
import PlaceholderPage   from "./pages/PlaceholderPage";
 
function PageRouter({ page, go }: { page: Page; go: (p: Page) => void }) {
  switch (page) {
    case "dashboard":     return <DashboardPage go={go} />;
    case "myTrips":       return <MyTripsPage />;
    case "routeDetails":  return <RouteDetailsPage />;
    case "notifications": return <NotificationsPage />;
    case "support":       return <SupportPage />;
    case "settings":      return <ProfilePage />;
    case "attendance":    return <ReportPage />;
    case "routeChat":     return <NewNotifPage />;
    case "bookTrip":      return <PlaceholderPage label="Book Trip" />;
    case "trackBus":      return <PlaceholderPage label="Track Bus" />;
    default:              return <PlaceholderPage label={page} />;
  }
}
 
export default function App() {
  const [page,  setPage]  = useState<Page>("dashboard");
  const [theme, setTheme] = useState<Theme>("dark");
  const go          = useCallback((p: Page) => setPage(p), []);
  const toggleTheme = useCallback(() => setTheme(t => t === "dark" ? "light" : "dark"), []);
  return (
    <AppLayout page={page} setPage={go} theme={theme} setTheme={toggleTheme}>
      <PageRouter page={page} go={go} />
    </AppLayout>
  );
}
 