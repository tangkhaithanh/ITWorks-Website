import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AccountQueryDto } from './dto/account-query.dto';
import * as bcrypt from 'bcrypt';
import { Prisma, Status } from '@prisma/client';
import { MailService } from '@/common/services/mail.service';
import { CreateAdminDto } from './dto/create-admin.dto';
@Injectable()
export class AccountService {
    constructor(private readonly prisma: PrismaService,
        private readonly mailService: MailService
    ) { }
    // 1. Lấy toàn bộ account có trong hệ thống
    async list(query: AccountQueryDto) {
        const { page, limit, search, status, role } = query;

        const where: any = {};

        if (status) where.status = status;
        if (role) where.role = role;

        if (search) {
            where.OR = [
                { email: { contains: search } },
                {
                    user: {
                        full_name: { contains: search },
                    },
                },
                {
                    user: {
                        phone: { contains: search },
                    },
                },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.account.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    user: true,
                    company: true,
                },
            }),
            this.prisma.account.count({ where }),
        ]);

        return {
            page,
            limit,
            total,
            data,
        };
    }
    // 2. Lấy thông tin chi tiết của 1 account
    async detail(accountId: bigint) {
        const acc = await this.prisma.account.findUnique({
            where: { id: accountId },
            include: {
                user: true,
                company: true,
            },
        });
        if (!acc) throw new NotFoundException('Không tìm thấy tài khoản');
        return acc;
    }

    //3.  Update lại trạng thái của tài khoản:
    async updateStatus(accountId: bigint, status: Status) {
        const acc = await this.prisma.account.update({
            where: { id: accountId },
            data: { status },
        });
        if (!acc) throw new NotFoundException('Không tìm thấy tài khoản');
        return {
            message: 'Cập nhật trạng thái tài khoản thành công',
        };
    }

    //4.  Reset lại mật khẩu của một tài khoản:
    async resetPassword(accountId: bigint) {
        const account = await this.prisma.account.findUnique({
            where: { id: accountId },
            include: { user: true },
        });

        if (!account) throw new NotFoundException('Không tìm thấy tài khoản');

        // 1) Tạo mật khẩu random mạnh
        const tempPassword = this.generateTempPassword();

        // 2) Hash password
        const hashed = await bcrypt.hash(tempPassword, 10);

        // 3) Cập nhật tài khoản → must_change_password = true
        await this.prisma.account.update({
            where: { id: accountId },
            data: {
                password: hashed,
                must_change_password: true,
            },
        });

        // 4) Gửi email thông báo mật khẩu tạm
        await this.mailService.sendTemporaryPasswordMail(
            account.email,
            account.user?.full_name ?? 'Bạn',
            tempPassword,
        );

        return {
            message: 'Reset mật khẩu thành công. Mật khẩu tạm thời đã được gửi đến email người dùng.',
        };
    }
    //5. Tạo tài khoản admin:
    async createAdmin(dto: CreateAdminDto) {
        try {
            // Kiểm tra email đã tồn tại?
            const exists = await this.prisma.account.findUnique({
                where: { email: dto.email },
            });

            if (exists) {
                throw new ConflictException('Email này đã tồn tại.');
            }

            // Hash password
            const hashed = await bcrypt.hash(dto.password, 10);

            // Tạo account + user profile
            const admin = await this.prisma.account.create({
                data: {
                    email: dto.email,
                    password: hashed,
                    role: 'admin',
                    status: 'active',
                    must_change_password: false,
                    user: {
                        create: { full_name: dto.full_name },
                    },
                },
            });
            // Trả về message đơn giản
            return { message: 'Tạo tài khoản admin thành công.' };

        } catch (error) {
            if (error instanceof ConflictException) throw error;
            console.error('Lỗi khi tạo admin:', error);
            throw new Error('Không thể tạo tài khoản admin. Vui lòng thử lại sau.');
        }
    }


    private generateTempPassword(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let pass = '';
        for (let i = 0; i < 10; i++) {
            pass += chars[Math.floor(Math.random() * chars.length)];
        }
        return pass;
    }
}