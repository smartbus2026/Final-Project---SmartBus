import { INotificationStrategy } from "./INotificationStrategy";

export class MultiChannelStrategy implements INotificationStrategy {
  private strategies: INotificationStrategy[];

  constructor(strategies: INotificationStrategy[]) {
    this.strategies = strategies;
  }

  public async send(userId: string, title: string, message: string): Promise<void> {
    // Execute all strategies concurrently
    await Promise.all(this.strategies.map(strategy => strategy.send(userId, title, message)));
  }
}
