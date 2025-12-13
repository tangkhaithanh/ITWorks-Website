import {
    Body,
    Controller,
    Get,
    Post,
    UseGuards,
} from '@nestjs/common';
import { CompaniesPlansService } from './companiesPlans.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { User } from '@/common/decorators/user.decorator';
import { AssignPlanDto } from './dto/assign-plan.dto';
import { ConsumeCreditDto } from './dto/consume-credit.dto';

@Controller('company/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.recruiter)
export class CompaniesPlansController {
    constructor(
        private readonly companiesPlansService: CompaniesPlansService,
    ) { }

    /**
     * =========================
     * A) CURRENT PLAN SUMMARY
     * =========================
     * Dùng cho trang Dashboard / Subscription
     * - Trả về null nếu chưa mua gói nào.
     * - Trả về thông tin gói + quota (đã rollover) nếu đang active.
     */
    @Get('summary')
    async getCurrentPlanSummary(@User('accountId') accountId: bigint) {
        return this.companiesPlansService.getCurrentPlanSummary(accountId);
    }

    /**
     * =========================
     * B) UPGRADE OPTIONS
     * =========================
     * Dùng cho trang Pricing / Upgrade
     * - Trả về danh sách gói.
     * - Có cờ `can_buy`: true/false dựa trên logic chặn downgrade.
     * - Có lý do `reason`: 'upgrade' | 'downgrade_blocked' | 'new_purchase'.
     */
    @Get('upgrade-options')
    async getUpgradeOptions(@User('accountId') accountId: bigint) {
        return this.companiesPlansService.getUpgradeOptions(accountId);
    }

    /**
     * =========================
     * C) ASSIGN / BUY PLAN
     * =========================
     * Gọi sau khi thanh toán thành công.
     * Logic: Chặn downgrade + Cộng dồn quota cũ (Rollover).
     */
    @Post('assign')
    async assignPlan(
        @User('accountId') accountId: bigint,
        @Body() dto: AssignPlanDto,
    ) {
        // Lưu ý: Hàm này trả về object CompanyPlan chứa BigInt.
        // Cần đảm bảo project có Interceptor để serialize BigInt -> String 
        // hoặc map dữ liệu trả về thủ công nếu cần.
        return this.companiesPlansService.assignPlanStackQuota(
            accountId,
            BigInt(dto.plan_id),
            dto.order_id ? BigInt(dto.order_id) : undefined,
        );
    }

    /**
     * =========================
     * D) CONSUME JOB QUOTA
     * =========================
     * Dùng khi Recruiter bấm nút "Đăng tin".
     * - Check quota hiện tại.
     * - Trừ 1 job.
     */
    @Post('consume/job')
    async consumeJobQuota(@User('accountId') accountId: bigint) {
        return this.companiesPlansService.consumeJobQuota(accountId);
    }

    /**
     * =========================
     * E) CONSUME CREDIT (BOOST JOB)
     * =========================
     * Dùng khi Recruiter bấm "Đẩy tin" / "Ghim tin".
     * - Trừ số credit tương ứng.
     */
    @Post('consume/credit')
    async consumeCredit(
        @User('accountId') accountId: bigint,
        @Body() dto: ConsumeCreditDto,
    ) {
        return this.companiesPlansService.consumeCreditQuota(
            accountId,
            dto.amount,
            dto.job_id ? BigInt(dto.job_id) : undefined,
        );
    }
}