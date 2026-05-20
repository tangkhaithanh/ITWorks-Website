/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  INestApplication,
  CanActivate,
  ConflictException,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { ReportsController } from '@/modules/reports/reports.controller';
import { ReportsService } from '@/modules/reports/reports.service';

class TestJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const role = request.headers['x-test-role'] || Role.candidate;
    request.user = {
      accountId: BigInt(request.headers['x-test-account-id'] || '1'),
      role,
    };
    return request.headers['x-test-auth'] !== 'false';
  }
}

describe('ReportsController (e2e)', () => {
  let app: INestApplication;
  const reportsService = {
    createReport: jest.fn(),
    listAdminReports: jest.fn(),
    getAdminReportDetail: jest.fn(),
    updateReportStatus: jest.fn(),
    closeReportedJob: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        RolesGuard,
        {
          provide: ReportsService,
          useValue: reportsService,
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

  it('POST /reports submits a report for an authenticated user', async () => {
    reportsService.createReport.mockResolvedValue({
      id: '1',
      targetType: 'job',
      targetId: '10',
      reason: 'Suspicious job',
      status: 'pending',
    });

    await request(app.getHttpServer())
      .post('/reports')
      .send({ targetType: 'job', targetId: '10', reason: 'Suspicious job' })
      .expect(201)
      .expect(({ body }) => {
        expect(body.id).toBe('1');
      });

    expect(reportsService.createReport).toHaveBeenCalledWith(
      1n,
      expect.objectContaining({ targetType: 'job', targetId: '10' }),
    );
  });

  it('POST /reports rejects unauthenticated users', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .set('x-test-auth', 'false')
      .send({ targetType: 'job', targetId: '10', reason: 'Suspicious job' })
      .expect(403);
  });

  it('POST /reports rejects missing target data', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .send({ targetType: 'job', reason: 'Suspicious job' })
      .expect(400);
  });

  it('POST /reports rejects validation failures', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .send({ targetType: 'job', targetId: '10', reason: 'short' })
      .expect(400);
  });

  it('POST /reports returns conflict for duplicate active reports', async () => {
    reportsService.createReport.mockRejectedValue(
      new ConflictException('Báo cáo này đang chờ xử lý'),
    );

    await request(app.getHttpServer())
      .post('/reports')
      .send({ targetType: 'job', targetId: '10', reason: 'Suspicious job' })
      .expect(409);
  });

  it('GET /reports/admin rejects non-admin users', async () => {
    await request(app.getHttpServer())
      .get('/reports/admin')
      .set('x-test-role', Role.candidate)
      .expect(403);
  });

  it('GET /reports/admin lists reports for admins', async () => {
    reportsService.listAdminReports.mockResolvedValue({
      items: [],
      page: 1,
      limit: 10,
      total: 0,
    });

    await request(app.getHttpServer())
      .get('/reports/admin?status=pending&targetType=job')
      .set('x-test-role', Role.admin)
      .expect(200)
      .expect(({ body }) => {
        expect(body.total).toBe(0);
      });
  });

  it('GET /reports/admin/:id returns report detail for admins', async () => {
    reportsService.getAdminReportDetail.mockResolvedValue({ id: '1' });

    await request(app.getHttpServer())
      .get('/reports/admin/1')
      .set('x-test-role', Role.admin)
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe('1');
      });
  });

  it('PATCH /reports/admin/:id/status updates report status for admins', async () => {
    reportsService.updateReportStatus.mockResolvedValue({
      id: '1',
      status: 'under_review',
    });

    await request(app.getHttpServer())
      .patch('/reports/admin/1/status')
      .set('x-test-role', Role.admin)
      .send({ status: 'under_review', note: 'Checking' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('under_review');
      });
  });

  it('PATCH /reports/admin/:id/close-job closes reported jobs for admins', async () => {
    reportsService.closeReportedJob.mockResolvedValue({
      id: '1',
      status: 'resolved',
    });

    await request(app.getHttpServer())
      .patch('/reports/admin/1/close-job')
      .set('x-test-role', Role.admin)
      .send({ note: 'Fraudulent', resolveReport: true })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('resolved');
      });
  });
});
