import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../generated/prisma/enums';
import { StudentService } from './student.service';
import { ProgressService } from './progress.service';
import { StudentCalendarService } from './student-calendar.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('api/student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly progressService: ProgressService,
    private readonly calendarService: StudentCalendarService,
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

  @UseGuards(JwtAuthGuard)
  @Get('subjects/:subjectId')
  async getSubjectDetails(
    @Param('subjectId') subjectId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.getSubjectDetails(
      request.user?.sub,
      subjectId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('topics/:topicId')
  async getTopicDetails(
    @Param('topicId') topicId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.getTopicDetails(
      request.user?.sub,
      topicId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('materials/:materialId')
  async getMaterialDetails(
    @Param('materialId') materialId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.getMaterialDetails(
      request.user?.sub,
      materialId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('materials/:materialId/start')
  async startMaterial(
    @Param('materialId') materialId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.startMaterial(
      request.user?.sub,
      materialId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('materials/:materialId/complete')
  async completeMaterial(
    @Param('materialId') materialId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.completeMaterial(
      request.user?.sub,
      materialId,
    );
  }

  // =========================================================================
  // ASSIGNMENTS
  // =========================================================================

  @UseGuards(JwtAuthGuard)
  @Get('assignments')
  async getAssignments(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.getAssignments(request.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('assignments/:assignmentId')
  async getAssignmentDetails(
    @Param('assignmentId') assignmentId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.getAssignmentDetails(
      request.user?.sub,
      assignmentId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('assignments/:assignmentId/submit')
  async submitAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body()
    body: {
      textAnswer?: string;
      fileUrl?: string;
      fileName?: string;
    },
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.submitAssignment(
      request.user?.sub,
      assignmentId,
      body,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('assignments/:assignmentId/submission')
  async resubmitAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body()
    body: {
      textAnswer?: string;
      fileUrl?: string;
      fileName?: string;
    },
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.submitAssignment(
      request.user?.sub,
      assignmentId,
      body,
    );
  }

  // ==========================================
  // TESTS (STUDENT)
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @Get('tests')
  async getTests(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.getTests(request.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tests/:testId')
  async getTestDetails(
    @Param('testId') testId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.getTestDetails(request.user?.sub, testId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tests/:testId/start')
  async startTest(
    @Param('testId') testId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.startTest(request.user?.sub, testId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tests/:testId/attempt/:attemptId')
  async getAttempt(
    @Param('testId') testId: string,
    @Param('attemptId') attemptId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.getAttempt(request.user?.sub, testId, attemptId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tests/:testId/attempt/:attemptId/answer')
  async answerQuestion(
    @Param('testId') testId: string,
    @Param('attemptId') attemptId: string,
    @Body()
    body: {
      questionId?: string;
      textAnswer?: string;
      selectedOptionIds?: string[];
    },
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.answerQuestion(
      request.user?.sub,
      testId,
      attemptId,
      body,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('tests/:testId/attempt/:attemptId/submit')
  async submitTest(
    @Param('testId') testId: string,
    @Param('attemptId') attemptId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.submitTest(request.user?.sub, testId, attemptId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tests/:testId/attempt/:attemptId/result')
  async getAttemptResult(
    @Param('testId') testId: string,
    @Param('attemptId') attemptId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.getAttemptResult(
      request.user?.sub,
      testId,
      attemptId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('tests/:testId/attempt/:attemptId/errors')
  async getAttemptErrors(
    @Param('testId') testId: string,
    @Param('attemptId') attemptId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.studentService.getAttemptErrors(
      request.user?.sub,
      testId,
      attemptId,
    );
  }

  // ==========================================
  // PROGRESS / ACADEMIC RESULTS (STUDENT)
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @Get('progress')
  async getFullProgress(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.progressService.getFullProgress(request.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('progress/subjects')
  async getSubjectsProgress(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.progressService.getSubjectsProgress(request.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('progress/subjects/:subjectId')
  async getSubjectProgress(
    @Param('subjectId') subjectId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.progressService.getSubjectProgress(request.user?.sub, subjectId);
  }

  // ==========================================
  // DIARY & CALENDAR (STUDENT)
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @Get('calendar')
  async getCalendar(
    @Query('from') fromStr: string,
    @Query('to') toStr: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.calendarService.getCalendarEvents(request.user?.sub, fromStr, toStr);
  }

  @UseGuards(JwtAuthGuard)
  @Get('diary')
  async getDiary(
    @Query('date') dateStr: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.calendarService.getDiaryForDate(request.user?.sub, dateStr);
  }
}

