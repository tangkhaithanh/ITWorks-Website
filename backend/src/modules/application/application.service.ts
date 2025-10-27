import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationService {
  constructor(private readonly prisma: PrismaService) {}
// === Chức năng dành cho candidate==========
  // Lấy candidate_id từ userId
  private async getCandidateIdByUserId(userId: bigint): Promise<bigint> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });
    if (!candidate)
      throw new ForbiddenException('Tài khoản không có hồ sơ ứng viên.');
    return candidate.id;
  }
  // Ứng tuyển công việc
  async apply(userId: bigint, dto: CreateApplicationDto) {
    try {
      // Convert string IDs sang bigint:
      const jobId= BigInt(dto.job_id);
      const cvId= BigInt(dto.cv_id);

      const candidateId = await this.getCandidateIdByUserId(userId);

      // 1️⃣ Kiểm tra job có tồn tại và đang active
      const job = await this.prisma.job.findFirst({
        where: { id: jobId, status: 'active' },
      });
      if (!job)
        throw new NotFoundException('Công việc không tồn tại hoặc đã bị đóng.');

      // 2️⃣ Kiểm tra CV có thuộc về ứng viên không
      const cv = await this.prisma.cv.findFirst({
        where: { id: cvId, candidate_id: candidateId, is_deleted: false },
      });
      if (!cv) throw new ForbiddenException('CV không hợp lệ.');

      // 3️⃣ Kiểm tra ứng viên đã nộp đơn chưa (tránh trùng)
      const application = await this.checkAlreadyApplied(userId, jobId);
      if (application.applied)
        throw new BadRequestException('Bạn đã ứng tuyển công việc này rồi.');

      // 4️⃣ Tạo đơn ứng tuyển mới
      const app = await this.prisma.application.create({
        data: {
          job_id: jobId,
          candidate_id: candidateId,
          cv_id: cvId,
        },
      });
      return app;
    } catch (error) {
      console.error('❌ Lỗi khi ứng tuyển:', error);
      throw new InternalServerErrorException('Đã xảy ra lỗi khi nộp đơn ứng tuyển.');
    }
  }

  // Lấy toàn bộ việc làm đã ứng tuyển (ở mức tóm tắt từng job)
  async getMyApplications(userId: bigint, page = 1, limit = 10, status?: ApplicationStatus) {
    const candidateId = await this.getCandidateIdByUserId(userId);
    const skip = (page - 1) * limit;

    const whereClause: any = { candidate_id: candidateId };
    if (status) whereClause.status = status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where: whereClause,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: { select: { id: true, name: true, logo_url: true } },
            },
          },
          cv: { select: { id: true, title: true, file_url: true } },
        },
        orderBy: { applied_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.application.count({ where: whereClause }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Xem chi tiết 1 đơn ứng tuyển dành cho ứng viên

  async getMyApplicationDetail(userId: bigint, appId: bigint) {
    const candidateId = await this.getCandidateIdByUserId(userId);
    const app = await this.prisma.application.findFirst({
      where: { id: appId, candidate_id: candidateId },
      include: {
        job: {
          include: {
            company: { select: { id: true, name: true, logo_url: true } },
          },
        },
        cv: true,
      },
    });

    if (!app) throw new NotFoundException('Không tìm thấy đơn ứng tuyển.');

    return app;
  }

  // Rút lại đơn ứng tuyển:
  async withdrawApplication(userId: bigint, appId: bigint) {
    const candidateId = await this.getCandidateIdByUserId(userId);

    const app = await this.prisma.application.findFirst({
      where: { id: appId, candidate_id: candidateId },
    });

    if (!app) throw new NotFoundException('Đơn ứng tuyển không tồn tại.');
    if (app.status !== ApplicationStatus.pending)
      throw new BadRequestException(
        'Chỉ có thể rút đơn khi đang ở trạng thái chờ xử lý (pending).',
      );

    const updated = await this.prisma.application.update({
      where: { id: app.id },
      data: { status: ApplicationStatus.withdrawn },
    });

    return { message: 'Đã rút đơn ứng tuyển thành công.', application: updated };
  }

  async checkAlreadyApplied(userId: bigint, jobId: bigint) {
    const candidateId = await this.getCandidateIdByUserId(userId);

    const application = await this.prisma.application.findFirst({
      where: {
        candidate_id: candidateId,
        job_id: jobId,
        status: { not: 'withdrawn' },
      },
      select: { id: true, status: true, applied_at: true },
    });

    if (application) {
      return {
        jobId,
        applied: true,
        status: application.status,
        applied_at: application.applied_at,
        message: 'Ứng viên đã ứng tuyển công việc này.',
      };
    }

    return {
      jobId,
      applied: false,
      message: 'Ứng viên chưa ứng tuyển công việc này.',
    };
}


/// ===== Chức năng dành cho nhà tuyển dụng recruiter======

// Lấy toàn bộ đơn ứng tuyển cho công ty của recruiter - thiết kế dạng bảng
  async getApplicationsByCompany(
  accountId: bigint,
  page = 1,
  limit = 10,
  status?: ApplicationStatus,
  jobId?: bigint,
  search?: string,
) {
  const start = Date.now();

  try {
    console.log(
      `📩 [getApplicationsByCompany] accountId=${accountId?.toString?.()} page=${page} limit=${limit} status=${status} jobId=${jobId} search="${search || ''}"`
    );

    // 🔸 1️⃣ Kiểm tra recruiter có công ty chưa
    const company = await this.prisma.company.findUnique({
      where: { account_id: accountId },
      select: { id: true, name: true },
    });
    if (!company) {
      console.warn(`⚠️ Không tìm thấy công ty cho accountId=${accountId}`);
      throw new ForbiddenException('Bạn chưa có công ty.');
    }

    // 🔹 2️⃣ Xây dựng whereClause an toàn với Prisma 6
    const whereClause: any = {
      AND: [
        { job: { company_id: company.id } }, // công ty của recruiter
      ],
    };

    if (status) whereClause.AND.push({ status });
    if (jobId) whereClause.AND.push({ job: { id: jobId } });

    // 🔍 3️⃣ Filter theo từ khóa tìm kiếm
    if (search && search.trim()) {
    whereClause.AND.push({
      OR: [
        {
          candidate: {
            is: {
              user: {
                is: {
                  full_name: { contains: search },
                },
              },
            },
          },
        },
        {
          candidate: {
            is: {
              user: {
                is: {
                  account: {
                    is: {
                      email: { contains: search },
                    },
                  },
                },
              },
            },
          },
        },
        {
          candidate: {
            is: {
              user: {
                is: {
                  phone: { contains: search },
                },
              },
            },
          },
        },
      ],
    });
  }

    // 🔹 4️⃣ Pagination
    const skip = (page - 1) * limit;

    // 🔍 5️⃣ Thực thi query (transaction: list + count)
    const [items, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where: whereClause,
        include: {
          job: { select: { id: true, title: true } },
          candidate: {
            include: {
              user: {
                select: {
                  id: true,
                  full_name: true,
                  phone: true,
                  avatar_url: true,
                  account: { select: { email: true } },
                },
              },
            },
          },
        },
        orderBy: { applied_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.application.count({ where: whereClause }),
    ]);

    console.log(
      `✅ Lấy ${items.length} đơn | total=${total} | ${Date.now() - start}ms`
    );

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('❌ Lỗi trong getApplicationsByCompany:', error.message);
    console.error(error.stack?.split('\n')[0]);
    throw new InternalServerErrorException(
      error.message || 'Lỗi khi lấy danh sách ứng tuyển công ty.'
    );
  }
}
  async getApplicationDetailByCompany(recruiterId: bigint, appId: bigint) {
    const company = await this.prisma.company.findUnique({
      where: { account_id: recruiterId },
    });
    if (!company) throw new ForbiddenException('Bạn chưa có công ty.');

    const app = await this.prisma.application.findFirst({
      where: {
        id: appId,
        job: { company_id: company.id },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: { select: { id: true, name: true, logo_url: true } },
          },
        },
        candidate: {
          include: {
            user: {
              select: {
                full_name: true,
                phone: true,
                avatar_url: true,
                dob: true,
                gender: true,
                account: { select: { email: true } },
              },
            },
          },
        },
        cv: {
          select: {
            id: true,
            title: true,
            file_url: true,
            content: true,
            template_id: true,
          },
        },
      },
    });

    if (!app) throw new NotFoundException('Đơn ứng tuyển không tồn tại.');

    const cvType = app.cv?.file_url
      ? 'file'
      : app.cv?.content
      ? 'online'
      : 'unknown';

    const formattedCv =
      cvType === 'file'
        ? {
            type: 'file',
            title: app.cv.title,
            file_url: app.cv.file_url,
          }
        : cvType === 'online'
        ? {
            type: 'online',
            title: app.cv.title,
            template_id: app.cv.template_id,
            content: app.cv.content,
          }
        : null;

    return {
      id: app.id,
      status: app.status,
      applied_at: app.applied_at,
      job: app.job,
      candidate: app.candidate,
      cv: formattedCv,
    };
}

async acceptApplication(accountId: bigint, appId: bigint) {
  const company = await this.prisma.company.findUnique({
    where: { account_id: accountId },
  });
  if (!company) throw new ForbiddenException('Bạn chưa có công ty.');

  const app = await this.prisma.application.findFirst({
    where: { id: appId, job: { company_id: company.id } },
  });
  if (!app) throw new NotFoundException('Đơn ứng tuyển không tồn tại.');
  if (app.status !== ApplicationStatus.pending)
    throw new BadRequestException('Chỉ có thể duyệt đơn đang ở trạng thái pending.');

  const updated = await this.prisma.application.update({
    where: { id: app.id },
    data: { status: ApplicationStatus.accepted },
  });

  // TODO: gửi thông báo realtime hoặc email cho ứng viên ở đây
  return { message: 'Đã duyệt đơn ứng tuyển.', application: updated };
}

async rejectApplication(accountId: bigint, appId: bigint) {
  const company = await this.prisma.company.findUnique({
    where: { account_id: accountId },
  });
  if (!company) throw new ForbiddenException('Bạn chưa có công ty.');

  const app = await this.prisma.application.findFirst({
    where: { id: appId, job: { company_id: company.id } },
  });
  if (!app) throw new NotFoundException('Đơn ứng tuyển không tồn tại.');
  if (app.status !== ApplicationStatus.pending)
    throw new BadRequestException('Chỉ có thể từ chối đơn đang ở trạng thái pending.');

  const updated = await this.prisma.application.update({
    where: { id: app.id },
    data: { status: ApplicationStatus.rejected },
  });

  // TODO: gửi notification cho ứng viên
  return { message: 'Đã từ chối đơn ứng tuyển.', application: updated };
}
}