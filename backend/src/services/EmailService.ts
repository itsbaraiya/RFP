//
// Email Service
//

import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      
    } catch (error) {
    }
  }

  private isConfigured(): boolean {
    if (!this.transporter) {
      return false;
    }
    return true;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error("Email service is not configured. Please set SMTP credentials in .env file");
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const info = await this.transporter!.sendMail(mailOptions);
    } catch (error: any) {
      if (error.code === "EAUTH") {
        throw new Error("SMTP authentication failed. Please check your SMTP_USER and SMTP_PASSWORD");
      } else if (error.code === "ECONNECTION") {
        throw new Error("Failed to connect to SMTP server. Please check your SMTP_HOST and SMTP_PORT");
      } else if (error.response) {
        throw new Error(`SMTP server error: ${error.response}`);
      } else {
        throw new Error(`Failed to send email: ${error.message || "Unknown error"}`);
      }
    }
  }

  async sendPasswordResetEmail(email: string, resetLink: string, userName?: string): Promise<void> {
    const subject = "Reset Your Password - RFP AI";
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 10px;
              border: 1px solid #e0e0e0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #00bfff;
            }
            .content {
              background: white;
              padding: 25px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(135deg, #00bfff, #0066ff);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 15px;
              border-radius: 5px;
              margin-top: 20px;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔥 RFP AI</div>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello${userName ? ` ${userName}` : ""},</p>
              <p>We received a request to reset your password for your RFP AI account. Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #0066ff;">${resetLink}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} RFP AI. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({ to: email, subject, html });
  }
}

export default new EmailService();

