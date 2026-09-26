import {
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeacherService } from './teacher.service';

@Controller('api/teacher')
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('join-requests')
  async getJoinRequests(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.getJoinRequests(
      request.user?.sub,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('join-requests/:requestId/accept')
  async acceptJoinRequest(
    @Param('requestId') requestId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.acceptJoinRequest(
      request.user?.sub,
      requestId,
    );
  }
}