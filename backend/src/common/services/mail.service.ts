import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendVerificationMail(to: string, link: string, fullName: string) {
    return this.mailer.sendMail({
      to,
      subject: 'Verify your email',
      html: `
        <h1>Welcome ${fullName}</h1>
        <p>Click below to activate your account:</p>
        <a href="${link}">Verify Email</a>
      `,
    });
  }

  async sendResetPasswordMail(to: string, link: string) {
    return this.mailer.sendMail({
      to,
      subject: 'Reset your password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Click below to reset your password:</p>
        <a href="${link}">Reset Password</a>
      `,
    });
  }
}