import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../generated/prisma/enums';
import { TeacherService } from './teacher.service';
import {
  CreateTopicDto,
  UpdateTopicDto,
  ReorderTopicsDto,
  CreateMaterialDto,
  UpdateMaterialDto,
  ReorderMaterialsDto,
} from './dto/course-content.dto';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';
import { SaveAttendanceDto } from './dto/attendance.dto';
import { SaveTermGradesDto } from './dto/term-grade.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
@Controller('api/teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get('profile')
  async getProfile(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.getProfile(request.user?.sub);
  }

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
    return this.teacherService.getDashboard(request.user?.sub);
  }

  @Get('groups')
  async getGroups(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.getGroups(request.user?.sub);
  }

  @Get('groups/:groupId/students')
  async getGroupStudents(
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
    return this.teacherService.getGroupStudents(request.user?.sub, groupId);
  }

  @Get('groups/:groupId/journal')
  async getGroupJournal(
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
    return this.teacherService.getGroupJournal(request.user?.sub, groupId);
  }

  @Get('groups/:groupId/attendance')
  async getGroupAttendance(
    @Param('groupId') groupId: string,
    @Query('date') date: string | undefined,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.getGroupAttendance(
      request.user?.sub,
      groupId,
      date,
    );
  }

  @Post('groups/:groupId/attendance')
  async saveGroupAttendance(
    @Param('groupId') groupId: string,
    @Body() dto: SaveAttendanceDto,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.saveGroupAttendance(
      request.user?.sub,
      groupId,
      dto,
    );
  }

  @Get('groups/:groupId/grades')
  async getGroupGrades(
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
    return this.teacherService.getGroupGrades(request.user?.sub, groupId);
  }

  @Post('groups/:groupId/grades')
  async saveGroupGrades(
    @Param('groupId') groupId: string,
    @Body() dto: SaveTermGradesDto,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.saveGroupGrades(
      request.user?.sub,
      groupId,
      dto,
    );
  }

  @Get('available-subjects')
  async getAvailableSubjects() {
    return this.teacherService.getAvailableSubjects();
  }

  @Get('groups/:groupId')
  async getGroupDetails(
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
    return this.teacherService.getGroupDetails(request.user?.sub, groupId);
  }

  @Post('groups')
  async createGroup(
    @Body() dto: CreateGroupDto,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.createGroup(request.user?.sub, dto);
  }

  @Patch('groups/:groupId')
  async updateGroup(
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.updateGroup(request.user?.sub, groupId, dto);
  }

  @Delete('groups/:groupId')
  async deleteGroup(
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
    return this.teacherService.deleteGroup(request.user?.sub, groupId);
  }

  @Delete('groups/:groupId/students/:studentId')
  async removeStudentFromGroup(
    @Param('groupId') groupId: string,
    @Param('studentId') studentId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.removeStudentFromGroup(
      request.user?.sub,
      groupId,
      studentId,
    );
  }

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
    return this.teacherService.getJoinRequests(request.user?.sub);
  }

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

  @Patch('join-requests/:requestId/reject')
  async rejectJoinRequest(
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
    return this.teacherService.rejectJoinRequest(
      request.user?.sub,
      requestId,
    );
  }

  // =========================================================================
  // TEACHER ASSIGNMENTS
  // =========================================================================

  @Get('subjects-and-topics')
  async getSubjectsAndTopics(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.getSubjectsAndTopics(request.user?.sub);
  }

  @Get('assignments')
  async getTeacherAssignments(
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.getTeacherAssignments(request.user?.sub);
  }

  @Get('assignments/:assignmentId')
  async getTeacherAssignmentDetails(
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
    return this.teacherService.getTeacherAssignmentDetails(
      request.user?.sub,
      assignmentId,
    );
  }

  @Post('assignments')
  async createAssignment(
    @Body()
    body: {
      topicId: string;
      title: string;
      description?: string;
      responseType?: 'TEXT' | 'FILE' | 'TEXT_AND_FILE';
      attachmentUrl?: string;
      maxScore?: number;
      deadline?: string | null;
      allowLate?: boolean;
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
    return this.teacherService.createAssignment(request.user?.sub, body);
  }

  @Patch('assignments/:assignmentId')
  async updateAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      responseType?: 'TEXT' | 'FILE' | 'TEXT_AND_FILE';
      attachmentUrl?: string;
      maxScore?: number;
      deadline?: string | null;
      allowLate?: boolean;
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
    return this.teacherService.updateAssignment(
      request.user?.sub,
      assignmentId,
      body,
    );
  }

  @Delete('assignments/:assignmentId')
  async deleteAssignment(
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
    return this.teacherService.deleteAssignment(
      request.user?.sub,
      assignmentId,
    );
  }

  @Patch('assignments/:assignmentId/submissions/:submissionId/grade')
  async gradeSubmission(
    @Param('assignmentId') assignmentId: string,
    @Param('submissionId') submissionId: string,
    @Body()
    body: {
      score: number;
      teacherComment?: string;
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
    return this.teacherService.gradeSubmission(
      request.user?.sub,
      assignmentId,
      submissionId,
      body,
    );
  }

  // ==========================================
  // TESTS (TEACHER)
  // ==========================================

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
    return this.teacherService.getTests(request.user?.sub);
  }

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
    return this.teacherService.getTestDetails(request.user?.sub, testId);
  }

  @Post('tests')
  async createTest(
    @Body()
    body: {
      subjectId?: string;
      topicId?: string | null;
      title?: string;
      description?: string;
      durationMinutes?: number;
      maxScore?: number;
      shuffleQuestions?: boolean;
      shuffleAnswers?: boolean;
      showResultsImmediately?: boolean;
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
    return this.teacherService.createTest(request.user?.sub, body);
  }

  @Patch('tests/:testId')
  async updateTest(
    @Param('testId') testId: string,
    @Body()
    body: {
      subjectId?: string;
      topicId?: string | null;
      title?: string;
      description?: string;
      durationMinutes?: number;
      maxScore?: number;
      shuffleQuestions?: boolean;
      shuffleAnswers?: boolean;
      showResultsImmediately?: boolean;
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
    return this.teacherService.updateTest(request.user?.sub, testId, body);
  }

  @Delete('tests/:testId')
  async deleteTest(
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
    return this.teacherService.deleteTest(request.user?.sub, testId);
  }

  @Post('tests/:testId/questions')
  async addQuestion(
    @Param('testId') testId: string,
    @Body()
    body: {
      type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_TEXT';
      questionText?: string;
      points?: number;
      explanation?: string;
      options?: { optionText: string; isCorrect: boolean; order?: number }[];
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
    return this.teacherService.addQuestion(request.user?.sub, testId, body);
  }

  @Patch('tests/:testId/questions/:questionId')
  async updateQuestion(
    @Param('testId') testId: string,
    @Param('questionId') questionId: string,
    @Body()
    body: {
      type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_TEXT';
      questionText?: string;
      points?: number;
      explanation?: string;
      options?: { id?: string; optionText: string; isCorrect: boolean; order?: number }[];
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
    return this.teacherService.updateQuestion(request.user?.sub, testId, questionId, body);
  }

  @Delete('tests/:testId/questions/:questionId')
  async deleteQuestion(
    @Param('testId') testId: string,
    @Param('questionId') questionId: string,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.deleteQuestion(request.user?.sub, testId, questionId);
  }

  @Post('tests/:testId/publish')
  async publishTest(
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
    return this.teacherService.publishTest(request.user?.sub, testId);
  }

  @Post('tests/:testId/archive')
  async archiveTest(
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
    return this.teacherService.archiveTest(request.user?.sub, testId);
  }

  @Get('tests/:testId/results')
  async getTestResults(
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
    return this.teacherService.getTestResults(request.user?.sub, testId);
  }

  @Get('tests/:testId/results/:attemptId')
  async getAttemptDetail(
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
    return this.teacherService.getAttemptDetail(request.user?.sub, testId, attemptId);
  }

  @Patch('tests/:testId/results/:attemptId/questions/:questionId')
  async gradeAttemptQuestion(
    @Param('testId') testId: string,
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
    @Body()
    body: {
      score: number;
      comment?: string;
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
    return this.teacherService.gradeAttemptQuestion(
      request.user?.sub,
      testId,
      attemptId,
      questionId,
      body,
    );
  }

  // ==========================================
  // TOPICS & MATERIALS MANAGEMENT
  // ==========================================

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
    return this.teacherService.getSubjects(request.user?.sub);
  }

  @Get('subjects/:subjectId/topics')
  async getSubjectTopics(
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
    return this.teacherService.getSubjectTopics(request.user?.sub, subjectId);
  }

  @Post('subjects/:subjectId/topics')
  async createTopic(
    @Param('subjectId') subjectId: string,
    @Body() dto: CreateTopicDto,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.createTopic(request.user?.sub, subjectId, dto);
  }

  @Patch('topics/:topicId')
  async updateTopic(
    @Param('topicId') topicId: string,
    @Body() dto: UpdateTopicDto,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.updateTopic(request.user?.sub, topicId, dto);
  }

  @Delete('topics/:topicId')
  async deleteTopic(
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
    return this.teacherService.deleteTopic(request.user?.sub, topicId);
  }

  @Put('subjects/:subjectId/topics/reorder')
  async reorderTopics(
    @Param('subjectId') subjectId: string,
    @Body() dto: ReorderTopicsDto,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.reorderTopics(request.user?.sub, subjectId, dto.topicIds);
  }

  @Get('topics/:topicId/materials')
  async getTopicMaterials(
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
    return this.teacherService.getTopicMaterials(request.user?.sub, topicId);
  }

  @Post('topics/:topicId/materials')
  async createMaterial(
    @Param('topicId') topicId: string,
    @Body() dto: CreateMaterialDto,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.createMaterial(request.user?.sub, topicId, dto);
  }

  @Patch('materials/:materialId')
  async updateMaterial(
    @Param('materialId') materialId: string,
    @Body() dto: UpdateMaterialDto,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.updateMaterial(request.user?.sub, materialId, dto);
  }

  @Delete('materials/:materialId')
  async deleteMaterial(
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
    return this.teacherService.deleteMaterial(request.user?.sub, materialId);
  }

  @Put('topics/:topicId/materials/reorder')
  async reorderMaterials(
    @Param('topicId') topicId: string,
    @Body() dto: ReorderMaterialsDto,
    @Req()
    request: Request & {
      user?: {
        sub?: string;
        email?: string;
        role?: string;
      };
    },
  ) {
    return this.teacherService.reorderMaterials(request.user?.sub, topicId, dto.materialIds);
  }
}