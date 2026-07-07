import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';
import { InterviewMode } from '@prisma/client';

interface InterviewMailBase {
  to: string;
  fullName: string;
  jobTitle: string;
  companyName: string;
}

interface InterviewScheduleMailPayload extends InterviewMailBase {
  scheduledAt: Date;
  mode: InterviewMode;
  location?: string;
  meetingLink?: string;
  notes?: string;
  googleCalendarLink: string;
  icsContent: string;
}

@Injectable()
export class MailService {
  private readonly brevo: BrevoClient;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    this.brevo = new BrevoClient({
      apiKey: this.configService.get<string>('BREVO_API_KEY') ?? '',
    });
    this.fromEmail =
      this.configService.get<string>('BREVO_FROM') ??
      'no-reply@itworks.dpdns.org';
    this.fromName = 'ITWorks';
  }

  private buildHrSignature(hr: {
    full_name: string;
    email: string;
    phone?: string;
  }) {
    return `
    <br/><br/>
    <p><strong>Thông tin liên hệ:</strong></p>
    <p>
      <strong>${hr.full_name}</strong><br/>
      Chuyên viên tuyển dụng<br/>
      Email: <a href="mailto:${hr.email}">${hr.email}</a><br/>
      ${hr.phone ? `SĐT: ${hr.phone}<br/>` : ''}
    </p>
  `;
  }

  async sendVerificationMail(to: string, link: string, fullName: string) {
    return this.brevo.transactionalEmails.sendTransacEmail({
      sender: { name: this.fromName, email: this.fromEmail },
      to: [{ email: to, name: fullName }],
      subject: 'Verify your email',
      htmlContent: `
        <h1>Welcome ${fullName}</h1>
        <p>Click below to activate your account:</p>
        <a href="${link}">Verify Email</a>
      `,
    });
  }

  async sendResetPasswordMail(to: string, link: string) {
    return this.brevo.transactionalEmails.sendTransacEmail({
      sender: { name: this.fromName, email: this.fromEmail },
      to: [{ email: to }],
      subject: 'Reset your password',
      htmlContent: `
        <h1>Password Reset Request</h1>
        <p>Click below to reset your password:</p>
        <a href="${link}">Reset Password</a>
      `,
    });
  }

  async sendInterviewScheduleMail(
    payload: InterviewScheduleMailPayload & { hr: any },
  ) {
    const {
      to,
      fullName,
      jobTitle,
      companyName,
      scheduledAt,
      mode,
      location,
      meetingLink,
      googleCalendarLink,
      icsContent,
      hr,
    } = payload;

    const dateStr = scheduledAt.toLocaleString('vi-VN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const modeLabel = mode === 'online' ? 'Online' : 'Trực tiếp';
    const hrSignature = this.buildHrSignature(hr);

    return this.brevo.transactionalEmails.sendTransacEmail({
      sender: { name: this.fromName, email: this.fromEmail },
      to: [{ email: to, name: fullName }],
      subject: `Lịch phỏng vấn – ${jobTitle} – ${companyName}`,
      htmlContent: `
      <h2>Xin chào ${fullName},</h2>

      <p>Bạn có một lịch phỏng vấn mới cho vị trí <strong>${jobTitle}</strong> tại <strong>${companyName}</strong>.</p>

      <p><strong>Thông tin buổi phỏng vấn:</strong></p>
      <ul>
        <li><strong>Thời gian:</strong> ${dateStr}</li>
        <li><strong>Hình thức:</strong> ${modeLabel}</li>
        ${
          mode === 'online'
            ? `<li><strong>Link phỏng vấn:</strong> <a href="${meetingLink}">${meetingLink}</a></li>`
            : `<li><strong>Địa điểm:</strong> ${location}</li>`
        }
      </ul>

      <p>Bạn có thể thêm lịch vào Google Calendar:</p>
      <p><a href="${googleCalendarLink}">➡ Thêm vào Google Calendar</a></p>

      <p>Ngoài ra, bạn có thể mở file .ics đính kèm để thêm vào ứng dụng lịch khác.</p>

      ${hrSignature}

      <br/>
      <p>Trân trọng,<br/>${companyName}</p>
    `,
      attachment: [
        {
          name: 'interview.ics',
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    });
  }

  async sendInterviewUpdatedMail(
    payload: InterviewScheduleMailPayload & { hr: any },
  ) {
    const {
      to,
      fullName,
      jobTitle,
      companyName,
      scheduledAt,
      mode,
      location,
      meetingLink,
      googleCalendarLink,
      icsContent,
      hr,
    } = payload;

    const dateStr = scheduledAt.toLocaleString('vi-VN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const modeLabel = mode === 'online' ? 'Online' : 'Trực tiếp';
    const hrSignature = this.buildHrSignature(hr);

    return this.brevo.transactionalEmails.sendTransacEmail({
      sender: { name: this.fromName, email: this.fromEmail },
      to: [{ email: to, name: fullName }],
      subject: `Cập nhật lịch phỏng vấn – ${jobTitle} – ${companyName}`,
      htmlContent: `
      <h2>Xin chào ${fullName},</h2>

      <p>Lịch phỏng vấn của bạn cho vị trí <strong>${jobTitle}</strong> tại <strong>${companyName}</strong> đã được <strong>cập nhật</strong>.</p>

      <p><strong>Thông tin mới:</strong></p>
      <ul>
        <li><strong>Thời gian mới:</strong> ${dateStr}</li>
        <li><strong>Hình thức:</strong> ${modeLabel}</li>
        ${
          mode === 'online'
            ? `<li><strong>Link mới:</strong> <a href="${meetingLink}">${meetingLink}</a></li>`
            : `<li><strong>Địa điểm mới:</strong> ${location}</li>`
        }
      </ul>

      <p>Vui lòng cập nhật lại lịch của bạn.</p>
      <p><a href="${googleCalendarLink}">➡ Cập nhật Google Calendar</a></p>

      ${hrSignature}

      <br/>
      <p>Trân trọng,<br/>${companyName}</p>
    `,
      attachment: [
        {
          name: 'interview.ics',
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    });
  }

  async sendInterviewCancelledMail(
    payload: InterviewMailBase & { scheduledAt: Date; hr: any },
  ) {
    const { to, fullName, jobTitle, companyName, scheduledAt, hr } = payload;

    const dateStr = scheduledAt.toLocaleString('vi-VN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const hrSignature = this.buildHrSignature(hr);

    return this.brevo.transactionalEmails.sendTransacEmail({
      sender: { name: this.fromName, email: this.fromEmail },
      to: [{ email: to, name: fullName }],
      subject: `Hủy lịch phỏng vấn – ${jobTitle} – ${companyName}`,
      htmlContent: `
      <h2>Xin chào ${fullName},</h2>

      <p>Buổi phỏng vấn của bạn cho vị trí <strong>${jobTitle}</strong> vào lúc <strong>${dateStr}</strong> đã được <strong>hủy</strong>.</p>

      <p>Nếu có lịch phỏng vấn mới, chúng tôi sẽ thông báo cho bạn sau.</p>

      ${hrSignature}

      <br/>
      <p>Trân trọng,<br/>${companyName}</p>
    `,
    });
  }

  async sendApplicationAcceptedMail(payload: {
    to: string;
    fullName: string;
    jobTitle: string;
    companyName: string;
  }) {
    return this.brevo.transactionalEmails.sendTransacEmail({
      sender: { name: this.fromName, email: this.fromEmail },
      to: [{ email: payload.to, name: payload.fullName }],
      subject: `🎉 Chúc mừng! Bạn đã trúng tuyển vị trí ${payload.jobTitle}`,
      htmlContent: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      
      <h2 style="color: #0d6efd;">Xin chào ${payload.fullName},</h2>

      <p>
        Chúng tôi rất vui mừng thông báo rằng sau quá trình đánh giá và phỏng vấn, 
        bạn đã <strong style="color: #16a34a;">vượt qua tất cả các vòng tuyển dụng</strong>.
      </p>

      <p>
        Bạn chính thức được nhận vào vị trí 
        <strong style="color:#0d6efd;">${payload.jobTitle}</strong> tại 
        <strong>${payload.companyName}</strong>.
      </p>

      <p>
        Đại diện công ty sẽ sớm liên hệ với bạn để thông tin về 
        <strong>mức lương, ngày bắt đầu làm việc và các thủ tục tiếp theo</strong>.  
        Vui lòng kiểm tra email hoặc điện thoại trong thời gian tới nhé!
      </p>

      <div style="
        background: #f0f9ff;
        padding: 12px 16px;
        border-left: 4px solid #0d6efd;
        margin: 20px 0;
        border-radius: 6px;">
        <p style="margin:0;">
          🎯 <strong>Lưu ý:</strong> Hãy đảm bảo bạn luôn giữ liên lạc — 
          đây là giai đoạn quan trọng trước khi chính thức onboarding.
        </p>
      </div>

      <p>
        Chúc mừng bạn một lần nữa và hoan nghênh bạn đến với đội ngũ của 
        <strong>${payload.companyName}</strong>!
      </p>

      <p style="margin-top: 24px;">
        Trân trọng,<br/>
        <strong>${payload.companyName}</strong>
      </p>

    </div>
  `,
    });
  }

  async sendApplicationRejectedMail(payload: {
    to: string;
    fullName: string;
    jobTitle: string;
    companyName: string;
  }) {
    return this.brevo.transactionalEmails.sendTransacEmail({
      sender: { name: this.fromName, email: this.fromEmail },
      to: [{ email: payload.to, name: payload.fullName }],
      subject: `Kết quả ứng tuyển – ${payload.jobTitle}`,
      htmlContent: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      
      <h2 style="color: #dc2626;">Xin chào ${payload.fullName},</h2>

      <p>
        Cảm ơn bạn đã dành thời gian ứng tuyển vị trí 
        <strong style="color:#0d6efd;">${payload.jobTitle}</strong> tại 
        <strong>${payload.companyName}</strong>.
      </p>

      <p>
        Sau khi xem xét kỹ lưỡng, rất tiếc chúng tôi chưa thể tiếp tục 
        hồ sơ của bạn cho vị trí này. 
        Tuy nhiên, chúng tôi đánh giá cao những nỗ lực và hành trình nghề nghiệp của bạn.
      </p>

      <div style="
        background: #fff7f7;
        padding: 12px 16px;
        border-left: 4px solid #dc2626;
        margin: 20px 0;
        border-radius: 6px;">
        <p style="margin:0;">
          ❤️ <strong>Lời nhắn từ chúng tôi:</strong>  
          Dù kết quả chưa như mong muốn, năng lực của bạn là điều rất đáng trân trọng.  
          Đừng ngần ngại ứng tuyển lại khi có vị trí phù hợp hơn trong tương lai.
        </p>
      </div>

      <p>
        Chúc bạn thật nhiều thành công và may mắn trên hành trình sự nghiệp sắp tới!
      </p>

      <p style="margin-top: 24px;">
        Trân trọng,<br/>
        <strong>${payload.companyName}</strong>
      </p>

    </div>
  `,
    });
  }

  async sendTemporaryPasswordMail(
    to: string,
    fullName: string,
    tempPassword: string,
  ) {
    const PRIMARY_COLOR = '#0d6efd';
    const SECONDARY_COLOR = '#f8f9fa';
    const BORDER_COLOR = '#dee2e6';

    return this.brevo.transactionalEmails.sendTransacEmail({
      sender: { name: this.fromName, email: this.fromEmail },
      to: [{ email: to, name: fullName }],
      subject: '🔑 Mật khẩu Tạm thời Của Bạn - Hệ thống ITworks',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 20px auto; border: 1px solid ${BORDER_COLOR}; border-radius: 8px; overflow: hidden;">
            
            <div style="background-color: ${PRIMARY_COLOR}; padding: 20px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">ITworks</h1>
                <p style="margin: 5px 0 0 0;">Thiết lập lại mật khẩu</p>
            </div>

            <div style="padding: 30px;">
                <h2 style="color: #1a1a1a; margin-top: 0;">Xin chào ${fullName},</h2>

                <p style="margin-bottom: 25px;">
                    Chúng tôi đã nhận được yêu cầu thiết lập lại mật khẩu cho tài khoản của bạn. Quản trị viên đã tạo một mật khẩu tạm thời mới.
                </p>

                <div style="background-color: ${SECONDARY_COLOR}; border: 1px dashed ${BORDER_COLOR}; padding: 20px; text-align: center; border-radius: 6px; margin-bottom: 25px;">
                    <p style="font-size: 16px; margin-bottom: 10px; color: #555555;">
                        Mật khẩu tạm thời của bạn là:
                    </p>
                    <span style="display: inline-block; padding: 10px 25px; background-color: white; border: 2px solid ${PRIMARY_COLOR}; color: ${PRIMARY_COLOR}; font-size: 24px; font-weight: bold; letter-spacing: 2px; border-radius: 4px;">
                        ${tempPassword}
                    </span>
                </div>
                <p style="font-weight: bold; color: #dc3545;">
                    Rất quan trọng: Vui lòng đăng nhập bằng mật khẩu tạm thời này và 
                    <strong>đổi mật khẩu ngay lập tức</strong>
                    để bảo vệ thông tin tài khoản của bạn.
                </p>

                <p style="margin-top: 30px;">
                    Nếu bạn không yêu cầu thay đổi này, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ.
                </p>
            </div>

            <div style="padding: 20px 30px; border-top: 1px solid ${BORDER_COLOR}; font-size: 12px; color: #888888; text-align: center;">
                <p style="margin: 0;">Trân trọng,<br/>Đội ngũ Hệ thống ITworks</p>
                <p style="margin: 5px 0 0 0;">Đây là email được gửi tự động. Vui lòng không trả lời.</p>
            </div>
        </div>
      `,
    });
  }
}
