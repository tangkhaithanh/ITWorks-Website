// src/common/guards/application-candidate.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ApplicationCandidateGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // candidate userId
    const appId = BigInt(req.params.id);

    const application = await this.prisma.application.findUnique({
      where: { id: appId },
      select: {
        id: true,
        candidate_id: true,
        candidate: {
          select: {
            user_id: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển');
    }

    // chỉ candidate chủ đơn mới xem được
    if (application.candidate.user_id !== user.userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập đơn này');
    }

    req.application = application;

    return true;
  }
}
