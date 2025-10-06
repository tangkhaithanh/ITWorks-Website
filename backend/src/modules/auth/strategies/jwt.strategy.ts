import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.access_token || null, // lấy từ cookie HttpOnly
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET as string, // 👈 ép kiểu
    });
  }

  async validate(payload: JwtPayload) {
    console.log('👉 JwtStrategy.validate payload:', payload);
    return { userId: BigInt(payload.sub), role: payload.role };
  }
}
