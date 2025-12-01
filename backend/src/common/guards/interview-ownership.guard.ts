// src/common/guards/interview-ownership.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class InterviewOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // từ JWT
    const interviewId = BigInt(req.params.id);

    // Admin bypass nếu bạn muốn (tùy)
    if (user.role === 'admin') {
      return true;
    }

    // 1) Lấy interview → application → job → company
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      select: {
        id: true,
        application: {
          select: {
            job: {
              select: {
                company: {
                  select: { account_id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Không tìm thấy lịch phỏng vấn');
    }

    const ownerAccountId = interview.application.job.company.account_id;

    // 2) Check recruiter có đúng công ty sở hữu job?
    if (ownerAccountId !== user.accountId) {
      throw new ForbiddenException('Bạn không có quyền thao tác lịch phỏng vấn này');
    }

    // 3) Attach interview cho controller nếu muốn dùng
    req.interview = interview;

    return true;
  }
}
