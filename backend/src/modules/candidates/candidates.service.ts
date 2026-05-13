import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { AiSyncProducer } from '@/modules/ai-sync/ai-sync.producer';

@Injectable()
export class CandidatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiSyncProducer: AiSyncProducer,
  ) {}

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
      const updateData = this.buildCandidatePayload(dto);
      const existingCandidate = await this.prisma.candidate.findUnique({
        where: { user_id: userId },
      });

      const candidate = await this.prisma.$transaction(async (tx) => {
        const savedCandidate = existingCandidate
          ? await tx.candidate.update({
              where: { id: existingCandidate.id },
              data: updateData,
            })
          : await tx.candidate.create({
              data: {
                user_id: userId,
                ...updateData,
              },
            });

        if (dto.skills !== undefined) {
          await tx.candidateSkill.deleteMany({
            where: { candidate_id: savedCandidate.id },
          });

          if (dto.skills.length > 0) {
            await tx.candidateSkill.createMany({
              data: dto.skills.map((skillId) => ({
                candidate_id: savedCandidate.id,
                skill_id: Number(skillId),
              })),
            });
          }
        }

        return savedCandidate;
      });

      await this.aiSyncProducer.candidateCreated(candidate.id);

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
        where: { user_id: id },
      });

      if (!candidate) throw new NotFoundException('Không tìm thấy ứng viên');

      const updatePayload = this.buildCandidatePayload(dto);

      const updatedCandidate = await this.prisma.$transaction(async (tx) => {
        if (Object.keys(updatePayload).length > 0) {
          await tx.candidate.update({
            where: { id: candidate.id },
            data: updatePayload,
          });
        }

        if (dto.skills !== undefined) {
          await tx.candidateSkill.deleteMany({
            where: { candidate_id: candidate.id },
          });

          if (dto.skills.length > 0) {
            await tx.candidateSkill.createMany({
              data: dto.skills.map((skillId) => ({
                candidate_id: candidate.id,
                skill_id: Number(skillId),
              })),
            });
          }
        }

        return tx.candidate.findUnique({
          where: { id: candidate.id },
        });
      });

      await this.aiSyncProducer.candidateUpdated(candidate.id);

      return {
        message: 'Cập nhật hồ sơ ứng viên thành công',
        candidate: updatedCandidate,
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

  private buildCandidatePayload(dto: CreateCandidateDto | UpdateCandidateDto) {
    const updatePayload: any = {};

    if (dto.preferred_city !== undefined) {
      updatePayload.preferred_city = dto.preferred_city;
    }

    if (dto.preferred_work_mode !== undefined) {
      updatePayload.preferred_work_mode = dto.preferred_work_mode;
    }

    if (dto.preferred_salary !== undefined) {
      updatePayload.preferred_salary = dto.preferred_salary;
    }

    if (dto.preferred_category !== undefined) {
      updatePayload.preferred_category =
        dto.preferred_category === null ? null : BigInt(dto.preferred_category);
    }

    if (dto.desired_role !== undefined) {
      updatePayload.desired_role = dto.desired_role;
    }

    if (dto.desired_salary_min !== undefined) {
      updatePayload.desired_salary_min = dto.desired_salary_min;
    }

    if (dto.desired_salary_max !== undefined) {
      updatePayload.desired_salary_max = dto.desired_salary_max;
    }

    if (dto.experience_years !== undefined) {
      updatePayload.experience_years = dto.experience_years;
    }

    if (dto.education_level !== undefined) {
      updatePayload.education_level = dto.education_level;
    }

    if (dto.open_to_work !== undefined) {
      updatePayload.open_to_work = dto.open_to_work;
    }

    return updatePayload;
  }
}
