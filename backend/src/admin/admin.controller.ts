import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, UserStatus } from '../generated/prisma/enums';
import { AdminService } from './admin.service';
import {
  CreateSubjectDto,
  UpdateAdminGroupDto,
  UpdateSubjectDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 1. Dashboard
  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // 2. Users
  @Get('users')
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getUsers({ search, role, status, page, limit });
  }

  @Get('users/:id')
  async getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Req()
    req: Request & { user?: { sub?: string } },
    @Param('id') targetUserId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(req.user?.sub!, targetUserId, dto);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Req()
    req: Request & { user?: { sub?: string } },
    @Param('id') targetUserId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(req.user?.sub!, targetUserId, dto);
  }

  @Delete('users/:id')
  async deleteUser(
    @Req()
    req: Request & { user?: { sub?: string } },
    @Param('id') targetUserId: string,
  ) {
    return this.adminService.deleteUser(req.user?.sub!, targetUserId);
  }

  // 3. Subjects
  @Get('subjects')
  async getSubjects(@Query('search') search?: string) {
    return this.adminService.getSubjects(search);
  }

  @Post('subjects')
  async createSubject(@Body() dto: CreateSubjectDto) {
    return this.adminService.createSubject(dto);
  }

  @Patch('subjects/:id')
  async updateSubject(
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.adminService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  async deleteSubject(@Param('id') id: string) {
    return this.adminService.deleteSubject(id);
  }

  // 4. Groups
  @Get('groups')
  async getGroups(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('course') course?: number,
  ) {
    return this.adminService.getGroups({ search, status, course });
  }

  @Get('groups/:id')
  async getGroupDetails(@Param('id') id: string) {
    return this.adminService.getGroupDetails(id);
  }

  @Patch('groups/:id')
  async updateGroup(
    @Param('id') id: string,
    @Body() dto: UpdateAdminGroupDto,
  ) {
    return this.adminService.updateGroup(id, dto);
  }

  // 5. Academic Monitoring
  @Get('academic/overview')
  async getAcademicOverview() {
    return this.adminService.getAcademicOverview();
  }

  @Get('academic/students')
  async getAcademicStudents(
    @Query('search') search?: string,
    @Query('groupId') groupId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('course') course?: number,
    @Query('performance') performance?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAcademicStudents({
      search,
      groupId,
      subjectId,
      course,
      performance,
      page,
      limit,
    });
  }

  @Get('academic/students/:studentId')
  async getStudentAcademicDetails(@Param('studentId') studentId: string) {
    return this.adminService.getStudentAcademicDetails(studentId);
  }
}

