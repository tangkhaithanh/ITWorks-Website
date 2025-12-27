import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { CvType } from '@prisma/client';
import { CvHelper } from '@/common/helpers/cv.helper';
@Injectable()
export class CvsService {
  private readonly logger = new Logger(CvsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private async getCandidateIdByUserId(userId: bigint): Promise<bigint> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { user_id: userId },
      select: { id: true },
    });
    if (!candidate) {
      throw new ForbiddenException(
        'Tài khoản hiện không có hồ sơ ứng viên (candidate).',
      );
    }
    return candidate.id;
  }

  async createCV(userId: bigint, dto: CreateCvDto) {
    try {
      const candidateId = await this.getCandidateIdByUserId(userId);

      if (!candidateId) {
        throw new NotFoundException(
          'Không tìm thấy candidate tương ứng với user này',
        );
      }

      const cv = await this.prisma.cv.create({
        data: {
          candidate_id: candidateId,
          title: dto.title,
          template_id: dto.template_id,
          content: dto.content,
          type: CvType.ONLINE,
        },
      });

      return cv;
    } catch (error) {
      console.error('❌ Lỗi khi tạo CV:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Không thể tạo CV, vui lòng thử lại sau',
      );
    }
  }
  // Hàm lấy toàn bộ CV của một candidate
  async listMyCvsByType(
    userId: bigint,
    type: CvType, // 'ONLINE' | 'FILE'
    page: number,
    limit: number,
  ) {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { user_id: userId },
        select: { id: true },
      });
      if (!candidate)
        throw new NotFoundException(
          'Không tìm thấy candidate tương ứng với user này',
        );

      const skip = (page - 1) * limit;

      const [items, total] = await this.prisma.$transaction([
        this.prisma.cv.findMany({
          where: {
            candidate_id: candidate.id,
            is_deleted: false,
            type,
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
          include:
            type === CvType.ONLINE // lấy dữ liệu từ bảng CVTemplate nếu là CV online
              ? {
                  template: {
                    select: { id: true, name: true, preview_url: true },
                  },
                }
              : undefined,
        }),
        this.prisma.cv.count({
          where: {
            candidate_id: candidate.id,
            is_deleted: false,
            type,
          },
        }),
      ]);

      // Chuẩn hóa toàn bộ danh sách
      const formattedItems = items.map((cv) => CvHelper.format(cv));

      return {
        items: formattedItems,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('❌ Lỗi khi lấy danh sách CV:', error);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách CV, vui lòng thử lại sau',
      );
    }
  }

  // Lấy chi tiết CV theo ID
  async getMyCvDetail(cvId: bigint) {
    const cv = await this.prisma.cv.findFirst({
      where: { id: cvId, is_deleted: false },
      include: {
        template: {
          select: { id: true, name: true, preview_url: true },
        },
      },
    });

    if (!cv) throw new NotFoundException('CV không tồn tại.');

    return CvHelper.format(cv);
  }
  // Cập nhật CV
  async updateMyCv(cvId: bigint, dto: UpdateCvDto) {
    const cv = await this.prisma.cv.findFirst({
      where: { id: cvId, is_deleted: false },
    });
    if (!cv) throw new NotFoundException('CV không tồn tại.');

    // ✅ Chỉ truyền những field thực sự có trong DTO
    return this.prisma.cv.update({
      where: { id: cvId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.template_id && { template_id: dto.template_id }),
        ...(dto.content && { content: dto.content }),
      },
    });
  }

  // Xóa CV (soft delete)
  async deleteMyCv(cvId: bigint) {
    const cv = await this.prisma.cv.findFirst({
      where: { id: cvId, is_deleted: false },
    });
    if (!cv) throw new NotFoundException('CV không tồn tại hoặc đã bị xóa.');
    const used = await this.prisma.application.count({
      where: { cv_id: cvId },
    });

    //Nếu CV đang dùng → soft delete
    if (used > 0) {
      return this.prisma.cv.update({
        where: { id: cvId },
        data: {
          is_deleted: true,
        },
      });
    }

    //Nếu chưa dùng → xóa thật + cleanup Cloudinary
    if (cv.file_public_id) {
      try {
        await this.cloudinary.deleteFile(cv.file_public_id);
      } catch (err) {
        this.logger?.warn?.(
          `⚠️ Lỗi khi xóa file Cloudinary (${cv.file_public_id}): ${err.message}`,
        );
      }
    }

    return this.prisma.cv.delete({ where: { id: cvId } });
  }

  //======Xử lí cho trường hợp upload CV dạng file (PDF/Word) lên Cloudinary ======//

  async uploadFileCv(
    userId: bigint,
    file: Express.Multer.File,
    overrideTitle?: string,
  ) {
    if (!file) throw new BadRequestException('Không có file đính kèm.');

    const candidateId = await this.getCandidateIdByUserId(userId);
    const uploaded = await this.cloudinary.uploadDocument(file, 'cvs');

    return this.prisma.cv.create({
      data: {
        candidate_id: candidateId,
        title: overrideTitle || file.originalname,
        file_url: uploaded.secure_url,
        file_public_id: uploaded.public_id,
        type: CvType.FILE,
      },
    });
  }

  // Trường hợp người dùng thay đổi file CV đã upload
  async replaceFile(cvId: bigint, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Không có file đính kèm.');

    const cv = await this.prisma.cv.findFirst({
      where: { id: cvId, is_deleted: false },
    });
    if (!cv) throw new NotFoundException('CV không tồn tại.');

    // 🧹 Nếu CV có file cũ => xóa trên Cloudinary
    if (cv.file_public_id) {
      try {
        await this.cloudinary.deleteFile(cv.file_public_id);
      } catch (err) {
        console.warn(`⚠️ Lỗi khi xóa file cũ trên Cloudinary: ${err.message}`);
      }
    }

    // 📤 Upload file mới
    const uploaded = await this.cloudinary.uploadDocument(file, 'cvs');

    return this.prisma.cv.update({
      where: { id: cvId },
      data: {
        file_url: uploaded.secure_url,
        file_public_id: uploaded.public_id,
      },
    });
  }

  async getPdfBuffer(filename: string): Promise<Buffer> {
    try {
      const cloudUrl = `https://res.cloudinary.com/dzgltugct/raw/upload/v1761391116/cvs/${filename}`;
      const response = await fetch(cloudUrl);

      if (!response.ok) {
        throw new NotFoundException('Không tìm thấy file trên Cloudinary');
      }

      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      // Nếu lỗi do mạng hoặc fetch thất bại
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Lỗi khi tải file từ Cloudinary: ${error.message}`);
    }
  }
}
