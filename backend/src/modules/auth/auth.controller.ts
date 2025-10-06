import { Controller, Post, Body, Res, Query, UseGuards, Get, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterUserDto } from "./dto/register.dto";
import type { Response } from "express";
import { LoginDTO } from "./dto/login.dto";
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from "../../common/decorators/user.decorator";
import type { Request } from "express";
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body() dto: LoginDTO, @Res({ passthrough: true }) res: Response) {
        return this.authService.login(dto, res);
    }
    
    @Post('register-candidate')
    async registerCandidate(@Body() dto: RegisterUserDto) {
        return this.authService.registerCandidate(dto);
    }

    @Post('register-recruiter')
    async registerRecruiter(@Body() dto: RegisterUserDto) {
        return this.authService.registerRecruiter(dto);
    }

    @Get('verify-email')
    async verifyEmail(@Query('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @Post('request-send')
    async sendResetPasswordEmail(@Body('email') email: string) {
        return this.authService.sendResetPasswordEmail(email);
    }

    @Post('reset-password')
    async resetPassword(@Body('token') token: string, @Body('newPassword') newPassword: string) {
        return this.authService.resetPassword(token, newPassword);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMe(@User('userId') userId: bigint) {
    console.log('👉 Controller getMe với userId:', userId);
    return this.authService.getMe(userId);
    }
    
    @Post('logout')
    @UseGuards(JwtAuthGuard) // dùng access token còn sống, hoặc gọi ngay sau refresh
    async logout(@User('userId') userId: bigint, @Res({ passthrough: true }) res: Response) {
        return this.authService.logout(userId, res);
    }

    @Post('verify-reset-token')
    async verifyResetToken(@Body('token') token: string) {
    return this.authService.verifyResetToken(token);
    }

    @Post('refresh')
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        return this.authService.refresh(req, res);
    }
}