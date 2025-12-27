import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

@Injectable()
export class CompaniesPlansService {
  constructor(private prisma: PrismaService) {}

  // =========================================================================
  // A. HELPERS
  // =========================================================================

  private async getCompanyIdByAccount(
    accountId: bigint,
    tx: Tx = this.prisma,
  ): Promise<bigint> {
    try {
      const company = await tx.company.findUnique({
        where: { account_id: accountId },
        select: { id: true },
      });

      if (!company)
        throw new NotFoundException(
          'Tài khoản chưa liên kết với thông tin công ty.',
        );
      return company.id;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error getCompanyIdByAccount:', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi lấy ID công ty.',
      );
    }
  }

  // =========================================================================
  // B. ASSIGN PLAN (CORE LOGIC: Idempotency, Rollover, Snapshot)
  // =========================================================================

  /**
   * Hàm xử lý Transaction cấp gói.
   * Đảm bảo: Không race condition, không double charge, lịch sử đúng timeline.
   */
  async assignPlanStackQuotaTx(
    tx: Tx,
    companyId: bigint,
    newPlanId: bigint,
    orderId?: bigint,
  ) {
    // 🔒 1. IDEMPOTENCY CHECK (Application Layer)
    // Dù DB đã có unique constraint, ta check thêm ở đây để trả lỗi rõ ràng
    if (orderId) {
      const exists = await tx.companyPlan.findFirst({
        where: { order_id: orderId },
      });
      if (exists)
        throw new ConflictException(
          'Đơn hàng này đã được kích hoạt gói dịch vụ rồi.',
        );

      const existsHistory = await tx.companyPlanHistory.findFirst({
        where: { order_id: orderId },
      });
      if (existsHistory)
        throw new ConflictException(
          'Đơn hàng này đã nằm trong lịch sử giao dịch.',
        );
    }

    const newPlan = await tx.plan.findUnique({ where: { id: newPlanId } });
    if (!newPlan) throw new NotFoundException('Gói dịch vụ không tồn tại.');

    const currentPlan = await tx.companyPlan.findUnique({
      where: { company_id: companyId },
    });
    const now = new Date();

    let rolloverJobs = 0;
    let rolloverCredits = 0;

    // 🔄 2. XỬ LÝ GÓI CŨ (Nếu có)
    if (currentPlan) {
      const isActive =
        currentPlan.status === 'active' && currentPlan.end_date > now;

      // 🛑 Rule: Chặn Downgrade/Renew khi còn hạn
      if (isActive && newPlan.price <= currentPlan.purchased_price) {
        throw new ForbiddenException(
          'Gói hiện tại vẫn còn hiệu lực. Bạn chỉ có thể NÂNG CẤP lên gói cao hơn.',
        );
      }

      // ✅ Rule: Tính Rollover (Chỉ khi gói đang active)
      if (isActive) {
        // Logic mới: Cộng dồn dựa trên số dư thực tế (jobs_left)
        rolloverJobs = currentPlan.jobs_left;
        rolloverCredits = currentPlan.credits_left;
      }

      // 🕒 Rule: History Timeline Correctness
      // Nếu active -> End date là NOW (cắt ngắn). Nếu đã expired -> Giữ nguyên end date cũ.
      const historyEndDate = isActive ? now : currentPlan.end_date;

      // Tính toán usage để lưu history
      const jobsUsed = currentPlan.job_limit_snapshot - currentPlan.jobs_left;
      const creditsUsed =
        currentPlan.credit_amount_snapshot - currentPlan.credits_left;

      await tx.companyPlanHistory.create({
        data: {
          company_id: companyId,
          plan_id: currentPlan.plan_id,
          purchased_price: currentPlan.purchased_price,
          job_limit_snapshot: currentPlan.job_limit_snapshot,
          credit_amount_snapshot: currentPlan.credit_amount_snapshot,

          start_date: currentPlan.start_date,
          end_date: historyEndDate, // <-- Correct

          jobs_used: jobsUsed,
          credits_used: creditsUsed,

          status: isActive ? 'completed' : 'expired',
          order_id: currentPlan.order_id, // Lưu lại order gốc của gói cũ
        },
      });

      // Không cần update status expired cho gói cũ, upsert bên dưới sẽ lo việc thay thế
    }

    // 🆕 3. TẠO GÓI MỚI (UPSERT)
    const newEndDate = new Date(
      now.getTime() + newPlan.duration_days * 24 * 60 * 60 * 1000,
    );

    // Cộng dồn Quota: Mới + Thừa
    const finalJobLimit = newPlan.job_limit + rolloverJobs;
    const finalCredit = newPlan.credit_amount + rolloverCredits;

    // DB Constraint (Unique order_id) sẽ bảo vệ Idempotency ở bước này nếu App Layer check sót
    await tx.companyPlan.upsert({
      where: { company_id: companyId },
      create: {
        company_id: companyId,
        plan_id: newPlan.id,
        start_date: now,
        end_date: newEndDate,
        purchased_price: newPlan.price, // Snapshot giá

        // Snapshot Quota
        job_limit_snapshot: finalJobLimit,
        jobs_left: finalJobLimit, // Reset left = limit

        credit_amount_snapshot: finalCredit,
        credits_left: finalCredit,

        status: 'active',
        order_id: orderId ?? null, // Trace nguồn gốc
      },
      update: {
        plan_id: newPlan.id,
        start_date: now,
        end_date: newEndDate,
        purchased_price: newPlan.price,

        job_limit_snapshot: finalJobLimit,
        jobs_left: finalJobLimit,

        credit_amount_snapshot: finalCredit,
        credits_left: finalCredit,

        status: 'active',
        order_id: orderId ?? null,
      },
    });

    // 📒 4. LEDGER CREDIT (Full Context)
    await tx.creditTransaction.create({
      data: {
        company_id: companyId,
        amount: newPlan.credit_amount, // Log số thực nhận từ gói mới
        type: 'grant',
        job_id: null,
        order_id: orderId ?? null, // Trace được tiền từ đơn nào
        plan_id: newPlan.id, // Trace được từ gói nào
      },
    });

    // Trả về Object đơn giản (No BigInt)
    return {
      success: true,
      message: 'Kích hoạt gói thành công!',
      plan_name: newPlan.name,
      new_quota: {
        jobs: finalJobLimit,
        credits: finalCredit,
      },
    };
  }

  // Wrapper Transaction
  async assignPlanStackQuota(
    accountId: bigint,
    newPlanId: bigint,
    orderId?: bigint,
  ) {
    try {
      const companyId = await this.getCompanyIdByAccount(accountId);
      return await this.prisma.$transaction((tx) =>
        this.assignPlanStackQuotaTx(tx, companyId, newPlanId, orderId),
      );
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      console.error('CRITICAL assignPlan Error:', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi kích hoạt gói dịch vụ.',
      );
    }
  }

  // =========================================================================
  // C. CONSUME JOB (ATOMIC & RACE-CONDITION FREE)
  // =========================================================================

  async consumeJobQuota(accountId: bigint) {
    try {
      const companyId = await this.getCompanyIdByAccount(accountId);
      const now = new Date();

      return await this.prisma.$transaction(async (tx) => {
        // 1. Check Active (Read-only check)
        const current = await tx.companyPlan.findUnique({
          where: { company_id: companyId },
        });

        if (
          !current ||
          current.status !== 'active' ||
          current.end_date <= now
        ) {
          throw new ForbiddenException(
            'Bạn chưa có gói dịch vụ hoặc gói đã hết hạn.',
          );
        }

        // 2. ATOMIC UPDATE (Database Level Lock)
        // updateMany + điều kiện 'gt: 0' đảm bảo không bao giờ trừ âm,
        // và không bị race condition khi 2 request cùng đọc 1 giá trị.
        const result = await tx.companyPlan.updateMany({
          where: {
            id: current.id,
            jobs_left: { gt: 0 }, // Điều kiện tiên quyết: Phải còn job
          },
          data: {
            jobs_left: { decrement: 1 }, // Trừ trực tiếp trong DB Engine
          },
        });

        if (result.count === 0) {
          throw new ForbiddenException(
            'Đã hết lượt đăng tin (Quota exhausted). Vui lòng nâng cấp gói.',
          );
        }

        return { success: true, remaining: current.jobs_left - 1 };
      });
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      console.error('Error consumeJobQuota:', error);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi trừ lượt đăng tin.',
      );
    }
  }

  // =========================================================================
  // D. CONSUME CREDIT (ATOMIC & TRACEABLE)
  // =========================================================================

  async consumeCreditQuota(accountId: bigint, amount: number, jobId?: bigint) {
    if (amount <= 0) throw new ForbiddenException('Số credit không hợp lệ.');

    try {
      const companyId = await this.getCompanyIdByAccount(accountId);
      const now = new Date();

      return await this.prisma.$transaction(async (tx) => {
        const current = await tx.companyPlan.findUnique({
          where: { company_id: companyId },
        });

        if (
          !current ||
          current.status !== 'active' ||
          current.end_date <= now
        ) {
          throw new ForbiddenException('Gói dịch vụ không khả dụng.');
        }

        // Atomic Update
        const result = await tx.companyPlan.updateMany({
          where: {
            id: current.id,
            credits_left: { gte: amount }, // Check đủ tiền
          },
          data: {
            credits_left: { decrement: amount },
          },
        });

        if (result.count === 0) {
          throw new ForbiddenException('Số dư Credit không đủ.');
        }

        // Log Transaction
        await tx.creditTransaction.create({
          data: {
            company_id: companyId,
            amount: -amount,
            type: 'boost',
            job_id: jobId ?? null,
            order_id: null, // Chi tiêu thì không có order_id mua hàng
            plan_id: current.plan_id, // Trace xem tiêu tiền của gói nào (Optional, nhưng good to have)
          },
        });

        return { success: true };
      });
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      console.error('Error consumeCreditQuota:', error);
      throw new InternalServerErrorException('Lỗi hệ thống khi trừ credit.');
    }
  }

  // =========================================================================
  // E. SUMMARY & OPTIONS (READ ONLY)
  // =========================================================================

  async getCurrentPlanSummary(accountId: bigint) {
    try {
      const companyId = await this.getCompanyIdByAccount(accountId);
      const now = new Date();

      const current = await this.prisma.companyPlan.findFirst({
        where: {
          company_id: companyId,
          status: 'active',
          end_date: { gt: now },
        },
        include: { plan: true },
      });

      if (!current) return null;

      // Tính toán display data (Vì DB lưu jobs_left, nên used = limit - left)
      const usedJobs = current.job_limit_snapshot - current.jobs_left;

      return {
        current_plan: {
          id: current.plan_id.toString(),
          name: current.plan.name,
          price: current.purchased_price.toString(),
          features: current.plan.features,
          start_date: current.start_date,
          end_date: current.end_date,
        },
        quota: {
          jobs: {
            total: current.job_limit_snapshot,
            used: usedJobs,
            remaining: current.jobs_left, // Lấy trực tiếp từ DB
          },
          credits: {
            total: current.credit_amount_snapshot,
            remaining: current.credits_left,
          },
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error getCurrentPlanSummary:', error);
      throw new InternalServerErrorException('Lỗi lấy thông tin gói.');
    }
  }

  async getUpgradeOptions(accountId: bigint) {
    try {
      const companyId = await this.getCompanyIdByAccount(accountId);
      const now = new Date();

      const current = await this.prisma.companyPlan.findFirst({
        where: {
          company_id: companyId,
          status: 'active',
          end_date: { gt: now },
        },
      });

      const allPlans = await this.prisma.plan.findMany({
        where: { is_hidden: false },
        orderBy: { price: 'asc' },
      });

      // Nếu chưa có gói -> Mua mới
      if (!current) {
        return allPlans.map((p) => ({
          ...p,
          price: p.price.toString(),
          can_buy: true,
          reason: 'new_purchase',
        }));
      }

      // Nếu có gói -> Logic Upgrade Check
      return allPlans.map((p) => {
        const isUpgrade = p.price > current.purchased_price;
        return {
          ...p,
          price: p.price.toString(),
          can_buy: isUpgrade,
          reason: isUpgrade ? 'upgrade' : 'downgrade_blocked',
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error getUpgradeOptions:', error);
      throw new InternalServerErrorException('Lỗi lấy danh sách gói.');
    }
  }
}
