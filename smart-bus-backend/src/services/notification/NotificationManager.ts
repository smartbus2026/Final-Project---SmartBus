import { INotificationStrategy } from "./INotificationStrategy";

export class NotificationManager {
  /**
   * Dispatches a notification to a specific user using the provided strategy.
   * 
   * @param userId The ID of the recipient user (Admin/Student).
   * @param strategy The specific strategy to use (Push, Email, Multi-Channel).
   * @param title The title of the notification.
   * @param message The body content of the notification.
   */
  public static async notify(userId: string, strategy: INotificationStrategy, title: string, message: string): Promise<void> {
    await strategy.send(userId, title, message);
  }
}
