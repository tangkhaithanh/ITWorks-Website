import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { PrismaService } from '@/prisma/prisma.service';

export interface AuthenticatedUser {
  accountId: bigint;
  userId: bigint | null;
  role: string;
}

@Injectable()
export class WsAuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async authenticateSocket(client: Socket): Promise<AuthenticatedUser | null> {
    try {
      const cookieHeader = client.handshake.headers.cookie;
      if (!cookieHeader) {
        return null;
      }

      const cookies = this.parseCookies(cookieHeader);
      const token = cookies['access_token'];
      
      if (!token) {
        return null;
      }

      const secret = this.configService.get<string>('jwt.accessSecret');
      const payload: JwtPayload = this.jwtService.verify(token, { secret });

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
    } catch (error) {
      return null;
    }
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    cookieHeader.split(';').forEach((cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        cookies[key] = decodeURIComponent(value);
      }
    });
    
    return cookies;
  }
}
