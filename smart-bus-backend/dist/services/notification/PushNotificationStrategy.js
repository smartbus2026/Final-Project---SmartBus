"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationStrategy = void 0;
const notification_1 = __importDefault(require("../../models/notification"));
class PushNotificationStrategy {
    async send(userId, title, message) {
        try {
            await notification_1.default.create({
                user: userId,
                title: title,
                message: message,
                type: "system", // Generic type for system alerts
                read: false
            });
            console.log(`[PushNotificationStrategy] Pushed notification to user ${userId}`);
        }
        catch (err) {
            console.error(`[PushNotificationStrategy] Failed to push notification to user ${userId}:`, err);
        }
    }
}
exports.PushNotificationStrategy = PushNotificationStrategy;
