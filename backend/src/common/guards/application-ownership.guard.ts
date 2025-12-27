// src/common/guards/application-ownership.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ApplicationOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // recruiter accountId từ JWT
    const applicationId = BigInt(req.params.id);

    // Nếu admin thì cho qua
    if (user.role === 'admin') return true;

    // 1) Lấy application và chain đến job → company
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        job: {
          select: {
            company: {
              select: { account_id: true },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển');
    }

    const ownerAccountId = application.job.company.account_id;

    // 2) Check recruiter có đúng công ty không
    if (ownerAccountId !== user.accountId) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác đơn ứng tuyển này',
      );
    }

    req.application = application; // attach data nếu cần

    return true;
  }
}
