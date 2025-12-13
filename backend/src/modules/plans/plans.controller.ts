import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
@Controller('plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlansController {
    constructor(private readonly plansService: PlansService) { }

    /**
     * ======================
     * PUBLIC / RECRUITER
     * ======================
     */

    // Lấy danh sách plan đang hiển thị
    @Get()
    @Roles(Role.recruiter)
    async findAllPublic() {
        return this.plansService.findAll(false);
    }

    // Xem chi tiết plan (chỉ plan đang hiển thị)
    @Get(':id')
    @Roles(Role.recruiter)
    async findOnePublic(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.plansService.findOne(BigInt(id), false);
    }

    /**
     * ======================
     * ADMIN
     * ======================
     * (sau này gắn @UseGuards(AdminGuard))
     */

    // Admin: lấy toàn bộ plan (kể cả hidden)
    @Get('/admin/all')
    @Roles(Role.admin)
    async findAllAdmin() {
        return this.plansService.findAll(true);
    }

    // Admin: xem chi tiết plan (kể cả hidden)
    @Get('/admin/:id')
    @Roles(Role.admin)
    async findOneAdmin(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.plansService.findOne(BigInt(id), true);
    }

    // Admin: tạo plan
    @Post()
    @Roles(Role.admin)
    async create(@Body() dto: CreatePlanDto) {
        return this.plansService.create(dto);
    }

    // Admin: cập nhật plan
    @Put(':id')
    @Roles(Role.admin)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdatePlanDto,
    ) {
        return this.plansService.update(BigInt(id), dto);
    }

    // Admin: xoá (thực chất là hide)
    @Delete(':id')
    @Roles(Role.admin)
    async remove(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.plansService.remove(BigInt(id));
    }
}
