// src/common/guards/company-ownership.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CompanyOwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) { }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // payload từ JWT
    const companyId = BigInt(req.params.id);

    // ⚠️ Admin có quyền sửa bất kỳ công ty nào
    if (user.role === 'admin') {
      req.company = { id: companyId };
      return true;
    }

    // 1) Lấy công ty theo ID
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        account_id: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Không tìm thấy công ty');
    }

    // 2) Check quyền sở hữu
    if (company.account_id !== user.accountId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa công ty này');
    }

    // 3) Gắn vào request để controller/service dùng
    req.company = company;

    return true;
  }
}
