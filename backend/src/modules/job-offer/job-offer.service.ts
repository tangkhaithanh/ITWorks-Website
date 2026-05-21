import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateJobOfferDto } from './dto/create-job-offer.dto';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { JobOfferStatus } from '@prisma/client';
@Injectable()
export class JobOfferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getCandidateIdByUserId(userId: bigint): Promise<bigint> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });

    if (!candidate) {
      throw new ForbiddenException('Account does not have a candidate profile');
    }

    return candidate.id;
  }

  async findByApplicationId(applicationId: bigint) {
    return this.prisma.jobOffer.findMany({
      where: { application_id: applicationId },
      select: {
        title: true,
        message: true,
        salary: true,
        currency: true,
        employment_type: true,
        expires_at: true,
        status: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByCandidate(userId: bigint) {
    const candidateId = await this.getCandidateIdByUserId(userId);

    return this.prisma.jobOffer.findMany({
      where: {
        candidate_id: candidateId,
      },

      select: {
        id: true,

        status: true,

        salary: true,
        currency: true,

        employment_type: true,

        created_at: true,
        expires_at: true,

        company: {
          select: {
            id: true,
            name: true,
            logo_url: true,
          },
        },

        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },

      orderBy: [
        {
          status: 'asc',
        },
        {
          created_at: 'desc',
        },
      ],
    });
  }

  async findMyOfferById(userId: bigint, offerId: bigint) {
    const candidateId = await this.getCandidateIdByUserId(userId);

    const offer = await this.prisma.jobOffer.findFirst({
      where: {
        id: offerId,
        candidate_id: candidateId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo_url: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        application: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Job offer not found');
    }

    return offer;
  }

    async acceptOffer(userId: bigint, offerId: bigint) {
    const candidateId = await this.getCandidateIdByUserId(userId);

    const offer = await this.prisma.jobOffer.findFirst({
      where: {
        id: offerId,
        candidate_id: candidateId,
      },
      select: {
        id: true,
        application_id: true,
        job_id: true,
        candidate_id: true,
        job: {
          select: {
            title: true,
            company: {
              select: {
                account_id: true,
              },
            },
          },
        },
        candidate: {
          select: {
            user: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Không tìm thấy thư mời nhận việc.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: offer.application_id },
        data: { status: ApplicationStatus.accepted },
      });

      await tx.jobOffer.update({
        where: { id: offer.id },
        data: { status: JobOfferStatus.accepted },
      });
    });

    await this.notificationsService.notifyAccount({
      accountId: offer.job.company.account_id,
      type: NotificationType.application,
      message: `Ứng viên ${offer.candidate.user.full_name} đã chấp nhận lời mời offer cho công việc ${offer.job.title}`,
      realtimePayload: {
        jobOfferId: offer.id.toString(),
        applicationId: offer.application_id.toString(),
        jobId: offer.job_id.toString(),
        candidateId: offer.candidate_id.toString(),
      },
    });

    return {
      message: 'Bạn đã chấp nhận thư mời nhận việc thành công.',
    };
  }

  async rejectOffer(userId: bigint, offerId: bigint) {
    const candidateId = await this.getCandidateIdByUserId(userId);

    const offer = await this.prisma.jobOffer.findFirst({
      where: {
        id: offerId,
        candidate_id: candidateId,
      },
      select: {
        id: true,
        application_id: true,
        job_id: true,
        candidate_id: true,
        job: {
          select: {
            title: true,
            company: {
              select: {
                account_id: true,
              },
            },
          },
        },
        candidate: {
          select: {
            user: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Không tìm thấy thư mời nhận việc.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: offer.application_id },
        data: { status: ApplicationStatus.withdrawn },
      });

      await tx.jobOffer.update({
        where: { id: offer.id },
        data: { status: JobOfferStatus.rejected },
      });
    });

    await this.notificationsService.notifyAccount({
      accountId: offer.job.company.account_id,
      type: NotificationType.application,
      message: `Ứng viên ${offer.candidate.user.full_name} đã từ chối lời mời offer cho công việc ${offer.job.title}`,
      realtimePayload: {
        jobOfferId: offer.id.toString(),
        applicationId: offer.application_id.toString(),
        jobId: offer.job_id.toString(),
        candidateId: offer.candidate_id.toString(),
      },
    });

    return {
      message: 'Bạn đã từ chối thư mời nhận việc thành công.',
    };
  }

  async create(accountId: bigint, dto: CreateJobOfferDto) {
    const company = await this.prisma.company.findUnique({
      where: { account_id: accountId },
      select: { id: true, name: true },
    });

    if (!company) {
      throw new ForbiddenException('Recruiter company not found');
    }

    const application = await this.prisma.application.findUnique({
      where: { id: BigInt(dto.application_id) },
      select: {
        id: true,
        candidate_id: true,
        job_id: true,
        job_offer: { select: { id: true } },
        job: {
          select: {
            id: true,
            title: true,
            company_id: true,
          },
        },
        candidate: {
          select: {
            id: true,
            user: {
              select: {
                account_id: true,
                full_name: true,
                account: { select: { email: true } },
              },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.job.company_id !== company.id) {
      throw new ForbiddenException('Not allowed');
    }

    if (application.job_offer) {
      throw new ConflictException('Application has already received an offer');
    }

    const startDate = new Date();
    const expiresAt = new Date(dto.expires_at);

    if (expiresAt <= startDate) {
      throw new BadRequestException('expires_at must be after start_date');
    }

    try {
      const [offer] = await this.prisma.$transaction([
        this.prisma.jobOffer.create({
          data: {
            application_id: application.id,
            company_id: company.id,
            job_id: application.job_id,
            candidate_id: application.candidate_id,
            title: dto.title,
            message: dto.message,
            salary: dto.salary ?? null,
            currency: dto.currency ?? null,
            employment_type: dto.employment_type,
            start_date: startDate,
            expires_at: expiresAt,
          },
          include: {
            company: { select: { id: true, name: true } },
            job: { select: { id: true, title: true } },
            candidate: {
              select: {
                id: true,
                user: {
                  select: {
                    account_id: true,
                    full_name: true,
                    account: { select: { email: true } },
                  },
                },
              },
            },
            application: { select: { id: true, status: true } },
          },
        }),
        this.prisma.application.update({
          where: { id: application.id },
          data: { status: ApplicationStatus.offered },
        }),
      ]);

      await this.notificationsService.notifyAccount({
        accountId: offer.candidate.user.account_id,
        type: NotificationType.application,
        message: `Bạn nhận được một offer từ nhà tuyển dụng cho công việc ${offer.job.title}`,
        realtimePayload: {
          jobOfferId: offer.id.toString(),
          applicationId: offer.application_id.toString(),
          jobId: offer.job_id.toString(),
        },
      });

      return {
        id: offer.id,
        application_id: offer.application_id,
        company_id: offer.company_id,
        job_id: offer.job_id,
        candidate_id: offer.candidate_id,
        title: offer.title,
        message: offer.message,
        salary: offer.salary,
        currency: offer.currency,
        employment_type: offer.employment_type,
        start_date: offer.start_date,
        expires_at: offer.expires_at,
        status: offer.status,
        created_at: offer.created_at,
        updated_at: offer.updated_at,
        company: offer.company,
        job: offer.job,
        candidate: {
          id: offer.candidate.id,
          full_name: offer.candidate.user.full_name,
          email: offer.candidate.user.account.email,
        },
        application: {
          id: offer.application.id,
          status: ApplicationStatus.offered,
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Application has already received an offer',
        );
      }

      throw error;
    }
  }
}
