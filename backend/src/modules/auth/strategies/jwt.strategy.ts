import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload.type';
import { PrismaService } from '@/prisma/prisma.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.access_token || null, // lấy từ cookie HttpOnly
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET as string, // 👈 ép kiểu
    });
  }

  async validate(payload: JwtPayload) {
    const accountId = BigInt(payload.sub);

    const user = await this.prisma.user.findUnique({
      where: { account_id: accountId },
      select: { id: true },
    });

    return {
      accountId,
      userId: user ? user.id : null,
      role: payload.role,
    };
  }
}
