import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePotentialCandidateDto } from './dto/create-potential-candidate.dto';
import { UpdatePotentialCandidateDto } from './dto/update-potential-candidate.dto';
import { QueryPotentialCandidateDto } from './dto/query-potential-candidate.dto';

@Injectable()
export class PotentialCandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePotentialCandidateDto, recruiterId: bigint) {
    const existing = await this.prisma.potentialCandidate.findFirst({
      where: {
        recruiter_id: recruiterId,
        candidate_id: BigInt(dto.candidateId),
        job_id: BigInt(dto.jobId),
        deleted_at: null,
      },
    });

    if (existing) {
      throw new ConflictException('Candidate is already saved for this job');
    }

    return this.prisma.potentialCandidate.create({
      data: {
        candidate_id: BigInt(dto.candidateId),
        job_id: BigInt(dto.jobId),
        recruiter_id: recruiterId,
        match_score: dto.matchScore ?? null,
        matched_skills: dto.matchedSkills ?? [],
        missing_skills: dto.missingSkills ?? [],
        tags: [],
      },
    });
  }

  async findAll(recruiterId: bigint, query: QueryPotentialCandidateDto) {
    const { search, status, priority, tags, page = 1, limit = 20 } = query;

    const where: Prisma.PotentialCandidateWhereInput = {
      recruiter_id: recruiterId,
      deleted_at: null,
    };

    if (query.jobId) {
      const jobId = BigInt(query.jobId);
      await this.assertCanViewJobPool(jobId, recruiterId);
      where.job_id = jobId;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;

    if (tags) {
      where.tags = { hasSome: tags.split(',').map((t) => t.trim()) };
    }

    if (search) {
      where.candidate = {
        OR: [
          { user: { full_name: { contains: search, mode: 'insensitive' } } },
          {
            user: {
              account: { email: { contains: search, mode: 'insensitive' } },
            },
          },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.potentialCandidate.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          candidate: {
            include: {
              user: {
                include: {
                  account: {
                    select: { email: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.potentialCandidate.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async assertCanViewJobPool(jobId: bigint, recruiterId: bigint) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        company: {
          select: {
            account_id: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.company.account_id !== recruiterId) {
      throw new ForbiddenException('You cannot view this job talent pool');
    }
  }

  async findOne(id: bigint, recruiterId: bigint) {
    const item = await this.prisma.potentialCandidate.findFirst({
      where: { id, recruiter_id: recruiterId, deleted_at: null },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        candidate: {
          include: {
            user: {
              include: {
                account: {
                  select: { email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!item) throw new NotFoundException('Potential candidate not found');
    return item;
  }

  async update(
    id: bigint,
    dto: UpdatePotentialCandidateDto,
    recruiterId: bigint,
  ) {
    await this.findOne(id, recruiterId);

    return this.prisma.potentialCandidate.update({
      where: { id },
      data: {
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.followUpDate !== undefined && {
          follow_up_date: new Date(dto.followUpDate),
        }),
      },
    });
  }

  async remove(id: bigint, recruiterId: bigint) {
    await this.findOne(id, recruiterId);

    await this.prisma.potentialCandidate.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    return { message: 'Candidate removed from talent pool' };
  }
}
