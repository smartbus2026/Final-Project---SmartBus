export interface INotificationStrategy {
  send(userId: string, title: string, message: string): Promise<void>;
}
