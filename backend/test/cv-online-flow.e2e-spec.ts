import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

jest.mock('../src/common/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: class {
    canActivate() {
      return true;
    }
  },
}));

jest.mock('../src/common/guards/roles.guard', () => ({
  RolesGuard: class {
    canActivate() {
      return true;
    }
  },
}));

import { CvsController } from '../src/modules/cvs/cvs.controller';
import { CvsService } from '../src/modules/cvs/cvs.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

class AllowGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

describe('Online CV flow (e2e)', () => {
  let app: INestApplication;
  let cvsStore: any;

  beforeAll(async () => {
    cvsStore = {
      id: 101,
      title: 'Backend Developer CV',
      template_id: 1,
      content: {
        personal: { fullName: 'Test User', email: 'test@example.com', phone: '0900000000' },
        education: [],
        experience: [],
        skills: [],
        projects: [],
      },
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [CvsController],
      providers: [
        {
          provide: CvsService,
          useValue: {
            createCV: async (_userId: bigint, dto: any) => {
              cvsStore = { ...cvsStore, ...dto };
              return { ...cvsStore };
            },
            previewCv: async (_userId: bigint, dto: any) => ({
              html: `<html><body><h1>${dto.content.personal.fullName}</h1></body></html>`,
              model: dto,
            }),
            getMyCvDetail: async () => ({ ...cvsStore }),
            updateMyCv: async (_userId: bigint, _cvId: bigint, dto: any) => {
              cvsStore = { ...cvsStore, ...dto };
              return { ...cvsStore };
            },
            deleteMyCv: async () => ({ success: true }),
            exportCvPdf: async () => Buffer.from('%PDF-1.4 test'),
            listMyCvsByType: async () => ({ items: [{ ...cvsStore }] }),
            uploadFileCv: async () => ({ id: 999 }),
            replaceFile: async () => ({ id: 999 }),
            getPdfBuffer: async () => Buffer.from('fake'),
          },
        },
        { provide: JwtAuthGuard, useClass: AllowGuard },
        { provide: RolesGuard, useClass: AllowGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((req: any, _res: any, next: () => void) => {
      req.user = { userId: BigInt(1), role: 'candidate' };
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('create -> preview -> save(update) -> export -> delete', async () => {
    const payload = {
      title: 'My Online CV',
      template_id: 1,
      content: {
        personal: { fullName: 'Nguyen Van A', email: 'a@example.com', phone: '0900000000' },
        education: [],
        experience: [],
        skills: ['React'],
        projects: [],
      },
    };

    await request(app.getHttpServer()).post('/cvs').send(payload).expect(201);
    await request(app.getHttpServer()).post('/cvs/preview').send(payload).expect(201);
    await request(app.getHttpServer()).put('/cvs/101').send({ title: 'Updated CV' }).expect(200);
    await request(app.getHttpServer()).get('/cvs/101/export/pdf').expect(200);
    await request(app.getHttpServer()).delete('/cvs/101').expect(200);
  });
});
