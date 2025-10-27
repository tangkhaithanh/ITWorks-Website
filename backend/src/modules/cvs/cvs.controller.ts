import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CvsService } from './cvs.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { User } from '@/common/decorators/user.decorator';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { Role } from '@prisma/client';
import { QueryCvDto } from './dto/query-cv.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import type { Response } from 'express';
import fetch from 'node-fetch';
@Controller('cvs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.candidate) 
export class CvsController {
  constructor(private readonly cvsService: CvsService) {}
  // Tạo CV online theo template:
  @Post()
  async createCv(
    @User('userId') userId: bigint,
    @Body() dto: CreateCvDto,
  ) {
    return this.cvsService.createCV(userId, dto);
  }
  // Upload file CV (PDF/DOCX):
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFileCv(
    @User('userId') userId: bigint,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
  ) {
    return this.cvsService.uploadFileCv(userId, file, title);
  }
  // Tách ra 2 endpoint riêng để lấy CV online và file CV
  @Get('my/online')
  async getMyOnlineCvs(@User('userId') userId: bigint, @Query() query: QueryCvDto) {
  return this.cvsService.listMyCvsByType(userId, 'ONLINE', query.page, query.limit);
  }

  @Get('my/file')
  async getMyFileCvs(@User('userId') userId: bigint, @Query() query: QueryCvDto) {
  return this.cvsService.listMyCvsByType(userId, 'FILE', query.page, query.limit);
}
// Lấy chi tiết CV của tôi:

  @Get(':id')
  async getCvDetail(@Param('id', ParseIntPipe) id: number) {
    return this.cvsService.getMyCvDetail(BigInt(id));
  }

  // Cập nhật CV:
  @Put(':id')
  async updateCv(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCvDto,
  ) {
    return this.cvsService.updateMyCv(BigInt(id), dto);
  }

  // Thay thế file CV (đổi file)
  @Put(':id/replace')
  @UseInterceptors(FileInterceptor('file'))
  async replaceCvFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.cvsService.replaceFile(BigInt(id), file);
  }

  // Xóa CV:
  @Delete(':id')
  async deleteCv(@Param('id', ParseIntPipe) id: number) {
    return this.cvsService.deleteMyCv(BigInt(id));
  }

  @Get('view/:filename')
  @Roles(Role.candidate, Role.recruiter) // ✅ Ghi đè roles ở method
  async streamCv(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const buffer = await this.cvsService.getPdfBuffer(filename);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.send(buffer);
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      res.status(status).send(error.message || 'Lỗi không xác định');
    }
  }
}