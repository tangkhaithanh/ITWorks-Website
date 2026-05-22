/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';

import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { MatchingHistoryController } from '@/modules/matching-history/matching-history.controller';
import { MatchingHistoryService } from '@/modules/matching-history/matching-history.service';

class TestJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    req.user = {
      accountId: BigInt(req.headers['x-test-account-id'] || '7'),
      role: req.headers['x-test-role'] || Role.recruiter,
    };

    return req.headers['x-test-auth'] !== 'false';
  }
}

describe('MatchingHistoryController (e2e)', () => {
  let app: INestApplication;
  const matchingHistoryService = {
    findSummaries: jest.fn(),
    findDetail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [MatchingHistoryController],
      providers: [
        RolesGuard,
        {
          provide: MatchingHistoryService,
          useValue: matchingHistoryService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /matching/history returns recruiter-owned summaries', async () => {
    matchingHistoryService.findSummaries.mockResolvedValue([
      {
        id: '19',
        actionType: 'FIND_TALENT',
        searchedAt: '2026-05-22T09:10:11.000Z',
        job: {
          id: '33',
          title: 'Backend Engineer',
          companyName: 'ITworks',
        },
      },
    ]);

    await request(app.getHttpServer())
      .get('/matching/history')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].id).toBe('19');
      });

    expect(matchingHistoryService.findSummaries).toHaveBeenCalledWith(7n);
  });

  it('GET /matching/history returns an empty history for a new recruiter', async () => {
    matchingHistoryService.findSummaries.mockResolvedValue([]);

    await request(app.getHttpServer())
      .get('/matching/history')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual([]);
      });
  });

  it('GET /matching/history keeps repeated sessions visible', async () => {
    matchingHistoryService.findSummaries.mockResolvedValue([
      {
        id: '20',
        actionType: 'FIND_TALENT',
        searchedAt: '2026-05-22T09:15:11.000Z',
        job: { id: '33', title: 'Backend Engineer', companyName: 'ITworks' },
      },
      {
        id: '19',
        actionType: 'FIND_TALENT',
        searchedAt: '2026-05-22T09:10:11.000Z',
        job: { id: '33', title: 'Backend Engineer', companyName: 'ITworks' },
      },
    ]);

    await request(app.getHttpServer())
      .get('/matching/history')
      .expect(200)
      .expect(({ body }) => {
        const sessions = body as Array<{ id: string }>;
        expect(sessions.map((session) => session.id)).toEqual(['20', '19']);
      });
  });

  it('GET /matching/history/:id returns the saved response detail', async () => {
    matchingHistoryService.findDetail.mockResolvedValue({
      id: '19',
      actionType: 'RANK_APPLICANTS',
      searchedAt: '2026-05-22T09:10:11.000Z',
      job: {
        id: '33',
        title: 'Backend Engineer',
        companyName: 'ITworks',
      },
      response: { total: 1, matches: [{ source_candidate_id: 2 }] },
    });

    await request(app.getHttpServer())
      .get('/matching/history/19')
      .expect(200)
      .expect(({ body }) => {
        expect(body.response.matches).toHaveLength(1);
      });

    expect(matchingHistoryService.findDetail).toHaveBeenCalledWith(19n, 7n);
  });

  it('GET /matching/history rejects non-recruiter roles', async () => {
    await request(app.getHttpServer())
      .get('/matching/history')
      .set('x-test-role', Role.candidate)
      .expect(403);
  });

  it('GET /matching/history/:id validates the session id', async () => {
    await request(app.getHttpServer())
      .get('/matching/history/nope')
      .expect(400);
  });
});
