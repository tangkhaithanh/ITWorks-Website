import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CookieOptions, Response } from 'express';
import {LoginDTO } from './dto/login.dto';
import { MailService } from 'src/common/services/mail.service';
import {RegisterUserDto} from './dto/register.dto';
import { Request } from 'express';
const ACCESS_EXPIRES_MS = 15 * 60 * 1000;         // 15m
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7d
@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
        private configService: ConfigService,
    ) {}

    private cookieBase(): CookieOptions {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProd, // prod: true, dev: false
      sameSite: (isProd ? 'none' : 'lax') as CookieOptions['sameSite'],
      path: '/',
    };
}

  private signAccess(payload: any) {
  return this.jwtService.signAsync(payload, {
    secret: this.configService.get<string>('jwt.accessSecret'),
    expiresIn: this.configService.get<string>('jwt.accessExpiresIn'),
  });
}

private signRefresh(payload: any) {
  return this.jwtService.signAsync(payload, {
    secret: this.configService.get<string>('jwt.refreshSecret'),
    expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
  });
}

// Hàm đăng nhập
async login(dto: LoginDTO, res: Response) {
  const account = await this.prisma.account.findUnique({
    where: { email: dto.email },
  });
      if (!account) throw new UnauthorizedException('Invalid credentials');

      const ok = await bcrypt.compare(dto.password, account.password);
      if (!ok) throw new UnauthorizedException('Invalid email or password');
      if (account.status !== 'active') throw new UnauthorizedException('Account not active');

      const payload = { sub: account.id.toString(), role: account.role };

      const accessToken = await this.signAccess(payload);
      const refreshToken = await this.signRefresh(payload);

      // Lưu hash refresh token vào DB (stateful)
      const hashedRt = await bcrypt.hash(refreshToken, 10);
      await this.prisma.account.update({
        where: { id: account.id },
        data: { refreshToken: hashedRt },
      });

      // Set cookies
      res.cookie('access_token', accessToken, {
        ...this.cookieBase(),
        maxAge: ACCESS_EXPIRES_MS,
      });
      res.cookie('refresh_token', refreshToken, {
        ...this.cookieBase(),
        maxAge: REFRESH_EXPIRES_MS,
      });

      // Trả kèm thời gian hết hạn access để FE (nếu thích) đặt timer proactive
      return { message: 'Login successful', access_expires_in: 15 * 60 };
  }

  // Refresh + Rotate: nếu hợp lệ thì cấp MỚI cả access và refresh
  async refresh(req: Request, res: Response) {
    const rt = req.cookies?.['refresh_token'];
    if (!rt) throw new UnauthorizedException('No refresh token');

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(rt, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      // Hết hạn hoặc sai chữ ký
      res.clearCookie('access_token', this.cookieBase());
      res.clearCookie('refresh_token', this.cookieBase());
      throw new UnauthorizedException('Refresh token invalid/expired');
    }

    const accountId = BigInt(payload.sub);

    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account || !account.refreshToken) throw new UnauthorizedException();

    // Khớp refresh token trong cookie với hash trong DB
    const match = await bcrypt.compare(rt, account.refreshToken);
    if (!match) {
      // Có thể do bị rotate trước đó hoặc bị đánh cắp → fail
      res.clearCookie('access_token', this.cookieBase());
      res.clearCookie('refresh_token', this.cookieBase());
      throw new UnauthorizedException('Refresh token mismatched');
    }

    // ✅ ROTATE: cấp token mới & cập nhật DB
    const newPayload = { sub: payload.sub, role: payload.role };
    const newAccess = await this.signAccess(newPayload);
    const newRefresh = await this.signRefresh(newPayload);
    const newHashedRt = await bcrypt.hash(newRefresh, 10);

    await this.prisma.account.update({
      where: { id: accountId },
      data: { refreshToken: newHashedRt },
    });

    res.cookie('access_token', newAccess, {
      ...this.cookieBase(),
      maxAge: ACCESS_EXPIRES_MS,
    });
    res.cookie('refresh_token', newRefresh, {
      ...this.cookieBase(),
      maxAge: REFRESH_EXPIRES_MS, // ⬅️ “sliding” 7 ngày tính lại từ bây giờ
    });

    return { message: 'Token refreshed', access_expires_in: 15 * 60 };
  }

    // Register candidate
   async registerCandidate(dto: RegisterUserDto) {
    try {
        const exists = await this.prisma.account.findUnique({ where: { email: dto.email } });
        if (exists) throw new BadRequestException('Email already registered');

        const hashed = await bcrypt.hash(dto.password, 10);

        const account = await this.prisma.account.create({
        data: {
            email: dto.email,
            password: hashed,
            role: 'candidate',
            status: 'pending',
        },
        });

        const user = await this.prisma.user.create({
        data: {
            account_id: account.id,
            full_name: dto.fullName,
            phone: dto.phone,
            dob: dto.dob ? new Date(dto.dob) : undefined,
            gender: dto.gender,
            address: dto.address,
            avatar_url: dto.avatarUrl,
        },
        });

        await this.prisma.candidate.create({
        data: { user_id: user.id },
        });

        const token = await this.jwtService.signAsync(
        { sub: account.id.toString(), purpose: 'verify-email' },
        { expiresIn: '10m' },
        );
        const link = `http://localhost:3000/auth/verify-email?token=${token}`;
        await this.mailService.sendVerificationMail(account.email, link, user.full_name);
        return { message: 'Please check your email to verify account' };
    } catch (error) {
        console.error(error);
        throw error; // hoặc xử lý/log lỗi tại đây nếu muốn
    }
}
    async registerRecruiter(dto: RegisterUserDto) {
    try {
        const exists = await this.prisma.account.findUnique({ where: { email: dto.email } });
        if (exists) throw new BadRequestException('Email already registered');

        const hashed = await bcrypt.hash(dto.password, 10);

        const account = await this.prisma.account.create({
        data: {
            email: dto.email,
            password: hashed,
            role: 'recruiter',
            status: 'pending',
        },
        });

        // Tạo user profile gắn với account
        const user = await this.prisma.user.create({
        data: {
            account_id: account.id,
            full_name: dto.fullName,
            phone: dto.phone,
            dob: dto.dob ? new Date(dto.dob) : undefined,
            gender: dto.gender,
            address: dto.address,
            avatar_url: dto.avatarUrl,
        },
        });

        // Tạo token verify email
        const token = await this.jwtService.signAsync(
        { sub: account.id.toString(), purpose: 'verify-email' },
        { expiresIn: '15m' },
        );
        const link = `http://localhost:3000/auth/verify-email?token=${token}`;

        // Gửi mail verify
        await this.mailService.sendVerificationMail(account.email, link, user.full_name);

        return { message: 'Please check your email to verify account' };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

    // xác nhận email:
    async verifyEmail(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      if (payload.purpose !== 'verify-email') {
        throw new BadRequestException('Invalid token purpose');
      }

      await this.prisma.account.update({
        where: { id: payload.sub },
        data: { status: 'active' },
      });

      return { message: 'Account verified successfully' };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Invalid or expired token');
    }
  }
    // Gửi link quên mật khẩu qua mail:
    async sendResetPasswordEmail(email: string) {
    try {
      const account = await this.prisma.account.findUnique({ where: { email } });

      if (account) {
        const token = await this.jwtService.signAsync(
          { sub: account.id.toString(), purpose: 'reset-password' },
          { expiresIn: '10m' },
        );

        const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        console.log("📩 Reset password link:", link);

        await this.mailService.sendResetPasswordMail(email, link);
      }

      return { message: 'Nếu email tồn tại, bạn sẽ nhận được email reset mật khẩu' };
    } catch (err) {
      console.error("❌ Lỗi gửi mail:", err);
      throw new InternalServerErrorException("Không thể gửi email, vui lòng thử lại sau");
    }
  }


    // Hàm đặt lại mật khẩu
    async resetPassword(token: string, newPassword: string) {
      try {
        const payload = await this.jwtService.verifyAsync(token);

        if (payload.purpose !== 'reset-password') {
          throw new BadRequestException('Invalid token purpose');
        }

        // ✅ convert về BigInt vì account.id trong Prisma là BigInt
        const accountId = BigInt(payload.sub);

        const hashed = await bcrypt.hash(newPassword, 10);

        await this.prisma.account.update({
          where: { id: accountId },
          data: { password: hashed },
        });

        return { message: 'Password reset successfully' };
      } catch {
        throw new BadRequestException('Invalid or expired token');
      }
    }

async getMe(accountId: bigint) {
  try {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { user: true, company: true },
    });

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    const { password, ...safeData } = account;

    // Convert BigInt -> string trước khi return
    const transformBigInt = (obj: any) =>
      JSON.parse(
        JSON.stringify(obj, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      );

    return transformBigInt(safeData);
  } catch (error) {
    throw error;
  }
}

async logout(accountId: bigint, res: Response) {
  await this.prisma.account.update({
    where: { id: accountId },
    data: { refreshToken: null },
  });

  // dùng lại cookieBase() cho đồng bộ với lúc set
  res.clearCookie('access_token', this.cookieBase());
  res.clearCookie('refresh_token', this.cookieBase());

  return { message: 'Logout successful' };
}
async verifyResetToken(token: string) {
  try {
    const payload = await this.jwtService.verifyAsync(token);
    if (payload.purpose !== "reset-password") {
      throw new BadRequestException("Invalid token purpose");
    }
    return { valid: true };
  } catch (e) {
    throw new BadRequestException("Token invalid or expired");
    }
  }
}