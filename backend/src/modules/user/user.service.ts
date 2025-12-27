import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';
import { UpdateUserDto } from './dto/update-user.dto';
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async update(
    accountId: bigint,
    dto: UpdateUserDto,
    avatar?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { account_id: accountId },
    });

    if (!user) throw new NotFoundException('Không tìm thấy user');

    const DEFAULT_AVATAR_PUBLIC_ID = process.env.DEFAULT_AVATAR_PUBLIC_ID;

    const updatePayload: any = { ...dto };

    // Convert dob nếu cần
    if (dto.dob) {
      updatePayload.dob = new Date(dto.dob);
    }

    // Nếu có avatar upload
    if (avatar) {
      if (
        user.avatar_public_id &&
        user.avatar_public_id !== DEFAULT_AVATAR_PUBLIC_ID
      ) {
        await this.cloudinary.deleteFile(user.avatar_public_id);
      }

      const uploaded = await this.cloudinary.uploadImage(avatar, 'avatars');

      updatePayload.avatar_url = uploaded.secure_url;
      updatePayload.avatar_public_id = uploaded.public_id;
    }

    // 🔥 LOẠI BỎ field null HOẶC undefined — CHỐNG LỖI PRISMA
    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key] === undefined || updatePayload[key] === null) {
        delete updatePayload[key];
      }
    });

    return this.prisma.user.update({
      where: { account_id: accountId },
      data: updatePayload,
    });
  }
}
