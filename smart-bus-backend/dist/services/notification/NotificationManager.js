"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationManager = void 0;
class NotificationManager {
    /**
     * Dispatches a notification to a specific user using the provided strategy.
     *
     * @param userId The ID of the recipient user (Admin/Student).
     * @param strategy The specific strategy to use (Push, Email, Multi-Channel).
     * @param title The title of the notification.
     * @param message The body content of the notification.
     */
    static async notify(userId, strategy, title, message) {
        await strategy.send(userId, title, message);
    }
}
exports.NotificationManager = NotificationManager;
