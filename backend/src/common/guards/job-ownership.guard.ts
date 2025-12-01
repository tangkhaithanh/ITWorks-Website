import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class JobOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // từ JWT
    const jobId = BigInt(req.params.id);

    // 1) Lấy job
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        company_id: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy công việc');
    }

    // 2) Lấy company_id của recruiter (qua bảng Company)
    const company = await this.prisma.company.findUnique({
      where: { account_id: user.accountId },
      select: { id: true },
    });

    if (!company) {
      throw new ForbiddenException(
        'Tài khoản của bạn không thuộc công ty nào, không thể chỉnh sửa job',
      );
    }

    // 3) So sánh company_id
    if (job.company_id !== company.id) {
      throw new ForbiddenException(
        'Bạn không có quyền chỉnh sửa job của công ty khác',
      );
    }

    // 4) Gắn job vào request để controller/service dùng
    req.job = job;
    return true;
  }
}
