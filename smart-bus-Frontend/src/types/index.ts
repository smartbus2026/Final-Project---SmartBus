// ──────────────────────────────────────────────
//  types/index.ts
//  كل الـ TypeScript types بتاعت المشروع هنا
// ──────────────────────────────────────────────

/** الثيم: داكن أو فاتح */
export type Theme = "dark" | "light";

/** أسماء كل صفحات التطبيق */
export type Page =
  | "dashboard"
  | "bookTrip"
  | "myTrips"
  | "routeDetails"
  | "trackBus"
  | "attendance"
  | "notifications"
  | "routeChat"
  | "support"
  | "settings";

/** حالة الرحلة */
export type TripStatus = "upcoming" | "completed" | "missed";

/** بيانات رحلة واحدة */
export interface Trip {
  id: string;
  date: string;
  from: string;
  to: string;
  pickup: string;
  bus: string;
  departure: string;
  returnTime: string;
  status: TripStatus;
  tripId: string;
}

/** إشعار واحد */
export interface Notif {
  id: string;
  title: string;
  message: string;
  time: string;
  target: string;
  readCount: number;
}

/** بيانات يوزر في صفحة الإدارة */
export type UserRole = "Student" | "Driver";
export type UserStatus = "Active" | "Inactive";

export interface AppUser {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;     // Tailwind bg class
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  joined: string;
}