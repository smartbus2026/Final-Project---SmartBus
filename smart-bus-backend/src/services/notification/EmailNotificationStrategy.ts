import { INotificationStrategy } from "./INotificationStrategy";

export class EmailNotificationStrategy implements INotificationStrategy {
  public async send(userId: string, title: string, message: string): Promise<void> {
    // Mocking email sending logic for now
    console.log(`[EmailNotificationStrategy] Sending email to user ${userId} | Subject: ${title} | Body: ${message}`);
    
    // In a real implementation, you would look up the user's email address using the userId
    // and use a service like Nodemailer, SendGrid, or AWS SES to dispatch the email.
    return Promise.resolve();
  }
}
