import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateVnpayPaymentDto } from './dto/create-vnpay-payment.dto';
import { ConfigService } from '@nestjs/config';

import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { User } from '@/common/decorators/user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { QueryPaymentOrdersDto } from './dto/query-payment-orders.dto';
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
    constructor(
        private readonly payments: PaymentsService,
        private readonly config: ConfigService,
    ) { }

    // =========================
    // CREATE VNPAY PAYMENT (Recruiter)
    // =========================
    @Post('vnpay/create')
    @Roles(Role.recruiter)
    create(
        @User('accountId') accountId: bigint,
        @Body() dto: CreateVnpayPaymentDto,
        @Query() req: any, // dùng để lấy ip, headers cho vnpay
    ) {
        return this.payments.createVnpayPaymentUrl(
            accountId,
            BigInt(dto.plan_id),
            req,
            dto.bank_code,
            dto.locale,
        );
    }

    // =========================
    // VNPAY RETURN URL (Public)
    // =========================
    @Public()
    @Get('vnpay/return')
    async vnpayReturn(@Query() query: any, @Res() res: any) {
        const fe = this.config.get<string>('FRONTEND_PAYMENT_RESULT_URL');

        try {
            const result = await this.payments.processVnpayCallback(query);

            // ✅ SUCCESS hoặc FAILED đều redirect
            return res.redirect(
                `${fe}?order_id=${result.order_id}&status=${result.status}`,
            );
        } catch (e: any) {
            console.error('VNPAY RETURN ERROR:', e?.message);

            // ✅ KỂ CẢ LỖI → vẫn redirect về FE
            return res.redirect(
                `${fe}?status=failed`
            );
        }
    }


    // =========================
    // VNPAY IPN (Public)
    // =========================
    @Public()
    @Get('vnpay/ipn')
    async vnpayIpn(@Query() query: any) {
        try {
            await this.payments.processVnpayCallback(query);
            return { RspCode: '00', Message: 'success' };
        } catch (e: any) {
            return { RspCode: '99', Message: e?.message ?? 'fail' };
        }
    }
    @Get('orders')
    @Roles(Role.recruiter)
    getMyOrders(
        @User('accountId') accountId: bigint,
        @Query() query: QueryPaymentOrdersDto,
    ) {
        return this.payments.getOrdersByRecruiter(accountId, query);
    }

    // =========================
    // GET ORDER DETAIL (Recruiter)
    // =========================
    @Get('orders/:id')
    @Roles(Role.recruiter)
    getOrder(
        @User('accountId') accountId: bigint,
        @Param('id') id: string,
    ) {
        return this.payments.getOrder(accountId, BigInt(id));
    }
}
