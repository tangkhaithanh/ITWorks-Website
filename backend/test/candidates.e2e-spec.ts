/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { AiSyncProducer } from '@/modules/ai-sync/ai-sync.producer';
import { CandidatesController } from '@/modules/candidates/candidates.controller';
import { CandidatesService } from '@/modules/candidates/candidates.service';
import { PrismaService } from '@/prisma/prisma.service';

class TestJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = {
      userId: BigInt(req.headers['x-test-user-id'] || '1'),
      role: req.headers['x-test-role'] || Role.candidate,
    };
    return req.headers['x-test-auth'] !== 'false';
  }
}

describe('Candidates saved jobs (e2e)', () => {
  let app: INestApplication;
  let prisma: {
    candidate: { findUnique: jest.Mock };
    savedJob: { findMany: jest.Mock };
  };

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

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      candidate: {
        findUnique: jest.fn().mockResolvedValue({ id: 10n, user_id: 1n }),
      },
      savedJob: {
        findMany: jest.fn().mockResolvedValue([savedJob()]),
      },
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [CandidatesController],
      providers: [
        CandidatesService,
        RolesGuard,
        Reflector,
        { provide: PrismaService, useValue: prisma },
        { provide: AiSyncProducer, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns enriched saved-job card data with saved identity', async () => {
    const response = await request(app.getHttpServer())
      .get('/candidates/saved-jobs')
      .expect(200);

    expect(response.body.data[0]).toEqual(
      expect.objectContaining({
        id: '101',
        candidate_id: '10',
        job_id: '501',
        job: expect.objectContaining({
          id: '501',
          title: 'Backend Developer',
          company_name: 'ITWork',
          company_logo: 'logo.png',
          location_city: 'Ho Chi Minh',
          category: { id: '21', name: 'Software' },
        }),
      }),
    );
    expect(prisma.savedJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { candidate_id: 10n },
        orderBy: { saved_at: 'desc' },
      }),
    );
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

    const response = await request(app.getHttpServer())
      .get('/candidates/saved-jobs')
      .expect(200);

    expect(response.body.data[0].job).toEqual(
      expect.objectContaining({
        company_name: 'ITWork',
        company_logo: null,
      }),
    );
  });

  it('returns an empty saved list for candidates without saved jobs', async () => {
    prisma.savedJob.findMany.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/candidates/saved-jobs')
      .expect(200);

    expect(response.body.data).toEqual([]);
  });

  it('rejects non-candidates before returning saved data', async () => {
    await request(app.getHttpServer())
      .get('/candidates/saved-jobs')
      .set('x-test-role', Role.recruiter)
      .expect(403);

    expect(prisma.savedJob.findMany).not.toHaveBeenCalled();
  });
});
