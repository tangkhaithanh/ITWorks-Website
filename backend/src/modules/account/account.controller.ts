import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    ParseIntPipe,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountQueryDto } from './dto/account-query.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';

@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
export class AccountController {
    constructor(private readonly service: AccountService) { }

    // ======================================
    // 7. CREATE ADMIN (STATIC ROUTE FIRST)
    // ======================================
    @Post('create-admin')
    async createAdmin(@Body() dto: CreateAdminDto) {
        return this.service.createAdmin(dto);
    }

    // ======================================
    // 1. LIST ACCOUNTS
    // ======================================
    @Get()
    async list(@Query() query: AccountQueryDto) {
        return this.service.list(query);
    }

    // ======================================
    // 2. DETAIL ACCOUNT
    // ======================================
    @Get(':id')
    async detail(@Param('id', ParseIntPipe) id: number) {
        return this.service.detail(BigInt(id));
    }

    // ======================================
    // 3. ACTIVATE ACCOUNT
    // ======================================
    @Patch(':id/activate')
    async activate(@Param('id', ParseIntPipe) id: number) {
        return this.service.updateStatus(BigInt(id), 'active');
    }

    // ======================================
    // 4. BAN ACCOUNT
    // ======================================
    @Patch(':id/ban')
    async ban(@Param('id', ParseIntPipe) id: number) {
        return this.service.updateStatus(BigInt(id), 'banned');
    }

    // ======================================
    // 5. SET ACCOUNT TO PENDING
    // ======================================
    @Patch(':id/pending')
    async setPending(@Param('id', ParseIntPipe) id: number) {
        return this.service.updateStatus(BigInt(id), 'pending');
    }

    // ======================================
    // 6. RESET PASSWORD
    // ======================================
    @Patch(':id/reset-password')
    async resetPassword(@Param('id', ParseIntPipe) id: number) {
        return this.service.resetPassword(BigInt(id));
    }
}
