import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  private async getTeacherProfileByUserId(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Қолданушы анықталмады');
    }

    const teacher = await this.prisma.teacherProfile.findUnique({
      where: {
        userId,
      },
      include: {
        user: true,
        university: true,
        faculty: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Мұғалім профилі табылмады');
    }

    return teacher;
  }

  async getProfile(userId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    return {
      message: 'Оқытушы профилі',
      profile: {
        id: teacher.id,
        fullName: teacher.user.fullName,
        email: teacher.user.email,
        phone: teacher.user.phone,
        university: teacher.university
          ? {
              id: teacher.university.id,
              name: teacher.university.name,
              shortName: teacher.university.shortName,
            }
          : {
              id: '',
              name: 'Университет көрсетілмеген',
              shortName: null,
            },
        faculty: teacher.faculty
          ? {
              id: teacher.faculty.id,
              name: teacher.faculty.name,
            }
          : {
              id: '',
              name: 'Факультет көрсетілмеген',
            },
        department: teacher.department,
        position: teacher.position,
        experience: teacher.experience,
        bio: teacher.bio,
        avatarUrl: teacher.avatarUrl,
        premium: teacher.premium,
      },
    };
  }

  async getDashboard(userId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const [groups, pendingRequestsCount] = await Promise.all([
      this.prisma.group.findMany({
        where: {
          teacherId: teacher.id,
        },
        include: {
          subject: true,
          _count: {
            select: {
              memberships: {
                where: { status: 'ACTIVE' },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.joinRequest.count({
        where: {
          status: 'PENDING',
          group: {
            teacherId: teacher.id,
          },
        },
      }),
    ]);

    const activeStudentsCount = groups.reduce(
      (acc, group) => acc + group._count.memberships,
      0,
    );

    return {
      message: 'Teacher Dashboard деректері',
      teacher: {
        id: teacher.id,
        fullName: teacher.user.fullName,
        email: teacher.user.email,
        position: teacher.position,
        department: teacher.department,
        university: teacher.university?.name || 'SmartUni University',
        faculty: teacher.faculty?.name || 'SmartUni Faculty',
      },
      groupsCount: groups.length,
      pendingRequestsCount,
      activeStudentsCount,
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        subject: {
          id: group.subject.id,
          name: group.subject.name,
          code: group.subject.code,
        },
        course: group.course,
        capacity: group.capacity,
        activeStudentsCount: group._count.memberships,
        availablePlaces: Math.max(0, group.capacity - group._count.memberships),
        semester: group.semester,
        academicYear: group.academicYear,
        lessonDay: group.lessonDay,
        lessonTime: group.lessonTime,
        classroom: group.classroom,
        status: group.status,
      })),
    };
  }

  async getGroups(userId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const groups = await this.prisma.group.findMany({
      where: {
        teacherId: teacher.id,
      },
      include: {
        subject: true,
        _count: {
          select: {
            memberships: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Оқытушы топтарының тізімі',
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        subject: {
          id: group.subject.id,
          name: group.subject.name,
          code: group.subject.code,
        },
        course: group.course,
        capacity: group.capacity,
        activeStudentsCount: group._count.memberships,
        availablePlaces: Math.max(0, group.capacity - group._count.memberships),
        semester: group.semester,
        academicYear: group.academicYear,
        lessonDay: group.lessonDay,
        lessonTime: group.lessonTime,
        classroom: group.classroom,
        status: group.status,
      })),
    };
  }

  async getGroupStudents(userId?: string, groupId?: string) {
    if (!groupId) {
      throw new NotFoundException('Топ көрсетілмеді');
    }

    const teacher = await this.getTeacherProfileByUserId(userId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        subject: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Топ табылмады');
    }

    if (group.teacherId !== teacher.id) {
      throw new ForbiddenException(
        'Бұл топтың студенттерін көруге рұқсатыңыз жоқ',
      );
    }

    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        groupId: group.id,
        status: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            user: true,
            university: true,
            faculty: true,
            major: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return {
      message: 'Топ студенттерінің тізімі',
      group: {
        id: group.id,
        name: group.name,
        subject: group.subject.name,
        course: group.course,
        capacity: group.capacity,
        activeStudentsCount: memberships.length,
      },
      students: memberships.map((membership) => ({
        studentProfileId: membership.student.id,
        fullName: membership.student.user.fullName,
        email: membership.student.user.email,
        university: membership.student.university?.name || '',
        faculty: membership.student.faculty?.name || '',
        major: membership.student.major?.name || '',
        course: membership.student.course,
        joinedAt: membership.joinedAt,
        membershipStatus: membership.status,
      })),
    };
  }

  async getJoinRequests(userId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const requests = await this.prisma.joinRequest.findMany({
      where: {
        status: 'PENDING',
        group: {
          teacherId: teacher.id,
        },
      },
      include: {
        student: {
          include: {
            user: true,
            university: true,
            faculty: true,
            major: true,
          },
        },
        group: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      message: 'Топқа қосылу өтініштері',
      requests: requests.map((request) => ({
        id: request.id,
        status: request.status,
        createdAt: request.createdAt,
        student: {
          id: request.student.id,
          fullName: request.student.user.fullName,
          email: request.student.user.email,
          phone: request.student.user.phone,
          course: request.student.course,
          university: request.student.university?.name || '',
          faculty: request.student.faculty?.name || '',
          major: request.student.major?.name || '',
        },
        group: {
          id: request.group.id,
          name: request.group.name,
          subject: {
            id: request.group.subject.id,
            name: request.group.subject.name,
            code: request.group.subject.code,
          },
        },
      })),
    };
  }

  async acceptJoinRequest(userId?: string, requestId?: string) {
    if (!requestId) {
      throw new NotFoundException('Өтініш көрсетілмеді');
    }

    const teacher = await this.getTeacherProfileByUserId(userId);

    const request = await this.prisma.joinRequest.findUnique({
      where: {
        id: requestId,
      },
      include: {
        group: true,
        student: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Өтініш табылмады');
    }

    if (request.group.teacherId !== teacher.id) {
      throw new ForbiddenException(
        'Бұл өтінішті басқаруға рұқсатыңыз жоқ',
      );
    }

    if (request.status !== 'PENDING') {
      throw new ConflictException('Бұл өтініш бұрын өңделген');
    }

    const existingMembership = await this.prisma.groupMembership.findUnique({
      where: {
        studentId_groupId: {
          studentId: request.studentId,
          groupId: request.groupId,
        },
      },
    });

    if (existingMembership && existingMembership.status === 'ACTIVE') {
      throw new ConflictException('Студент бұл топтың мүшесі болып тұр');
    }

    const currentStudents = await this.prisma.groupMembership.count({
      where: {
        groupId: request.groupId,
        status: 'ACTIVE',
      },
    });

    if (currentStudents >= request.group.capacity) {
      throw new ConflictException('Бұл топта бос орын жоқ');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.joinRequest.update({
        where: {
          id: request.id,
        },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      });

      let membership;

      if (existingMembership) {
        membership = await tx.groupMembership.update({
          where: {
            id: existingMembership.id,
          },
          data: {
            status: 'ACTIVE',
            joinedAt: new Date(),
            leftAt: null,
          },
        });
      } else {
        membership = await tx.groupMembership.create({
          data: {
            studentId: request.studentId,
            groupId: request.groupId,
            status: 'ACTIVE',
          },
        });
      }

      return {
        updatedRequest,
        membership,
      };
    });

    return {
      message: 'Студенттің топқа қосылу өтініші қабылданды',
      request: {
        id: result.updatedRequest.id,
        status: result.updatedRequest.status,
        respondedAt: result.updatedRequest.respondedAt,
      },
      membership: {
        id: result.membership.id,
        studentId: result.membership.studentId,
        groupId: result.membership.groupId,
        status: result.membership.status,
        joinedAt: result.membership.joinedAt,
      },
    };
  }

  async rejectJoinRequest(userId?: string, requestId?: string) {
    if (!requestId) {
      throw new NotFoundException('Өтініш көрсетілмеді');
    }

    const teacher = await this.getTeacherProfileByUserId(userId);

    const request = await this.prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        group: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Өтініш табылмады');
    }

    if (request.group.teacherId !== teacher.id) {
      throw new ForbiddenException(
        'Бұл өтінішті басқаруға рұқсатыңыз жоқ',
      );
    }

    if (request.status !== 'PENDING') {
      throw new ConflictException('Бұл өтініш бұрын өңделген');
    }

    const updatedRequest = await this.prisma.joinRequest.update({
      where: { id: request.id },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    });

    return {
      message: 'Өтініш қабылданбады',
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        respondedAt: updatedRequest.respondedAt,
      },
    };
  }

  // =========================================================================
  // TEACHER ASSIGNMENTS
  // =========================================================================

  private async verifyTeacherAssignmentOwnership(teacherId: string, assignmentId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Тапсырма табылмады');
    }

    const group = await this.prisma.group.findFirst({
      where: {
        teacherId,
        subjectId: assignment.topic.subjectId,
      },
    });

    if (!group) {
      throw new ForbiddenException('Бұл тапсырмаға рұқсатыңыз жоқ (сіз оқытатын пәнге жатпайды)');
    }

    return assignment;
  }

  async getTeacherAssignments(userId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const groups = await this.prisma.group.findMany({
      where: { teacherId: teacher.id },
      select: { subjectId: true },
    });
    const subjectIds = [...new Set(groups.map((g) => g.subjectId))];

    const assignments = await this.prisma.assignment.findMany({
      where: {
        topic: {
          subjectId: { in: subjectIds },
        },
      },
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
        submissions: true,
      },
      orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
    });

    const items = assignments.map((a) => {
      const submissionsCount = a.submissions.filter((s) => s.status !== 'NOT_SUBMITTED').length;
      const gradedCount = a.submissions.filter((s) => s.status === 'GRADED').length;
      const isLate = a.deadline ? new Date() > new Date(a.deadline) : false;

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        responseType: a.responseType,
        attachmentUrl: a.attachmentUrl,
        maxScore: a.maxScore,
        assignedAt: a.assignedAt,
        deadline: a.deadline,
        allowLate: a.allowLate,
        createdAt: a.createdAt,
        subject: {
          id: a.topic.subject.id,
          name: a.topic.subject.name,
          code: a.topic.subject.code,
        },
        topic: {
          id: a.topic.id,
          title: a.topic.title,
        },
        submissionsCount,
        gradedCount,
        isLate,
      };
    });

    return {
      message: 'Оқытушы тапсырмалары',
      assignments: items,
    };
  }

  async getTeacherAssignmentDetails(userId: string | undefined, assignmentId: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);
    const assignment = await this.verifyTeacherAssignmentOwnership(teacher.id, assignmentId);

    const groups = await this.prisma.group.findMany({
      where: {
        teacherId: teacher.id,
        subjectId: assignment.topic.subjectId,
      },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const allStudents = groups.flatMap((g) =>
      g.memberships.map((m) => ({
        groupId: g.id,
        groupName: g.name,
        studentId: m.student.id,
        fullName: m.student.user.fullName,
        email: m.student.user.email,
        course: m.student.course,
      })),
    );

    const uniqueStudentsMap = new Map<string, (typeof allStudents)[0]>();
    allStudents.forEach((s) => {
      if (!uniqueStudentsMap.has(s.studentId)) {
        uniqueStudentsMap.set(s.studentId, s);
      }
    });

    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    const submissionByStudentId = new Map(submissions.map((s) => [s.studentId, s]));

    const studentList = Array.from(uniqueStudentsMap.values()).map((st) => {
      const sub = submissionByStudentId.get(st.studentId);
      return {
        student: {
          id: st.studentId,
          fullName: st.fullName,
          email: st.email,
          groupName: st.groupName,
          course: st.course,
        },
        submission: sub
          ? {
              id: sub.id,
              textAnswer: sub.textAnswer,
              fileUrl: sub.fileUrl,
              status: sub.status,
              submittedAt: sub.submittedAt,
              score: sub.score,
              teacherComment: sub.teacherComment,
              gradedAt: sub.gradedAt,
            }
          : null,
        status: sub ? sub.status : 'NOT_SUBMITTED',
        score: sub?.score ?? null,
        teacherComment: sub?.teacherComment ?? null,
      };
    });

    return {
      message: 'Тапсырманың толық мәліметі',
      assignment: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        responseType: assignment.responseType,
        attachmentUrl: assignment.attachmentUrl,
        maxScore: assignment.maxScore,
        assignedAt: assignment.assignedAt,
        deadline: assignment.deadline,
        allowLate: assignment.allowLate,
        createdAt: assignment.createdAt,
      },
      subject: {
        id: assignment.topic.subject.id,
        name: assignment.topic.subject.name,
        code: assignment.topic.subject.code,
      },
      topic: {
        id: assignment.topic.id,
        title: assignment.topic.title,
      },
      submissionsCount: submissions.filter((s) => s.status !== 'NOT_SUBMITTED').length,
      gradedCount: submissions.filter((s) => s.status === 'GRADED').length,
      totalStudents: uniqueStudentsMap.size,
      studentSubmissions: studentList,
    };
  }

  async createAssignment(
    userId: string | undefined,
    dto: {
      topicId: string;
      title: string;
      description?: string;
      responseType?: 'TEXT' | 'FILE' | 'TEXT_AND_FILE';
      attachmentUrl?: string;
      maxScore?: number;
      deadline?: string | null;
      allowLate?: boolean;
    },
  ) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    if (!dto.topicId || !dto.title?.trim()) {
      throw new BadRequestException('Тақырып пен тапсырма атауы міндетті');
    }

    const topic = await this.prisma.topic.findUnique({
      where: { id: dto.topicId },
      include: { subject: true },
    });

    if (!topic) {
      throw new NotFoundException('Тақырып табылмады');
    }

    const group = await this.prisma.group.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId: topic.subjectId,
      },
    });

    if (!group) {
      throw new ForbiddenException('Бұл пән бойынша белсенді оқу топтарыңыз жоқ');
    }

    const maxScoreNum = dto.maxScore ? Number(dto.maxScore) : 100;
    if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
      throw new BadRequestException('Максималды балл 0-ден үлкен бүтін сан болуы керек');
    }

    const assignment = await this.prisma.assignment.create({
      data: {
        topicId: dto.topicId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        responseType: dto.responseType || 'TEXT',
        attachmentUrl: dto.attachmentUrl?.trim() || null,
        maxScore: maxScoreNum,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        allowLate: Boolean(dto.allowLate),
      },
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
      },
    });

    return {
      message: 'Тапсырма сәтті жасалды',
      assignment,
    };
  }

  async updateAssignment(
    userId: string | undefined,
    assignmentId: string,
    dto: {
      title?: string;
      description?: string;
      responseType?: 'TEXT' | 'FILE' | 'TEXT_AND_FILE';
      attachmentUrl?: string;
      maxScore?: number;
      deadline?: string | null;
      allowLate?: boolean;
    },
  ) {
    const teacher = await this.getTeacherProfileByUserId(userId);
    const existing = await this.verifyTeacherAssignmentOwnership(teacher.id, assignmentId);

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.description !== undefined) updateData.description = dto.description?.trim() || null;
    if (dto.responseType !== undefined) updateData.responseType = dto.responseType;
    if (dto.attachmentUrl !== undefined) updateData.attachmentUrl = dto.attachmentUrl?.trim() || null;
    if (dto.maxScore !== undefined) {
      const maxScoreNum = Number(dto.maxScore);
      if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
        throw new BadRequestException('Максималды балл 0-ден үлкен болуы керек');
      }
      updateData.maxScore = maxScoreNum;
    }
    if (dto.deadline !== undefined) {
      updateData.deadline = dto.deadline ? new Date(dto.deadline) : null;
    }
    if (dto.allowLate !== undefined) {
      updateData.allowLate = Boolean(dto.allowLate);
    }

    const updated = await this.prisma.assignment.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
      },
    });

    return {
      message: 'Тапсырма жаңартылды',
      assignment: updated,
    };
  }

  async deleteAssignment(userId: string | undefined, assignmentId: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);
    const existing = await this.verifyTeacherAssignmentOwnership(teacher.id, assignmentId);

    await this.prisma.assignment.delete({
      where: { id: existing.id },
    });

    return {
      message: 'Тапсырма сәтті өшірілді',
    };
  }

  async gradeSubmission(
    userId: string | undefined,
    assignmentId: string,
    submissionId: string,
    dto: { score: number; teacherComment?: string },
  ) {
    const teacher = await this.getTeacherProfileByUserId(userId);
    const assignment = await this.verifyTeacherAssignmentOwnership(teacher.id, assignmentId);

    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission || submission.assignmentId !== assignment.id) {
      throw new NotFoundException('Студент жауабы табылмады');
    }

    const scoreNum = Number(dto.score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > assignment.maxScore) {
      throw new BadRequestException(
        `Балл 0 мен ${assignment.maxScore} аралығында болуы керек`,
      );
    }

    const updated = await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: Math.round(scoreNum),
        teacherComment: dto.teacherComment?.trim() || null,
        status: 'GRADED',
        gradedAt: new Date(),
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    return {
      message: 'Студент жауабы сәтті бағаланды',
      submission: {
        id: updated.id,
        score: updated.score,
        teacherComment: updated.teacherComment,
        status: updated.status,
        gradedAt: updated.gradedAt,
        studentName: updated.student.user.fullName,
      },
    };
  }

  async getSubjectsAndTopics(userId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const groups = await this.prisma.group.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: {
          include: {
            topics: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    const subjectsMap = new Map<string, any>();
    groups.forEach((g) => {
      if (!subjectsMap.has(g.subject.id)) {
        subjectsMap.set(g.subject.id, {
          id: g.subject.id,
          name: g.subject.name,
          code: g.subject.code,
          topics: g.subject.topics.map((t) => ({
            id: t.id,
            title: t.title,
            order: t.order,
          })),
        });
      }
    });

    return {
      message: 'Оқытушы пәндері мен тақырыптары',
      subjects: Array.from(subjectsMap.values()),
    };
  }

  // ==========================================
  // TEST SYSTEM (TEACHER)
  // ==========================================

  async getTests(userId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const tests = await this.prisma.test.findMany({
      where: {
        createdByTeacherProfileId: teacher.id,
      },
      include: {
        subject: true,
        topic: true,
        questions: {
          select: { id: true, points: true },
        },
        attempts: {
          select: { id: true, status: true, score: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Оқытушы тесттері',
      tests: tests.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        subjectId: t.subjectId,
        subjectName: t.subject.name,
        subjectCode: t.subject.code,
        topicId: t.topicId,
        topicTitle: t.topic?.title || null,
        durationMinutes: t.durationMinutes,
        maxScore: t.maxScore,
        status: t.status,
        shuffleQuestions: t.shuffleQuestions,
        shuffleAnswers: t.shuffleAnswers,
        showResultsImmediately: t.showResultsImmediately,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        questionsCount: t.questions.length,
        totalPoints: t.questions.reduce((sum, q) => sum + q.points, 0),
        attemptsCount: t.attempts.length,
        completedAttemptsCount: t.attempts.filter((a) => a.status === 'COMPLETED' || a.status === 'EXPIRED').length,
      })),
    };
  }

  async getTestDetails(userId?: string, testId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    if (!testId) {
      throw new BadRequestException('Тест ID көрсетілмеген');
    }

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        subject: true,
        topic: true,
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: {
              orderBy: { order: 'asc' },
            },
          },
        },
        attempts: {
          include: {
            student: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Тест табылмады');
    }

    if (test.createdByTeacherProfileId !== teacher.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    return {
      message: 'Тест мәліметтері',
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        subjectId: test.subjectId,
        subjectName: test.subject.name,
        subjectCode: test.subject.code,
        topicId: test.topicId,
        topicTitle: test.topic?.title || null,
        durationMinutes: test.durationMinutes,
        maxScore: test.maxScore,
        status: test.status,
        shuffleQuestions: test.shuffleQuestions,
        shuffleAnswers: test.shuffleAnswers,
        showResultsImmediately: test.showResultsImmediately,
        createdAt: test.createdAt,
        updatedAt: test.updatedAt,
        questions: test.questions.map((q) => ({
          id: q.id,
          type: q.type,
          questionText: q.questionText,
          order: q.order,
          points: q.points,
          explanation: q.explanation,
          options: q.options.map((o) => ({
            id: o.id,
            optionText: o.optionText,
            isCorrect: o.isCorrect,
            order: o.order,
          })),
        })),
        attemptsCount: test.attempts.length,
      },
    };
  }

  async createTest(
    userId?: string,
    dto?: {
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
  ) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    if (!dto?.subjectId) {
      throw new BadRequestException('Пән таңдалуы қажет');
    }
    if (!dto?.title?.trim()) {
      throw new BadRequestException('Тест атауы бос болмауы керек');
    }

    // Verify teacher teaches this subject
    const group = await this.prisma.group.findFirst({
      where: {
        teacherId: teacher.id,
        subjectId: dto.subjectId,
      },
    });

    if (!group) {
      throw new ForbiddenException('Сіз бұл пән бойынша топтарға сабақ бермейсіз');
    }

    const duration = dto.durationMinutes && dto.durationMinutes > 0 ? Number(dto.durationMinutes) : 15;
    const maxScore = dto.maxScore && dto.maxScore > 0 ? Number(dto.maxScore) : 100;

    const test = await this.prisma.test.create({
      data: {
        subjectId: dto.subjectId,
        topicId: dto.topicId?.trim() || null,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        durationMinutes: duration,
        maxScore: maxScore,
        status: 'DRAFT',
        shuffleQuestions: dto.shuffleQuestions ?? false,
        shuffleAnswers: dto.shuffleAnswers ?? false,
        showResultsImmediately: dto.showResultsImmediately ?? true,
        createdByTeacherProfileId: teacher.id,
      },
      include: {
        subject: true,
        topic: true,
      },
    });

    return {
      message: 'Тест жобасы (DRAFT) сәтті жасалды',
      test,
    };
  }

  async updateTest(
    userId?: string,
    testId?: string,
    dto?: {
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
  ) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      throw new NotFoundException('Тест табылмады');
    }
    if (test.createdByTeacherProfileId !== teacher.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    const updated = await this.prisma.test.update({
      where: { id: testId },
      data: {
        title: dto?.title ? dto.title.trim() : undefined,
        description: dto?.description !== undefined ? dto.description?.trim() || null : undefined,
        durationMinutes: dto?.durationMinutes && dto.durationMinutes > 0 ? Number(dto.durationMinutes) : undefined,
        maxScore: dto?.maxScore && dto.maxScore > 0 ? Number(dto.maxScore) : undefined,
        topicId: dto?.topicId !== undefined ? (dto.topicId?.trim() || null) : undefined,
        shuffleQuestions: dto?.shuffleQuestions !== undefined ? dto.shuffleQuestions : undefined,
        shuffleAnswers: dto?.shuffleAnswers !== undefined ? dto.shuffleAnswers : undefined,
        showResultsImmediately: dto?.showResultsImmediately !== undefined ? dto.showResultsImmediately : undefined,
      },
    });

    return {
      message: 'Тест параметрлері жаңартылды',
      test: updated,
    };
  }

  async deleteTest(userId?: string, testId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      throw new NotFoundException('Тест табылмады');
    }
    if (test.createdByTeacherProfileId !== teacher.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    await this.prisma.test.delete({
      where: { id: testId },
    });

    return {
      message: 'Тест сәтті өшірілді',
      testId,
    };
  }

  private validateQuestionDto(dto: {
    type?: string;
    questionText?: string;
    points?: number;
    options?: { optionText: string; isCorrect: boolean }[];
  }) {
    if (!dto.questionText?.trim()) {
      throw new BadRequestException('Сұрақ мәтіні бос болмауы керек');
    }

    const type = dto.type || 'SINGLE_CHOICE';
    const points = dto.points && dto.points > 0 ? Number(dto.points) : 1;
    const options = dto.options || [];

    if (type === 'SINGLE_CHOICE') {
      if (options.length < 2) {
        throw new BadRequestException('Бір дұрыс жауапты сұраққа кемінде 2 жауап нұсқасы қажет');
      }
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        throw new BadRequestException('Дәл 1 дұрыс жауап нұсқасын белгілеу қажет');
      }
    } else if (type === 'MULTIPLE_CHOICE') {
      if (options.length < 2) {
        throw new BadRequestException('Бірнеше дұрыс жауапты сұраққа кемінде 2 жауап нұсқасы қажет');
      }
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount < 1) {
        throw new BadRequestException('Кемінде 1 дұрыс жауап нұсқасы болуы керек');
      }
    } else if (type === 'TRUE_FALSE') {
      if (options.length !== 2) {
        throw new BadRequestException('True/False сұрағы үшін 2 нұсқа болуы керек');
      }
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        throw new BadRequestException('True/False үшін 1 дұрыс нұсқа болуы қажет');
      }
    } else if (type === 'OPEN_TEXT') {
      // Options not required for OPEN_TEXT
    } else {
      throw new BadRequestException('Қолдау көрсетілмейтін сұрақ түрі');
    }

    return { type, points };
  }

  async addQuestion(
    userId?: string,
    testId?: string,
    dto?: {
      type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_TEXT';
      questionText?: string;
      points?: number;
      explanation?: string;
      options?: { optionText: string; isCorrect: boolean; order?: number }[];
    },
  ) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    });

    if (!test) {
      throw new NotFoundException('Тест табылмады');
    }
    if (test.createdByTeacherProfileId !== teacher.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    const { type, points } = this.validateQuestionDto(dto || {});

    const order = test.questions.length + 1;

    const question = await this.prisma.testQuestion.create({
      data: {
        testId: test.id,
        type: type as any,
        questionText: dto!.questionText!.trim(),
        points,
        explanation: dto?.explanation?.trim() || null,
        order,
        options: {
          create: (dto?.options || []).map((o, idx) => ({
            optionText: o.optionText.trim(),
            isCorrect: Boolean(o.isCorrect),
            order: o.order || idx + 1,
          })),
        },
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return {
      message: 'Сұрақ сәтті қосылды',
      question,
    };
  }

  async updateQuestion(
    userId?: string,
    testId?: string,
    questionId?: string,
    dto?: {
      type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_TEXT';
      questionText?: string;
      points?: number;
      explanation?: string;
      options?: { id?: string; optionText: string; isCorrect: boolean; order?: number }[];
    },
  ) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
    });
    if (!test) {
      throw new NotFoundException('Тест табылмады');
    }
    if (test.createdByTeacherProfileId !== teacher.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    const question = await this.prisma.testQuestion.findUnique({
      where: { id: questionId },
      include: { options: true },
    });
    if (!question || question.testId !== test.id) {
      throw new NotFoundException('Сұрақ табылмады');
    }

    const type = dto?.type || question.type;
    const points = dto?.points && dto.points > 0 ? Number(dto.points) : question.points;
    const questionText = dto?.questionText ? dto.questionText.trim() : question.questionText;

    if (dto?.options || dto?.type) {
      this.validateQuestionDto({
        type,
        questionText,
        points,
        options: dto?.options || question.options,
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const q = await tx.testQuestion.update({
        where: { id: questionId },
        data: {
          type: type as any,
          questionText,
          points,
          explanation: dto?.explanation !== undefined ? dto.explanation?.trim() || null : undefined,
        },
      });

      if (dto?.options) {
        await tx.testOption.deleteMany({
          where: { questionId },
        });

        await tx.testOption.createMany({
          data: dto.options.map((o, idx) => ({
            questionId: question.id,
            optionText: o.optionText.trim(),
            isCorrect: Boolean(o.isCorrect),
            order: o.order || idx + 1,
          })),
        });
      }

      return tx.testQuestion.findUnique({
        where: { id: questionId },
        include: {
          options: { orderBy: { order: 'asc' } },
        },
      });
    });

    return {
      message: 'Сұрақ жаңартылды',
      question: updated,
    };
  }

  async deleteQuestion(userId?: string, testId?: string, questionId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
    });
    if (!test) {
      throw new NotFoundException('Тест табылмады');
    }
    if (test.createdByTeacherProfileId !== teacher.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    await this.prisma.testQuestion.delete({
      where: { id: questionId },
    });

    return {
      message: 'Сұрақ өшірілді',
      questionId,
    };
  }

  async publishTest(userId?: string, testId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Тест табылмады');
    }
    if (test.createdByTeacherProfileId !== teacher.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    if (test.questions.length === 0) {
      throw new BadRequestException('Тестте кемінде бір сұрақ болуы қажет');
    }

    for (const q of test.questions) {
      this.validateQuestionDto({
        type: q.type,
        questionText: q.questionText,
        points: q.points,
        options: q.options,
      });
    }

    const updated = await this.prisma.test.update({
      where: { id: testId },
      data: {
        status: 'PUBLISHED',
      },
    });

    return {
      message: 'Тест сәтті жарияланды',
      test: updated,
    };
  }

  async archiveTest(userId?: string, testId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      throw new NotFoundException('Тест табылмады');
    }
    if (test.createdByTeacherProfileId !== teacher.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    const updated = await this.prisma.test.update({
      where: { id: testId },
      data: {
        status: 'ARCHIVED',
      },
    });

    return {
      message: 'Тест мұрағатталды',
      test: updated,
    };
  }

  async getTestResults(userId?: string, testId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        subject: true,
        questions: {
          include: { options: true },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Тест табылмады');
    }
    if (test.createdByTeacherProfileId !== teacher.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    const attempts = await this.prisma.testAttempt.findMany({
      where: { testId },
      include: {
        student: {
          include: { user: true },
        },
        answers: {
          include: { question: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return {
      message: 'Тест нәтижелері',
      test: {
        id: test.id,
        title: test.title,
        subjectName: test.subject.name,
        maxScore: test.maxScore,
        questionsCount: test.questions.length,
      },
      results: attempts.map((a) => {
        const openQuestions = a.answers.filter((ans) => ans.question.type === 'OPEN_TEXT');
        const pendingOpenCount = openQuestions.filter((ans) => ans.score === null).length;

        return {
          id: a.id,
          studentId: a.student.id,
          studentName: a.student.user.fullName,
          studentEmail: a.student.user.email,
          status: a.status,
          startedAt: a.startedAt,
          submittedAt: a.submittedAt,
          score: a.score,
          percentage: a.percentage,
          correctAnswers: a.correctAnswers,
          totalQuestions: a.totalQuestions,
          pendingOpenCount,
        };
      }),
    };
  }

  async getAttemptDetail(userId?: string, testId?: string, attemptId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: { subject: true },
    });
    if (!test) {
      throw new NotFoundException('Тест табылмады');
    }
    if (test.createdByTeacherProfileId !== teacher.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: {
          include: { user: true },
        },
        answers: {
          include: {
            question: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!attempt || attempt.testId !== test.id) {
      throw new NotFoundException('Студент нәтижесі табылмады');
    }

    return {
      message: 'Тест нәтижесінің толық мәліметі',
      attempt: {
        id: attempt.id,
        studentName: attempt.student.user.fullName,
        studentEmail: attempt.student.user.email,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        score: attempt.score,
        percentage: attempt.percentage,
        correctAnswers: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        answers: attempt.answers.map((ans) => {
          let selectedOptions: string[] = [];
          try {
            if (ans.selectedOptionIds) {
              selectedOptions = JSON.parse(ans.selectedOptionIds);
            }
          } catch {
            selectedOptions = [];
          }

          return {
            id: ans.id,
            questionId: ans.questionId,
            questionText: ans.question.questionText,
            questionType: ans.question.type,
            points: ans.question.points,
            explanation: ans.question.explanation,
            textAnswer: ans.textAnswer,
            selectedOptionIds: selectedOptions,
            options: ans.question.options.map((opt) => ({
              id: opt.id,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
            })),
            isCorrect: ans.isCorrect,
            score: ans.score,
            teacherComment: ans.teacherComment,
          };
        }),
      },
    };
  }

  async gradeAttemptQuestion(
    userId?: string,
    testId?: string,
    attemptId?: string,
    questionId?: string,
    dto?: { score: number; comment?: string },
  ) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
    });
    if (!test) {
      throw new NotFoundException('Тест табылмады');
    }
    if (test.createdByTeacherProfileId !== teacher.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    const question = await this.prisma.testQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question || question.testId !== test.id) {
      throw new NotFoundException('Сұрақ табылмады');
    }

    if (dto?.score === undefined || isNaN(dto.score)) {
      throw new BadRequestException('Баға (score) көрсетілуі қажет');
    }

    const scoreNum = Number(dto.score);
    if (scoreNum < 0 || scoreNum > question.points) {
      throw new BadRequestException(`Баға 0 мен ${question.points} аралығында болуы тиіс`);
    }

    const answer = await this.prisma.testAnswer.findUnique({
      where: {
        attemptId_questionId: {
          attemptId: attemptId!,
          questionId: questionId!,
        },
      },
    });

    if (!answer) {
      throw new NotFoundException('Студент жауабы табылмады');
    }

    // Update answer
    await this.prisma.testAnswer.update({
      where: { id: answer.id },
      data: {
        score: scoreNum,
        isCorrect: scoreNum === question.points,
        teacherComment: dto.comment?.trim() || null,
      },
    });

    // Recalculate attempt score & percentage
    const allAnswers = await this.prisma.testAnswer.findMany({
      where: { attemptId },
      include: { question: true },
    });

    const allQuestions = await this.prisma.testQuestion.findMany({
      where: { testId },
    });

    const totalPossiblePoints = allQuestions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = allAnswers.reduce((sum, a) => sum + (a.score || 0), 0);
    const correctCount = allAnswers.filter((a) => a.isCorrect === true).length;

    const percentage = totalPossiblePoints > 0 ? Math.round((earnedPoints / totalPossiblePoints) * 100 * 10) / 10 : 0;

    const updatedAttempt = await this.prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        score: earnedPoints,
        percentage,
        correctAnswers: correctCount,
      },
    });

    return {
      message: 'Сұрақ бағасы сәтті сақталды және нәтиже қайта есептелді',
      answer: {
        questionId,
        score: scoreNum,
        comment: dto.comment?.trim() || null,
      },
      attempt: {
        id: updatedAttempt.id,
        score: updatedAttempt.score,
        percentage: updatedAttempt.percentage,
        correctAnswers: updatedAttempt.correctAnswers,
      },
    };
  }
}