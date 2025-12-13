import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CompaniesPlansService } from '../companies/companiesPlans.service';
import { VnpayService } from './vnpay.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
    constructor(
        private prisma: PrismaService,
        private vnpay: VnpayService,
        private companyPlans: CompaniesPlansService,
    ) { }

    private getClientIp(req: any) {
        const xff = req.headers?.['x-forwarded-for'];
        if (xff) return String(xff).split(',')[0].trim();
        return req.ip || req.connection?.remoteAddress || '127.0.0.1';
    }

    async createVnpayPaymentUrl(accountId: bigint, planId: bigint, req: any, bankCode?: string, locale?: 'vn' | 'en') {
        const company = await this.prisma.company.findFirst({
            where: { account_id: accountId },
            select: { id: true },
        });
        if (!company) throw new NotFoundException('Company not found');

        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) throw new NotFoundException('Plan not found');

        // tạo order pending
        const expiresAt = new Date(Date.now() + 15 * 60_000);

        const order = await this.prisma.paymentOrder.create({
            data: {
                company_id: company.id,
                plan_id: plan.id,
                amount: plan.price,
                status: 'pending',
                expired_at: expiresAt,
            },
        });

        const txnRef = order.id.toString();
        await this.prisma.paymentOrder.update({
            where: { id: order.id },
            data: { vnp_txn_ref: txnRef },
        });

        const { url } = this.vnpay.createPaymentUrl({
            txnRef,
            amountVnd: BigInt(plan.price.toString()),
            ipAddr: this.getClientIp(req),
            orderInfo: `Thanh toan plan ${plan.name} - order ${txnRef}`,
            bankCode,
            locale,
            expireMinutes: 15,
        });

        return {
            order_id: order.id.toString(),
            expires_at: expiresAt.toISOString(),
            payment_url: url,
        };
    }

    /**
     * Dùng chung cho cả IPN/Return: verify chữ ký -> tìm order -> idempotent update
     */
    async processVnpayCallback(rawQuery: Record<string, any>) {
        const vnp = this.vnpay.verifyCallback(rawQuery);

        const txnRef = vnp.vnp_TxnRef;
        if (!txnRef) throw new BadRequestException('Missing vnp_TxnRef');

        const order = await this.prisma.paymentOrder.findFirst({
            where: { vnp_txn_ref: txnRef },
        });
        if (!order) throw new NotFoundException('Order not found');

        // check amount (vnp_Amount trả về đã *100) :contentReference[oaicite:8]{index=8}
        const paidAmountVnd = Math.floor(Number(vnp.vnp_Amount ?? '0') / 100);
        const orderAmountVnd = Number(order.amount);

        if (paidAmountVnd !== orderAmountVnd) {
            await this.prisma.paymentOrder.update({
                where: { id: order.id },
                data: {
                    status: PaymentStatus.failed,
                    vnp_response_code: vnp.vnp_ResponseCode ?? null,
                    vnp_transaction_no: vnp.vnp_TransactionNo ?? null,
                },
            });
            throw new BadRequestException('Invalid amount');
        }


        const responseCode = vnp.vnp_ResponseCode ?? '';
        const transactionStatus = vnp.vnp_TransactionStatus ?? '';

        const isSuccess = responseCode === '00' && (transactionStatus === '' || transactionStatus === '00');

        // Idempotent + atomic: nếu pending -> update; nếu đã paid rồi -> bỏ qua
        await this.prisma.$transaction(async (tx) => {
            const fresh = await tx.paymentOrder.findUnique({ where: { id: order.id } });
            if (!fresh) throw new NotFoundException('Order not found');

            // auto-expire local
            if (fresh.status === 'pending' && fresh.expired_at && fresh.expired_at <= new Date() && !isSuccess) {
                await tx.paymentOrder.update({
                    where: { id: fresh.id },
                    data: { status: 'expired', vnp_response_code: responseCode || null },
                });
                return;
            }

            if (fresh.status !== 'pending') return;

            if (isSuccess) {
                // mark paid
                await tx.paymentOrder.update({
                    where: { id: fresh.id },
                    data: {
                        status: 'paid',
                        paid_at: new Date(),
                        vnp_transaction_no: vnp.vnp_TransactionNo ?? null,
                        vnp_response_code: responseCode || null,
                    },
                });

                // KÍCH HOẠT PLAN (quan trọng)
                // ==> cần 1 hàm assign dùng chung transaction (mình patch ở mục 4)
                await this.companyPlans.assignPlanStackQuotaTx(
                    tx,
                    fresh.company_id,
                    fresh.plan_id,
                    fresh.id,
                );
            } else {
                await tx.paymentOrder.update({
                    where: { id: fresh.id },
                    data: {
                        status: responseCode === '11' ? 'expired' : 'failed',
                        vnp_transaction_no: vnp.vnp_TransactionNo ?? null,
                        vnp_response_code: responseCode || null,
                    },
                });
            }
        });

        return {
            order_id: order.id.toString(),
            status: isSuccess ? 'paid' : 'failed',
            vnp_response_code: responseCode,
            vnp_transaction_no: vnp.vnp_TransactionNo ?? null,
        };
    }

    async getOrder(accountId: bigint, orderId: bigint) {
        const company = await this.prisma.company.findFirst({
            where: { account_id: accountId },
            select: { id: true },
        });
        if (!company) throw new NotFoundException('Company not found');

        const order = await this.prisma.paymentOrder.findFirst({
            where: { id: orderId, company_id: company.id },
            include: { plan: true },
        });
        if (!order) throw new NotFoundException('Order not found');

        return {
            id: order.id.toString(),
            status: order.status,
            amount: order.amount,
            plan: {
                id: order.plan.id.toString(),
                name: order.plan.name,
                price: order.plan.price.toString(),
            },
            paid_at: order.paid_at?.toISOString() ?? null,
            expires_at: order.expired_at?.toISOString() ?? null,
            vnp_response_code: order.vnp_response_code ?? null,
            vnp_transaction_no: order.vnp_transaction_no ?? null,
        };
    }
}
