"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailNotificationStrategy = void 0;
class EmailNotificationStrategy {
    async send(userId, title, message) {
        // Mocking email sending logic for now
        console.log(`[EmailNotificationStrategy] Sending email to user ${userId} | Subject: ${title} | Body: ${message}`);
        // In a real implementation, you would look up the user's email address using the userId
        // and use a service like Nodemailer, SendGrid, or AWS SES to dispatch the email.
        return Promise.resolve();
    }
}
exports.EmailNotificationStrategy = EmailNotificationStrategy;
