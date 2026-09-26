import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StudentService } from './student.service';

@Controller('api/student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async getDashboard(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.getDashboard(
      request.user?.sub,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('subjects')
  async getSubjects(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.getSubjects(
      request.user?.sub,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('groups')
  async getAvailableGroups(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.getAvailableGroups(
      request.user?.sub,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('groups/:groupId/join')
  async joinGroup(
    @Param('groupId') groupId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.joinGroup(
      request.user?.sub,
      groupId,
    );
  }
}

