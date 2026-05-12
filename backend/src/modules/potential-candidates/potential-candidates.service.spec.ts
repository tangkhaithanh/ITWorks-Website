/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PotentialCandidatesService } from './potential-candidates.service';

type PrismaMock = {
  job: {
    findUnique: jest.Mock;
  };
  potentialCandidate: {
    findMany: jest.Mock;
    count: jest.Mock;
  };
};

describe('PotentialCandidatesService', () => {
  let service: PotentialCandidatesService;
  let prisma: PrismaMock;

  const recruiterId = BigInt(42);

  beforeEach(() => {
    prisma = {
      job: {
        findUnique: jest.fn().mockResolvedValue({
          id: BigInt(300),
          company: { account_id: recruiterId },
        }),
      },
      potentialCandidate: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    service = new PotentialCandidatesService(
      prisma as unknown as PrismaService,
    );
  });

  it('adds job scope to list queries when jobId is provided', async () => {
    await service.findAll(recruiterId, {
      jobId: '300',
      page: 1,
      limit: 20,
    });

    expect(prisma.potentialCandidate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recruiter_id: recruiterId,
          job_id: BigInt(300),
          deleted_at: null,
        }),
      }),
    );
  });

  it('throws not found before listing when selected job is missing', async () => {
    prisma.job.findUnique.mockResolvedValue(null);

    await expect(
      service.findAll(recruiterId, { jobId: '999', page: 1, limit: 20 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.potentialCandidate.findMany).not.toHaveBeenCalled();
  });

  it('throws forbidden before listing when recruiter cannot manage the job', async () => {
    prisma.job.findUnique.mockResolvedValue({
      id: BigInt(300),
      company: { account_id: BigInt(777) },
    });

    await expect(
      service.findAll(recruiterId, { jobId: '300', page: 1, limit: 20 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.potentialCandidate.findMany).not.toHaveBeenCalled();
  });
});
