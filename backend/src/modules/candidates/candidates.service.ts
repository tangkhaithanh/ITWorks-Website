import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

@Injectable()
export class CandidatesService {
  constructor(private prisma: PrismaService) {}

  // Lấy hồ sơ ứng vien theo user ID
  async getCandidateByUserId(userId: bigint) {
    console.log('Getting candidate for userId:', userId);
    const candidate = await this.prisma.candidate.findUnique({
      where: { user_id: userId },
    });
    if (!candidate)
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    return candidate;
  }

  // Lưu job
  async saveJob(userId: bigint, jobId: bigint) {
    const candidate = await this.getCandidateByUserId(userId);

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Công việc không tồn tại');

    const exists = await this.prisma.savedJob.findFirst({
      where: { candidate_id: candidate.id, job_id: jobId },
    });
    if (exists) throw new BadRequestException('Bạn đã lưu công việc này rồi');

    return this.prisma.savedJob.create({
      data: { candidate_id: candidate.id, job_id: jobId },
    });
  }

  // Hủy lưu job:
  async unsaveJob(userId: bigint, jobId: bigint) {
    const candidate = await this.getCandidateByUserId(userId);

    const saved = await this.prisma.savedJob.findFirst({
      where: { candidate_id: candidate.id, job_id: jobId },
    });
    if (!saved) throw new NotFoundException('Bạn chưa lưu công việc này');

    await this.prisma.savedJob.delete({ where: { id: saved.id } });
    return { message: 'Đã hủy lưu công việc' };
  }
  // Lấy danh sách công việc đã lưu:
  async getSavedJobs(userId: bigint) {
    const candidate = await this.getCandidateByUserId(userId);
    return this.prisma.savedJob.findMany({
      where: { candidate_id: candidate.id },
      include: {
        job: {
          include: { category: true },
        },
      },
      orderBy: { saved_at: 'desc' },
    });
  }

  async checkSavedJob(userId: bigint, jobId: bigint) {
    const candidate = await this.getCandidateByUserId(userId);
    const exists = await this.prisma.savedJob.findFirst({
      where: { candidate_id: candidate.id, job_id: jobId },
    });
    return { isSaved: !!exists };
  }

  // Lưu thông tin candidate:
  async create(userId: bigint, dto: CreateCandidateDto) {
    try {
      const candidate = await this.prisma.candidate.create({
        data: {
          user_id: userId,
          preferred_city: dto.preferred_city,
          preferred_work_mode: dto.preferred_work_mode,
          preferred_category: dto.preferred_category
            ? BigInt(dto.preferred_category)
            : undefined,
          preferred_salary: dto.preferred_salary,
        },
      });

      // Handle skills
      if (dto.skills?.length) {
        await this.prisma.candidateSkill.createMany({
          data: dto.skills.map((skillId) => ({
            candidate_id: candidate.id,
            skill_id: Number(skillId),
          })),
        });
      }

      return {
        message: 'Tạo hồ sơ ứng viên thành công',
        candidate,
      };
    } catch (error) {
      console.error('❌ Lỗi khi lấy danh sách CV:', error);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách CV, vui lòng thử lại sau',
      );
    }
  }

  async update(id: bigint, dto: UpdateCandidateDto) {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id },
      });

      if (!candidate) throw new NotFoundException('Không tìm thấy ứng viên');

      // Tạo payload update (loại bỏ null / undefined)
      const updatePayload: any = { ...dto };

      Object.keys(updatePayload).forEach((key) => {
        const val = updatePayload[key];

        if (val === undefined || val === null) {
          delete updatePayload[key];
        }
      });

      // Xử lý BigInt field
      if (updatePayload.preferred_category !== undefined) {
        updatePayload.preferred_category = BigInt(
          updatePayload.preferred_category,
        );
      }

      // Xóa skills khỏi payload vì xử lý riêng
      delete updatePayload.skills;

      // Update candidate
      if (Object.keys(updatePayload).length > 0) {
        await this.prisma.candidate.update({
          where: { id },
          data: updatePayload,
        });
      }

      // SKILLS processing
      if (dto.skills !== undefined) {
        await this.prisma.candidateSkill.deleteMany({
          where: { candidate_id: id },
        });

        if (dto.skills.length > 0) {
          await this.prisma.candidateSkill.createMany({
            data: dto.skills.map((skillId) => ({
              candidate_id: id,
              skill_id: Number(skillId),
            })),
          });
        }
      }
      return {
        message: 'Cập nhật hồ sơ ứng viên thành công',
        candidate,
      };
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật hồ sơ ứng viên:', error);
      throw new InternalServerErrorException(
        'Không thể cập nhật hồ sơ ứng viên, vui lòng thử lại sau',
      );
    }
  }

  // Lấy thông tin của một user hoàn chỉnh:
  async getFullUserProfile(accountId: bigint) {
    const user = await this.prisma.user.findUnique({
      where: { account_id: accountId },
      include: {
        account: { select: { email: true } },
        candidate: {
          include: {
            skills: { include: { skill: true } },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Không tìm thấy user');

    const { account, ...rest } = user;

    // --- Sửa type ở đây 👇 ---
    let preferredCategoryName: string | null = null;

    if (user.candidate?.preferred_category) {
      const category = await this.prisma.jobCategory.findUnique({
        where: { id: BigInt(user.candidate.preferred_category) },
      });

      preferredCategoryName = category?.name ?? null;
    }

    return {
      ...rest,
      email: account.email,
      candidate: {
        ...rest.candidate,
        preferred_category_name: preferredCategoryName,
      },
    };
  }
}
