import { io } from "socket.io-client";

// Singleton socket instance shared across the entire app.
// This ensures one persistent connection and one set of room subscriptions.
const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5001", {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

// Join the appropriate room based on stored user info
const userId = localStorage.getItem("userId");
const role = localStorage.getItem("userRole");

if (userId && role === "student") {
  socket.emit("join-user-room", userId);
} else if (role === "admin") {
  socket.emit("join-admins");
}

socket.on("connect", () => {
  // Re-join rooms on reconnect
  const uid = localStorage.getItem("userId");
  const r = localStorage.getItem("userRole");
  if (uid && r === "student") socket.emit("join-user-room", uid);
  if (r === "admin") socket.emit("join-admins");
});

export default socket;
