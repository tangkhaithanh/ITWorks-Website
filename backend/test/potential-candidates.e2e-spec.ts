import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

jest.mock('../src/common/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: class {
    canActivate() {
      return true;
    }
  },
}));

import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PrismaService } from '../src/prisma/prisma.service';
import { PotentialCandidatesController } from '../src/modules/potential-candidates/potential-candidates.controller';
import { PotentialCandidatesService } from '../src/modules/potential-candidates/potential-candidates.service';

class AllowGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

describe('Potential candidates job-scoped pool (e2e)', () => {
  let app: INestApplication;
  let prisma: {
    job: { findUnique: jest.Mock };
    potentialCandidate: {
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const recruiterId = BigInt(42);

  const candidateRecord = (overrides: Record<string, unknown> = {}) => ({
    id: '1001',
    candidate_id: '501',
    job_id: '300',
    recruiter_id: '42',
    match_score: 0.87,
    matched_skills: ['React'],
    missing_skills: [],
    note: null,
    tags: ['shortlist'],
    status: 'SAVED',
    priority: 'HIGH',
    follow_up_date: null,
    created_at: '2026-05-12T08:30:00.000Z',
    updated_at: '2026-05-12T08:30:00.000Z',
    job: { id: '300', title: 'Frontend Developer', status: 'active' },
    candidate: {
      id: '501',
      user: {
        full_name: 'Nguyen Van A',
        avatar_url: null,
        account: { email: 'candidate@example.com' },
      },
    },
    ...overrides,
  });

  beforeAll(async () => {
    prisma = {
      job: { findUnique: jest.fn() },
      potentialCandidate: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [PotentialCandidatesController],
      providers: [
        PotentialCandidatesService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtAuthGuard, useClass: AllowGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.use((req: any, _res: any, next: () => void) => {
      req.user = { accountId: recruiterId, role: 'recruiter' };
      next();
    });
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.job.findUnique.mockResolvedValue({
      id: BigInt(300),
      company: { account_id: recruiterId },
    });
    prisma.potentialCandidate.findMany.mockResolvedValue([candidateRecord()]);
    prisma.potentialCandidate.count.mockResolvedValue(1);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns only active records for the selected job', async () => {
    const response = await request(app.getHttpServer())
      .get('/potential-candidates')
      .query({ jobId: '300', page: '1', limit: '20' })
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].job_id).toBe('300');
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

  it('returns empty metadata for a job with no saved candidates', async () => {
    prisma.potentialCandidate.findMany.mockResolvedValue([]);
    prisma.potentialCandidate.count.mockResolvedValue(0);

    const response = await request(app.getHttpServer())
      .get('/potential-candidates')
      .query({ jobId: '300', page: '1', limit: '20' })
      .expect(200);

    expect(response.body.data).toEqual([]);
    expect(response.body.meta).toEqual({
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
  });

  it('keeps soft-removed records out of job-scoped results', async () => {
    await request(app.getHttpServer())
      .get('/potential-candidates')
      .query({ jobId: '300' })
      .expect(200);

    expect(prisma.potentialCandidate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deleted_at: null }),
      }),
    );
  });

  it('combines search, status, priority, tags, and pagination with job scope', async () => {
    await request(app.getHttpServer())
      .get('/potential-candidates')
      .query({
        jobId: '300',
        search: 'nguyen',
        status: 'SAVED',
        priority: 'HIGH',
        tags: 'shortlist,frontend',
        page: '2',
        limit: '5',
      })
      .expect(200);

    expect(prisma.potentialCandidate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recruiter_id: recruiterId,
          job_id: BigInt(300),
          status: 'SAVED',
          priority: 'HIGH',
          tags: { hasSome: ['shortlist', 'frontend'] },
          candidate: expect.objectContaining({ OR: expect.any(Array) }),
        }),
        skip: 5,
        take: 5,
      }),
    );
    expect(prisma.potentialCandidate.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          recruiter_id: recruiterId,
          job_id: BigInt(300),
        }),
      }),
    );
  });

  it('isolates records by the authenticated recruiter', async () => {
    await request(app.getHttpServer())
      .get('/potential-candidates')
      .query({ jobId: '300' })
      .expect(200);

    expect(prisma.potentialCandidate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ recruiter_id: recruiterId }),
      }),
    );
  });

  it('returns not found when the selected job does not exist', async () => {
    prisma.job.findUnique.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/potential-candidates')
      .query({ jobId: '999999' })
      .expect(404);

    expect(prisma.potentialCandidate.findMany).not.toHaveBeenCalled();
  });

  it('returns forbidden when recruiter cannot manage the selected job', async () => {
    prisma.job.findUnique.mockResolvedValue({
      id: BigInt(300),
      company: { account_id: BigInt(777) },
    });

    await request(app.getHttpServer())
      .get('/potential-candidates')
      .query({ jobId: '300' })
      .expect(403);

    expect(prisma.potentialCandidate.findMany).not.toHaveBeenCalled();
  });
});
