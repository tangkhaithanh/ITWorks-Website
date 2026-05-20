import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';
import { SubmitInterviewResultDto } from './dto/submit-interview-result.dto';
import {
  ApplicationStatus,
  InterviewResult,
  InterviewStatus,
  InterviewMode,
  NotificationType,
} from '@prisma/client';
import { MailService } from '@/common/services/mail/mail.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
@Injectable()
export class InterviewService {
   private readonly logger = new Logger(InterviewService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Tạo lịch tuyển dụng mới:
 async createInterview(accountId: bigint, dto: CreateInterviewDto) {
  try {
    this.logger.log(
      `Creating interview for application_id=${dto.application_id}`,
    );

    const application = await this.prisma.application.findFirst({
      where: { id: BigInt(dto.application_id) },
      include: {
        job: { include: { company: true } },
        candidate: {
          include: { user: { include: { account: true } } },
        },
      },
    });

    if (!application) {
      this.logger.warn(
        `Application not found: application_id=${dto.application_id}`,
      );
      throw new NotFoundException('Application not found');
    }

    if (application.job.company.account_id !== accountId) {
      this.logger.warn(
        `Forbidden create interview attempt by account_id=${accountId}`,
      );
      throw new ForbiddenException('Not allowed');
    }

    const scheduledAt = new Date(dto.scheduled_at);

    this.logger.log(
      `Creating interview + updating application status to interviewing`,
    );

    const [interview] = await this.prisma.$transaction([
      this.prisma.interview.create({
        data: {
          application_id: application.id,
          scheduled_at: scheduledAt,
          mode: dto.mode,
          location: dto.location,
          meeting_link: dto.meeting_link,
          notes: dto.notes,
        },
      }),

      this.prisma.application.update({
        where: { id: application.id },
        data: { status: ApplicationStatus.interviewing },
      }),
    ]);

    this.logger.log(
      `Interview created successfully: interview_id=${interview.id}`,
    );

    const candidate = application.candidate.user;
    const job = application.job;

    const hr = await this.prisma.user.findUnique({
      where: { account_id: accountId },
      include: { account: true },
    });

    if (!hr) {
      this.logger.error(
        `HR info not found for account_id=${accountId}`,
      );

      throw new ForbiddenException('Không tìm thấy thông tin HR.');
    }

    this.logger.log(
      `Sending interview email to ${candidate.account.email}`,
    );

    await this.mailService.sendInterviewScheduleMail({
      to: candidate.account.email,
      fullName: candidate.full_name,
      jobTitle: job.title,
      companyName: job.company.name,
      scheduledAt,
      mode: dto.mode,
      location: dto.location,
      meetingLink: dto.meeting_link,
      googleCalendarLink: this.buildGoogleCalendarLink(
        scheduledAt,
        dto,
      ),
      icsContent: this.generateIcsEvent(scheduledAt, dto),
      hr: {
        full_name: hr.full_name,
        email: hr.account.email,
        phone: hr.phone,
      },
    });

    this.logger.log(
      `Interview email sent successfully to ${candidate.account.email}`,
    );

    return interview;
  } catch (error) {
    this.logger.error(
      `Failed to create interview: ${error.message}`,
      error.stack,
    );

    throw error;
  }
}

  // Sửa lịch phỏng vấn -> gửi mail thông báo cho ứng viên:
  async updateInterview(
    accountId: bigint,
    interviewId: bigint,
    dto: UpdateInterviewDto,
  ) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            job: { include: { company: true } },
            candidate: {
              include: { user: { include: { account: true } } },
            },
          },
        },
      },
    });

    if (!interview) throw new NotFoundException('Interview not found');
    if (interview.application.job.company.account_id !== accountId)
      throw new ForbiddenException('Not allowed');
    const updated = await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        scheduled_at: dto.scheduled_at
          ? new Date(dto.scheduled_at)
          : interview.scheduled_at,
        mode: dto.mode ?? interview.mode,
        location: dto.location ?? interview.location,
        meeting_link: dto.meeting_link ?? interview.meeting_link,
        notes: dto.notes ?? interview.notes,
        status: InterviewStatus.rescheduled,
      },
    });
    const app = interview.application;
    const hr = await this.prisma.user.findUnique({
      where: { account_id: accountId },
      include: { account: true },
    });
    if (!hr) {
      throw new ForbiddenException('Không tìm thấy thông tin HR.');
    }
    await this.mailService.sendInterviewUpdatedMail({
      to: app.candidate.user.account.email,
      fullName: app.candidate.user.full_name,
      jobTitle: app.job.title,
      companyName: app.job.company.name,
      scheduledAt: updated.scheduled_at,
      mode: updated.mode,
      location: updated.location || undefined,
      meetingLink: updated.meeting_link || undefined,
      googleCalendarLink: this.buildGoogleCalendarLink(
        updated.scheduled_at,
        updated,
      ),
      icsContent: this.generateIcsEvent(updated.scheduled_at, updated),
      hr: {
        full_name: hr.full_name,
        email: hr.account.email,
        phone: hr.phone,
      },
    });
  }

  // Hủy lịch phỏng vấn -> gửi mail thông báo cho ứng viên:
  async cancelInterview(accountId: bigint, interviewId: bigint) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            job: { include: { company: true } },
            candidate: {
              include: { user: { include: { account: true } } },
            },
          },
        },
      },
    });

    if (!interview) throw new NotFoundException('Interview not found');
    if (interview.application.job.company.account_id !== accountId)
      throw new ForbiddenException('Not allowed');

    const [updatedInterview] = await this.prisma.$transaction([
      this.prisma.interview.update({
        where: { id: interviewId },
        data: { status: InterviewStatus.cancelled },
      }),
      this.prisma.application.update({
        where: { id: interview.application_id },
        data: { status: ApplicationStatus.pending },
      }),
    ]);

    const app = interview.application;
    const hr = await this.prisma.user.findUnique({
      where: { account_id: accountId },
      include: { account: true },
    });
    if (!hr) {
      throw new ForbiddenException('Không tìm thấy thông tin HR.');
    }
    await this.mailService.sendInterviewCancelledMail({
      to: app.candidate.user.account.email,
      fullName: app.candidate.user.full_name,
      jobTitle: app.job.title,
      companyName: app.job.company.name,
      scheduledAt: interview.scheduled_at,
      hr: {
        full_name: hr.full_name,
        email: hr.account.email,
        phone: hr.phone,
      },
    });
    return updatedInterview;
  }

  async submitInterviewResult(
  accountId: bigint,
  interviewId: bigint,
  dto: SubmitInterviewResultDto,
) {
  try {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            job: {
              include: {
                company: true,
              },
            },
            candidate: {
              include: {
                user: {
                  include: {
                    account: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    if (interview.application.job.company.account_id !== accountId) {
      throw new ForbiddenException('Not allowed');
    }

    const updated = await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        notes: dto.notes ?? interview.notes,
        result: dto.result,
        status: dto.no_show
          ? InterviewStatus.no_show
          : InterviewStatus.completed,
      },
    });

    const app = interview.application;
    const candidateUser = app.candidate.user;
    const jobTitle = app.job.title;

    if (dto.result === InterviewResult.pass) {
      await this.notificationsService.notifyAccount({
        accountId: candidateUser.account_id,
        type: NotificationType.application,
        message: `Bạn đã trúng tuyển công việc ${jobTitle} - Bạn sẽ nhận offer sau đó!`,
        realtimePayload: {
          interviewId: updated.id.toString(),
          applicationId: app.id.toString(),
          jobId: app.job.id.toString(),
          result: updated.result,
          status: updated.status,
        },
      });
    }

    if (dto.result === InterviewResult.reject) {

       await this.prisma.application.update({
        where: { id: app.id },
        data: {
          status: ApplicationStatus.rejected,
        },
      });
      
      await this.notificationsService.notifyAccount({
        accountId: candidateUser.account_id,
        type: NotificationType.application,
        message: `Bạn đã bị từ chối công việc ${jobTitle}`,
        realtimePayload: {
          interviewId: updated.id.toString(),
          applicationId: app.id.toString(),
          jobId: app.job.id.toString(),
          result: updated.result,
          status: updated.status,
        },
      });

      await this.mailService.sendApplicationRejectedMail({
        to: candidateUser.account.email,
        fullName: candidateUser.full_name,
        jobTitle,
        companyName: app.job.company.name,
      });
    }

    return {
      ...updated,
      no_show: dto.no_show,
      status: updated.status,
      result: updated.result,
      notes: updated.notes,
    };
  } catch (error) {
    throw error;
  }
}

  //=======Helpers: ICS + Google Calendar Link =======
  private toIcs(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  }
  private generateIcsEvent(scheduledAt: Date, dto: any): string {
    const durationMinutes = 60; // default fixed
    const start = this.toIcs(scheduledAt);
    const end = this.toIcs(
      new Date(scheduledAt.getTime() + durationMinutes * 60000),
    );

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${scheduledAt.getTime()}@it-recruitment-system`,
      `DTSTAMP:${this.toIcs(new Date())}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      'SUMMARY:Phỏng vấn ứng viên',
      `LOCATION:${dto.mode === 'online' ? dto.meeting_link : dto.location || ''}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  private buildGoogleCalendarLink(scheduledAt: Date, dto: any): string {
    const start = this.toIcs(scheduledAt);
    const end = this.toIcs(new Date(scheduledAt.getTime() + 60 * 60000));

    return (
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=Interview` +
      `&dates=${start}/${end}` +
      `&location=${encodeURIComponent(dto.mode === 'online' ? dto.meeting_link : dto.location || '')}`
    );
  }
}
