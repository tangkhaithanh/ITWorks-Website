import { InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AiSyncProducer } from '@/modules/ai-sync/ai-sync.producer';
import { CandidatesService } from './candidates.service';

type PrismaMock = {
  candidate: {
    findUnique: jest.Mock;
  };
  savedJob: {
    findMany: jest.Mock;
  };
};

describe('CandidatesService saved jobs', () => {
  let service: CandidatesService;
  let prisma: PrismaMock;

  const savedJob = (overrides: Record<string, unknown> = {}) => ({
    id: 101n,
    candidate_id: 10n,
    job_id: 501n,
    saved_at: new Date('2026-05-22T09:00:00.000Z'),
    updated_at: new Date('2026-05-22T09:00:00.000Z'),
    job: {
      id: 501n,
      title: 'Backend Developer',
      salary_min: 20,
      salary_max: 35,
      negotiable: false,
      location_city: 'Ho Chi Minh',
      created_at: new Date('2026-05-21T09:00:00.000Z'),
      status: 'active',
      category: { id: 21n, name: 'Software' },
      company: { id: 31n, name: 'ITWork', logo_url: 'logo.png' },
    },
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      candidate: {
        findUnique: jest.fn().mockResolvedValue({ id: 10n, user_id: 1n }),
      },
      savedJob: {
        findMany: jest.fn().mockResolvedValue([savedJob()]),
      },
    };

    service = new CandidatesService(
      prisma as unknown as PrismaService,
      {} as AiSyncProducer,
    );
  });

  it('returns card-ready display data for saved jobs', async () => {
    const result = await service.getSavedJobs(1n);

    expect(result[0].job).toEqual(
      expect.objectContaining({
        id: 501n,
        title: 'Backend Developer',
        company_name: 'ITWork',
        company_logo: 'logo.png',
        location_city: 'Ho Chi Minh',
        category: { id: 21n, name: 'Software' },
        salary_min: 20,
        salary_max: 35,
      }),
    );
    expect(result[0].job).not.toHaveProperty('company');
  });

  it('keeps saved metadata and newest-saved query ordering', async () => {
    const result = await service.getSavedJobs(1n);

    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 101n,
        candidate_id: 10n,
        job_id: 501n,
        saved_at: new Date('2026-05-22T09:00:00.000Z'),
      }),
    );
    expect(prisma.savedJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { candidate_id: 10n },
        orderBy: { saved_at: 'desc' },
      }),
    );
  });

  it('returns an empty list when the candidate has no saved jobs', async () => {
    prisma.savedJob.findMany.mockResolvedValue([]);

    await expect(service.getSavedJobs(1n)).resolves.toEqual([]);
  });

  it('keeps saved jobs usable when company logo is absent', async () => {
    prisma.savedJob.findMany.mockResolvedValue([
      savedJob({
        job: {
          ...savedJob().job,
          company: { id: 31n, name: 'ITWork', logo_url: null },
        },
      }),
    ]);

    const result = await service.getSavedJobs(1n);

    expect(result[0].job).toEqual(
      expect.objectContaining({
        company_name: 'ITWork',
        company_logo: null,
      }),
    );
  });

  it('fails explicitly when saved job display context is missing', async () => {
    prisma.savedJob.findMany.mockResolvedValue([savedJob({ job: null })]);

    await expect(service.getSavedJobs(1n)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });
});
