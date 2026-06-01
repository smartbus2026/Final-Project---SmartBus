import { INotificationStrategy } from "./INotificationStrategy";
import Notification from "../../models/notification";

export class PushNotificationStrategy implements INotificationStrategy {
  public async send(userId: string, title: string, message: string): Promise<void> {
    try {
      await Notification.create({
        user: userId,
        title: title,
        message: message,
        type: "system", // Generic type for system alerts
        read: false
      });
      console.log(`[PushNotificationStrategy] Pushed notification to user ${userId}`);
    } catch (err) {
      console.error(`[PushNotificationStrategy] Failed to push notification to user ${userId}:`, err);
    }
  }
}
