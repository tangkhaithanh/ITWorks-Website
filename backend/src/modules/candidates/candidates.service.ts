import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
@Injectable()
export class CandidatesService {
    constructor(private prisma: PrismaService) {}

   // Lấy hồ sơ ứng vien theo user ID
    async getCandidateByUserId(userId: bigint) {
    console.log('Getting candidate for userId:', userId);
    const candidate = await this.prisma.candidate.findUnique({
      where: { user_id: userId },
    });
    if (!candidate) throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
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
}