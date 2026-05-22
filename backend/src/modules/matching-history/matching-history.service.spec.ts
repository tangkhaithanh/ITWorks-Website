/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NotFoundException } from '@nestjs/common';
import { RecruiterMatchingAction } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import { MatchingHistoryService } from './matching-history.service';

type PrismaMock = {
  job: {
    findUnique: jest.Mock;
  };
  recruiterMatchingHistory: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
  };
};

describe('MatchingHistoryService', () => {
  let prisma: PrismaMock;
  let service: MatchingHistoryService;

  const baseHistory = {
    id: 19n,
    recruiter_id: 7n,
    job_id: 33n,
    action_type: RecruiterMatchingAction.FIND_TALENT,
    job_title_snapshot: 'Backend Engineer',
    company_name_snapshot: 'ITworks',
    response_snapshot: {
      total: 1,
      matches: [{ source_candidate_id: 9, overall_score: 0.97 }],
    },
    searched_at: new Date('2026-05-22T09:10:11.000Z'),
    created_at: new Date('2026-05-22T09:10:11.000Z'),
  };

  beforeEach(() => {
    prisma = {
      job: {
        findUnique: jest.fn().mockResolvedValue({
          id: 33n,
          title: 'Backend Engineer',
          company: { name: 'ITworks' },
        }),
      },
      recruiterMatchingHistory: {
        create: jest.fn().mockResolvedValue(baseHistory),
        findMany: jest.fn().mockResolvedValue([baseHistory]),
        findFirst: jest.fn().mockResolvedValue(baseHistory),
      },
    };

    service = new MatchingHistoryService(prisma as unknown as PrismaService);
  });

  it('captures a completed matching response snapshot with job labels', async () => {
    const response = {
      total: 2,
      matches: [{ source_candidate_id: 12, overall_score: 0.82 }],
    };

    await service.captureSession({
      recruiterId: 7n,
      jobId: 33n,
      actionType: RecruiterMatchingAction.RANK_APPLICANTS,
      response,
    });

    expect(prisma.recruiterMatchingHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recruiter_id: 7n,
        job_id: 33n,
        action_type: RecruiterMatchingAction.RANK_APPLICANTS,
        job_title_snapshot: 'Backend Engineer',
        company_name_snapshot: 'ITworks',
        response_snapshot: response,
      }),
    });
  });

  it('returns recruiter summaries newest first without the response body', async () => {
    await expect(service.findSummaries(7n)).resolves.toEqual([
      {
        id: '19',
        actionType: RecruiterMatchingAction.FIND_TALENT,
        searchedAt: baseHistory.searched_at,
        job: {
          id: '33',
          title: 'Backend Engineer',
          companyName: 'ITworks',
        },
      },
    ]);

    expect(prisma.recruiterMatchingHistory.findMany).toHaveBeenCalledWith({
      where: { recruiter_id: 7n },
      orderBy: [{ searched_at: 'desc' }, { id: 'desc' }],
    });
  });

  it('returns the saved detail snapshot for the owning recruiter', async () => {
    await expect(service.findDetail(19n, 7n)).resolves.toEqual({
      id: '19',
      actionType: RecruiterMatchingAction.FIND_TALENT,
      searchedAt: baseHistory.searched_at,
      job: {
        id: '33',
        title: 'Backend Engineer',
        companyName: 'ITworks',
      },
      response: baseHistory.response_snapshot,
    });

    expect(prisma.recruiterMatchingHistory.findFirst).toHaveBeenCalledWith({
      where: { id: 19n, recruiter_id: 7n },
    });
  });

  it('rejects detail reads outside recruiter ownership', async () => {
    prisma.recruiterMatchingHistory.findFirst.mockResolvedValue(null);

    await expect(service.findDetail(19n, 99n)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns an empty history when a recruiter has no saved sessions', async () => {
    prisma.recruiterMatchingHistory.findMany.mockResolvedValue([]);

    await expect(service.findSummaries(7n)).resolves.toEqual([]);
  });

  it('skips capture when the matched job is unavailable', async () => {
    prisma.job.findUnique.mockResolvedValue(null);

    await expect(
      service.captureSession({
        recruiterId: 7n,
        jobId: 404n,
        actionType: RecruiterMatchingAction.FIND_TALENT,
        response: { matches: [] },
      }),
    ).resolves.toBeNull();

    expect(prisma.recruiterMatchingHistory.create).not.toHaveBeenCalled();
  });
});
