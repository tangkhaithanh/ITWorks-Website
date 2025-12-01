import {
  Controller,
  Patch,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { UsersService} from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';
import {User} from '@/common/decorators/user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}
    @Roles(Role.candidate)
    @Patch()
    @Roles(Role.candidate)
    @UseInterceptors(
        FileInterceptor('avatar', {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png)$/))
            return cb(new BadRequestException('Avatar phải JPG/PNG'), false);
            cb(null, true);
        },
        }),
    )
    update(
        @User('accountId') accountId: bigint,
        @Body() dto: UpdateUserDto,
        @UploadedFile() avatar: Express.Multer.File,
    ) {
        return this.usersService.update(accountId, dto, avatar);
    }
}
