import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTopicDto,
  UpdateTopicDto,
  CreateMaterialDto,
  UpdateMaterialDto,
} from './dto/course-content.dto';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';
import { SaveAttendanceDto } from './dto/attendance.dto';
import { SaveTermGradesDto, AssessmentPeriod } from './dto/term-grade.dto';
import {
  calculateAdmissionRating,
  calculateFinalScore,
  getGradeLetter,
  getGradeStatus,
} from '../common/grading.util';

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

  async getAvailableSubjects() {
    const subjects = await this.prisma.subject.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
      },
    });

    return {
      message: 'Қолжетімді пәндер тізімі',
      subjects,
    };
  }

  async getGroupDetails(userId?: string, groupId?: string) {
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
        'Бұл топтың мәліметтерін көруге рұқсатыңыз жоқ',
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

    const pendingRequests = await this.prisma.joinRequest.findMany({
      where: {
        groupId: group.id,
        status: 'PENDING',
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
        createdAt: 'asc',
      },
    });

    return {
      message: 'Топ туралы толық мәлімет',
      group: {
        id: group.id,
        name: group.name,
        subject: {
          id: group.subject.id,
          name: group.subject.name,
          code: group.subject.code,
          description: group.subject.description,
        },
        course: group.course,
        capacity: group.capacity,
        semester: group.semester,
        academicYear: group.academicYear,
        lessonDay: group.lessonDay,
        lessonTime: group.lessonTime,
        classroom: group.classroom,
        status: group.status,
        activeStudentsCount: memberships.length,
        availablePlaces: Math.max(0, group.capacity - memberships.length),
        createdAt: group.createdAt,
      },
      students: memberships.map((membership) => ({
        id: membership.id,
        studentProfileId: membership.student.id,
        fullName: membership.student.user.fullName,
        email: membership.student.user.email,
        phone: membership.student.user.phone,
        university: membership.student.university?.name || '',
        faculty: membership.student.faculty?.name || '',
        major: membership.student.major?.name || '',
        course: membership.student.course,
        joinedAt: membership.joinedAt,
        membershipStatus: membership.status,
      })),
      pendingRequests: pendingRequests.map((req) => ({
        id: req.id,
        status: req.status,
        createdAt: req.createdAt,
        student: {
          id: req.student.id,
          fullName: req.student.user.fullName,
          email: req.student.user.email,
          phone: req.student.user.phone,
          course: req.student.course,
          university: req.student.university?.name || '',
          faculty: req.student.faculty?.name || '',
          major: req.student.major?.name || '',
        },
      })),
    };
  }

  async createGroup(userId: string | undefined, dto: CreateGroupDto) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Таңдалған пән табылмады');
    }

    const group = await this.prisma.group.create({
      data: {
        name: dto.name.trim(),
        subjectId: dto.subjectId,
        teacherId: teacher.id,
        course: dto.course,
        capacity: dto.capacity ?? 30,
        semester: dto.semester,
        academicYear: dto.academicYear.trim(),
        lessonDay: dto.lessonDay?.trim() || null,
        lessonTime: dto.lessonTime?.trim() || null,
        classroom: dto.classroom?.trim() || null,
        status: dto.status || 'ACTIVE',
        createdById: teacher.userId,
      },
      include: {
        subject: true,
      },
    });

    return {
      message: 'Топ сәтті құрылды',
      group: {
        id: group.id,
        name: group.name,
        subject: {
          id: group.subject.id,
          name: group.subject.name,
          code: group.subject.code,
        },
        course: group.course,
        capacity: group.capacity,
        activeStudentsCount: 0,
        availablePlaces: group.capacity,
        semester: group.semester,
        academicYear: group.academicYear,
        lessonDay: group.lessonDay,
        lessonTime: group.lessonTime,
        classroom: group.classroom,
        status: group.status,
      },
    };
  }

  async updateGroup(userId: string | undefined, groupId: string, dto: UpdateGroupDto) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Топ табылмады');
    }

    if (group.teacherId !== teacher.id) {
      throw new ForbiddenException('Бұл топты өңдеуге рұқсатыңыз жоқ');
    }

    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.course !== undefined ? { course: dto.course } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.semester !== undefined ? { semester: dto.semester } : {}),
        ...(dto.academicYear !== undefined ? { academicYear: dto.academicYear.trim() } : {}),
        ...(dto.lessonDay !== undefined ? { lessonDay: dto.lessonDay?.trim() || null } : {}),
        ...(dto.lessonTime !== undefined ? { lessonTime: dto.lessonTime?.trim() || null } : {}),
        ...(dto.classroom !== undefined ? { classroom: dto.classroom?.trim() || null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
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
    });

    return {
      message: 'Топ мәліметтері сәтті жаңартылды',
      group: {
        id: updated.id,
        name: updated.name,
        subject: {
          id: updated.subject.id,
          name: updated.subject.name,
          code: updated.subject.code,
        },
        course: updated.course,
        capacity: updated.capacity,
        activeStudentsCount: updated._count.memberships,
        availablePlaces: Math.max(0, updated.capacity - updated._count.memberships),
        semester: updated.semester,
        academicYear: updated.academicYear,
        lessonDay: updated.lessonDay,
        lessonTime: updated.lessonTime,
        classroom: updated.classroom,
        status: updated.status,
      },
    };
  }

  async deleteGroup(userId: string | undefined, groupId: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            memberships: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Топ табылмады');
    }

    if (group.teacherId !== teacher.id) {
      throw new ForbiddenException('Бұл топты өшіруге рұқсатыңыз жоқ');
    }

    if (group._count.memberships > 0) {
      throw new BadRequestException(
        'Топта белсенді студенттер бар. Алдымен студенттерді топтан шығарыңыз немесе топ статусын ARCHIVED етіңіз.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete join requests for this group
      await tx.joinRequest.deleteMany({
        where: { groupId },
      });
      // Delete inactive memberships if any
      await tx.groupMembership.deleteMany({
        where: { groupId },
      });
      // Delete group
      await tx.group.delete({
        where: { id: groupId },
      });
    });

    return {
      message: 'Топ сәтті өшірілді',
    };
  }

  async removeStudentFromGroup(
    userId: string | undefined,
    groupId: string,
    studentProfileId: string,
  ) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Топ табылмады');
    }

    if (group.teacherId !== teacher.id) {
      throw new ForbiddenException('Бұл топты басқаруға рұқсатыңыз жоқ');
    }

    const membership = await this.prisma.groupMembership.findUnique({
      where: {
        studentId_groupId: {
          studentId: studentProfileId,
          groupId,
        },
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Студент бұл топтың құрамында табылмады');
    }

    await this.prisma.groupMembership.delete({
      where: { id: membership.id },
    });

    return {
      message: `${membership.student.user.fullName} топтан шығарылды`,
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

  // ==========================================
  // COURSE CONTENT MANAGEMENT (TOPICS & MATERIALS)
  // ==========================================

  async verifyTeacherSubjectAccess(teacherProfileId: string, subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Пән табылмады');
    }

    const hasAccess = await this.prisma.group.findFirst({
      where: {
        teacherId: teacherProfileId,
        subjectId,
      },
    });

    if (!hasAccess) {
      throw new ForbiddenException('Бұл пәнді басқаруға рұқсатыңыз жоқ');
    }

    return subject;
  }

  async verifyTeacherTopicAccess(teacherProfileId: string, topicId: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        subject: true,
      },
    });

    if (!topic) {
      throw new NotFoundException('Тақырып табылмады');
    }

    await this.verifyTeacherSubjectAccess(teacherProfileId, topic.subjectId);
    return topic;
  }

  async verifyTeacherMaterialAccess(teacherProfileId: string, materialId: string) {
    const material = await this.prisma.material.findUnique({
      where: { id: materialId },
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundException('Оқу материалы табылмады');
    }

    await this.verifyTeacherSubjectAccess(teacherProfileId, material.topic.subjectId);
    return material;
  }

  async getSubjects(userId?: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const groups = await this.prisma.group.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: {
          include: {
            _count: {
              select: {
                topics: true,
                groups: {
                  where: { teacherId: teacher.id },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const subjectsMap = new Map<string, any>();
    groups.forEach((g) => {
      if (!subjectsMap.has(g.subject.id)) {
        subjectsMap.set(g.subject.id, {
          id: g.subject.id,
          name: g.subject.name,
          code: g.subject.code,
          description: g.subject.description,
          topicsCount: g.subject._count.topics,
          groupsCount: g.subject._count.groups,
          materialsCount: 0,
          groups: [],
        });
      }
      subjectsMap.get(g.subject.id).groups.push({
        id: g.id,
        name: g.name,
        course: g.course,
        semester: g.semester,
        academicYear: g.academicYear,
      });
    });

    const subjectsList = Array.from(subjectsMap.values());
    await Promise.all(
      subjectsList.map(async (subj) => {
        subj.materialsCount = await this.prisma.material.count({
          where: {
            topic: {
              subjectId: subj.id,
            },
          },
        });
      }),
    );

    return {
      message: 'Оқытушының рұқсат етілген пәндері',
      subjects: subjectsList,
    };
  }

  async getSubjectTopics(userId: string | undefined, subjectId: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);
    const subject = await this.verifyTeacherSubjectAccess(teacher.id, subjectId);

    const topics = await this.prisma.topic.findMany({
      where: { subjectId },
      include: {
        _count: {
          select: {
            materials: true,
            assignments: true,
            tests: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return {
      message: 'Пән тақырыптары',
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
      },
      topics: topics.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        order: t.order,
        materialsCount: t._count.materials,
        assignmentsCount: t._count.assignments,
        testsCount: t._count.tests,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    };
  }

  async createTopic(userId: string | undefined, subjectId: string, dto: CreateTopicDto) {
    const teacher = await this.getTeacherProfileByUserId(userId);
    await this.verifyTeacherSubjectAccess(teacher.id, subjectId);

    let order = dto.order;
    if (!order) {
      const maxOrder = await this.prisma.topic.aggregate({
        where: { subjectId },
        _max: { order: true },
      });
      order = (maxOrder._max.order ?? 0) + 1;
    }

    const topic = await this.prisma.topic.create({
      data: {
        subjectId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        order,
      },
    });

    return {
      message: 'Тақырып сәтті жасалды',
      topic: {
        id: topic.id,
        subjectId: topic.subjectId,
        title: topic.title,
        description: topic.description,
        order: topic.order,
        createdAt: topic.createdAt,
      },
    };
  }

  async updateTopic(userId: string | undefined, topicId: string, dto: UpdateTopicDto) {
    const teacher = await this.getTeacherProfileByUserId(userId);
    await this.verifyTeacherTopicAccess(teacher.id, topicId);

    const updated = await this.prisma.topic.update({
      where: { id: topicId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });

    return {
      message: 'Тақырып жаңартылды',
      topic: {
        id: updated.id,
        subjectId: updated.subjectId,
        title: updated.title,
        description: updated.description,
        order: updated.order,
        updatedAt: updated.updatedAt,
      },
    };
  }

  async deleteTopic(userId: string | undefined, topicId: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);
    await this.verifyTeacherTopicAccess(teacher.id, topicId);

    // Safeguard: Check if student assignment submissions exist
    const submissionCount = await this.prisma.assignmentSubmission.count({
      where: {
        assignment: { topicId },
      },
    });

    if (submissionCount > 0) {
      throw new BadRequestException(
        'Бұл тақырыпта студенттердің тапсырма жауаптары бар. Студенттердің бағалары мен жұмыстарын жоғалтпау үшін тақырыпты өшіру мүмкін емес.',
      );
    }

    // Unlink tests from this topic so tests remain under subject
    await this.prisma.test.updateMany({
      where: { topicId },
      data: { topicId: null },
    });

    await this.prisma.$transaction(async (tx) => {
      // 1. Delete student material progress
      await tx.studentMaterialProgress.deleteMany({
        where: { material: { topicId } },
      });

      // 2. Delete materials
      await tx.material.deleteMany({
        where: { topicId },
      });

      // 3. Delete assignments (no submissions exist as verified above)
      await tx.assignment.deleteMany({
        where: { topicId },
      });

      // 4. Delete topic
      await tx.topic.delete({
        where: { id: topicId },
      });
    });

    return {
      message: 'Тақырып және оған қатысты барлық материалдар сәтті өшірілді',
    };
  }

  async reorderTopics(userId: string | undefined, subjectId: string, topicIds: string[]) {
    const teacher = await this.getTeacherProfileByUserId(userId);
    await this.verifyTeacherSubjectAccess(teacher.id, subjectId);

    const existingTopics = await this.prisma.topic.findMany({
      where: { subjectId },
      select: { id: true },
    });

    const existingIdSet = new Set(existingTopics.map((t) => t.id));
    for (const id of topicIds) {
      if (!existingIdSet.has(id)) {
        throw new BadRequestException(`Тақырып ID=${id} бұл пәнге тиесілі емес`);
      }
    }

    await this.prisma.$transaction(
      topicIds.map((id, index) =>
        this.prisma.topic.update({
          where: { id },
          data: { order: index + 1 },
        }),
      ),
    );

    return {
      message: 'Тақырыптар реті сақталды',
    };
  }

  async getTopicMaterials(userId: string | undefined, topicId: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);
    const topic = await this.verifyTeacherTopicAccess(teacher.id, topicId);

    const materials = await this.prisma.material.findMany({
      where: { topicId },
      orderBy: { order: 'asc' },
    });

    return {
      message: 'Тақырып материалдары',
      topic: {
        id: topic.id,
        title: topic.title,
        subjectId: topic.subjectId,
        subjectName: topic.subject.name,
      },
      materials: materials.map((m) => ({
        id: m.id,
        topicId: m.topicId,
        title: m.title,
        description: m.description,
        type: m.type,
        contentUrl: m.contentUrl,
        contentText: m.contentText,
        order: m.order,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      })),
    };
  }

  async createMaterial(userId: string | undefined, topicId: string, dto: CreateMaterialDto) {
    const teacher = await this.getTeacherProfileByUserId(userId);
    await this.verifyTeacherTopicAccess(teacher.id, topicId);

    let order = dto.order;
    if (!order) {
      const maxOrder = await this.prisma.material.aggregate({
        where: { topicId },
        _max: { order: true },
      });
      order = (maxOrder._max.order ?? 0) + 1;
    }

    const material = await this.prisma.material.create({
      data: {
        topicId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        type: dto.type,
        contentText: dto.contentText?.trim() || null,
        contentUrl: dto.contentUrl?.trim() || null,
        order,
      },
    });

    return {
      message: 'Оқу материалы сәтті қосылды',
      material: {
        id: material.id,
        topicId: material.topicId,
        title: material.title,
        description: material.description,
        type: material.type,
        contentUrl: material.contentUrl,
        contentText: material.contentText,
        order: material.order,
        createdAt: material.createdAt,
      },
    };
  }

  async updateMaterial(userId: string | undefined, materialId: string, dto: UpdateMaterialDto) {
    const teacher = await this.getTeacherProfileByUserId(userId);
    await this.verifyTeacherMaterialAccess(teacher.id, materialId);

    const updated = await this.prisma.material.update({
      where: { id: materialId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.contentText !== undefined ? { contentText: dto.contentText?.trim() || null } : {}),
        ...(dto.contentUrl !== undefined ? { contentUrl: dto.contentUrl?.trim() || null } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });

    return {
      message: 'Оқу материалы жаңартылды',
      material: {
        id: updated.id,
        topicId: updated.topicId,
        title: updated.title,
        description: updated.description,
        type: updated.type,
        contentUrl: updated.contentUrl,
        contentText: updated.contentText,
        order: updated.order,
        updatedAt: updated.updatedAt,
      },
    };
  }

  async deleteMaterial(userId: string | undefined, materialId: string) {
    const teacher = await this.getTeacherProfileByUserId(userId);
    await this.verifyTeacherMaterialAccess(teacher.id, materialId);

    await this.prisma.$transaction(async (tx) => {
      await tx.studentMaterialProgress.deleteMany({
        where: { materialId },
      });
      await tx.material.delete({
        where: { id: materialId },
      });
    });

    return {
      message: 'Оқу материалы сәтті өшірілді',
    };
  }

  async reorderMaterials(userId: string | undefined, topicId: string, materialIds: string[]) {
    const teacher = await this.getTeacherProfileByUserId(userId);
    await this.verifyTeacherTopicAccess(teacher.id, topicId);

    const existingMaterials = await this.prisma.material.findMany({
      where: { topicId },
      select: { id: true },
    });

    const existingIdSet = new Set(existingMaterials.map((m) => m.id));
    for (const id of materialIds) {
      if (!existingIdSet.has(id)) {
        throw new BadRequestException(`Материал ID=${id} бұл тақырыпқа тиесілі емес`);
      }
    }

    await this.prisma.$transaction(
      materialIds.map((id, index) =>
        this.prisma.material.update({
          where: { id },
          data: { order: index + 1 },
        }),
      ),
    );

    return {
      message: 'Материалдар реті сақталды',
    };
  }

  // ==========================================
  // ELECTRONIC JOURNAL & GRADEBOOK (TEACHER)
  // ==========================================

  async getGroupJournal(userId?: string, groupId?: string) {
    if (!groupId) {
      throw new BadRequestException('Топ көрсетілмеді');
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
        'Бұл топтың журналын көруге рұқсатыңыз жоқ',
      );
    }

    // 1. Get active students in this group
    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        groupId: group.id,
        status: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        student: {
          user: {
            fullName: 'asc',
          },
        },
      },
    });

    const studentProfileIds = memberships.map((m) => m.student.id);

    // 2. Get assignments belonging to this subject
    const assignments = await this.prisma.assignment.findMany({
      where: {
        topic: {
          subjectId: group.subjectId,
        },
      },
      include: {
        topic: true,
      },
      orderBy: [
        { topic: { order: 'asc' } },
        { createdAt: 'asc' },
      ],
    });

    const assignmentIds = assignments.map((a) => a.id);

    // 3. Get tests belonging to this subject
    const tests = await this.prisma.test.findMany({
      where: {
        subjectId: group.subjectId,
        OR: [
          { createdByTeacherProfileId: teacher.id },
          { status: 'PUBLISHED' },
        ],
      },
      include: {
        topic: true,
      },
      orderBy: [
        { createdAt: 'asc' },
      ],
    });

    const testIds = tests.map((t) => t.id);

    // 4. Fetch submissions, test attempts and term grades for active students
    const [submissions, testAttempts, existingGrades] = await Promise.all([
      assignmentIds.length > 0 && studentProfileIds.length > 0
        ? this.prisma.assignmentSubmission.findMany({
            where: {
              assignmentId: { in: assignmentIds },
              studentId: { in: studentProfileIds },
            },
          })
        : Promise.resolve([]),
      testIds.length > 0 && studentProfileIds.length > 0
        ? this.prisma.testAttempt.findMany({
            where: {
              testId: { in: testIds },
              studentProfileId: { in: studentProfileIds },
            },
            orderBy: {
              startedAt: 'desc',
            },
          })
        : Promise.resolve([]),
      this.prisma.termGrade.findMany({
        where: {
          groupId: group.id,
        },
      }),
    ]);

    // Map submissions by `assignmentId_studentId`
    const submissionMap = new Map<string, (typeof submissions)[0]>();
    submissions.forEach((sub) => {
      submissionMap.set(`${sub.assignmentId}_${sub.studentId}`, sub);
    });

    // Map latest test attempts by `testId_studentProfileId`
    const attemptMap = new Map<string, (typeof testAttempts)[0]>();
    testAttempts.forEach((att) => {
      const key = `${att.testId}_${att.studentProfileId}`;
      if (!attemptMap.has(key)) {
        attemptMap.set(key, att);
      }
    });

    const now = new Date();

    // 5. Build matrix for each student
    const studentsData = memberships.map((membership) => {
      const student = membership.student;

      const studentAssignments = assignments.map((assignment) => {
        const sub = submissionMap.get(`${assignment.id}_${student.id}`);
        const score = sub?.score ?? null;
        const percentage =
          score !== null && assignment.maxScore > 0
            ? Math.round((score / assignment.maxScore) * 1000) / 10
            : null;

        return {
          assignmentId: assignment.id,
          submissionId: sub?.id ?? null,
          title: assignment.title,
          maxScore: assignment.maxScore,
          status: sub ? sub.status : 'NOT_SUBMITTED',
          score,
          percentage,
          submittedAt: sub?.submittedAt ?? null,
          gradedAt: sub?.gradedAt ?? null,
          teacherComment: sub?.teacherComment ?? null,
        };
      });

      const studentTests = tests.map((test) => {
        const att = attemptMap.get(`${test.id}_${student.id}`);
        let currentStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' = 'NOT_STARTED';

        if (att) {
          if (att.status === 'IN_PROGRESS' && now > att.expiresAt) {
            currentStatus = 'EXPIRED';
          } else {
            currentStatus = att.status as any;
          }
        }

        const score = att?.score ?? null;
        let percentage: number | null = null;
        if (att?.percentage != null) {
          percentage = Math.round(att.percentage * 10) / 10;
        } else if (score != null && test.maxScore > 0) {
          percentage = Math.round((score / test.maxScore) * 1000) / 10;
        }

        return {
          testId: test.id,
          attemptId: att?.id ?? null,
          title: test.title,
          maxScore: test.maxScore,
          status: currentStatus,
          score,
          percentage,
          submittedAt: att?.submittedAt ?? null,
        };
      });

      // Calculate student metrics (ONLY considering graded assignments & completed tests)
      const gradedAssignments = studentAssignments.filter(
        (a) => a.status === 'GRADED' && a.score !== null,
      );
      const assignmentsAverage =
        gradedAssignments.length > 0
          ? Math.round(
              (gradedAssignments.reduce(
                (sum, a) => sum + (a.percentage ?? 0),
                0,
              ) /
                gradedAssignments.length) *
                10,
            ) / 10
          : null;

      const completedTests = studentTests.filter(
        (t) =>
          (t.status === 'COMPLETED' || t.status === 'EXPIRED') &&
          t.percentage !== null,
      );
      const testsAverage =
        completedTests.length > 0
          ? Math.round(
              (completedTests.reduce(
                (sum, t) => sum + (t.percentage ?? 0),
                0,
              ) /
                completedTests.length) *
                10,
            ) / 10
          : null;

      const allGradedScores = [
        ...gradedAssignments.map((a) => a.percentage ?? 0),
        ...completedTests.map((t) => t.percentage ?? 0),
      ];

      const totalAverage =
        allGradedScores.length > 0
          ? Math.round(
              (allGradedScores.reduce((sum, val) => sum + val, 0) /
                allGradedScores.length) *
                10,
            ) / 10
          : null;

      const completedAssignmentsCount = studentAssignments.filter(
        (a) => a.status === 'GRADED' || a.status === 'SUBMITTED' || a.status === 'LATE',
      ).length;

      const completedTestsCount = studentTests.filter(
        (t) => t.status === 'COMPLETED' || t.status === 'EXPIRED',
      ).length;

      const tg = existingGrades.find((g) => g.studentId === student.id);
      const rk1 = tg?.rk1 ?? null;
      const rk2 = tg?.rk2 ?? null;
      const session = tg?.session ?? null;
      const admissionRating = calculateAdmissionRating(rk1, rk2);
      const finalScore = calculateFinalScore(rk1, rk2, session);
      const gradeLetter = getGradeLetter(finalScore, session);
      const gradeStatus = getGradeStatus(rk1, rk2, session);

      return {
        id: student.id,
        fullName: student.user.fullName,
        email: student.user.email,
        phone: student.user.phone,
        avatarUrl: student.avatarUrl,
        assignments: studentAssignments,
        tests: studentTests,
        termGrades: {
          rk1,
          rk2,
          admissionRating,
          session,
          finalScore,
          gradeLetter,
          status: gradeStatus,
          note: tg?.note || null,
        },
        metrics: {
          assignmentsAverage,
          testsAverage,
          totalAverage,
          completedAssignmentsCount,
          totalAssignmentsCount: assignments.length,
          completedTestsCount,
          totalTestsCount: tests.length,
        },
      };
    });

    // 6. Group summary statistics
    const studentsWithAverage = studentsData.filter(
      (s) => s.metrics.totalAverage !== null,
    );
    const groupAverageScore =
      studentsWithAverage.length > 0
        ? Math.round(
            (studentsWithAverage.reduce(
              (sum, s) => sum + (s.metrics.totalAverage ?? 0),
              0,
            ) /
              studentsWithAverage.length) *
              10,
          ) / 10
        : null;

    const totalPossibleWork =
      memberships.length * (assignments.length + tests.length);
    const totalSubmittedWork = studentsData.reduce(
      (sum, s) =>
        sum +
        s.metrics.completedAssignmentsCount +
        s.metrics.completedTestsCount,
      0,
    );

    const submissionRate =
      totalPossibleWork > 0
        ? Math.round((totalSubmittedWork / totalPossibleWork) * 100)
        : 0;

    return {
      message: 'Топтың электронды журналы',
      group: {
        id: group.id,
        name: group.name,
        subject: {
          id: group.subject.id,
          name: group.subject.name,
          code: group.subject.code,
        },
        course: group.course,
        semester: group.semester,
        academicYear: group.academicYear,
      },
      summary: {
        totalStudents: memberships.length,
        assignmentsCount: assignments.length,
        testsCount: tests.length,
        averageScore: groupAverageScore,
        submissionRate,
      },
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        topicId: a.topicId,
        topicTitle: a.topic.title,
        maxScore: a.maxScore,
        deadline: a.deadline,
        responseType: a.responseType,
      })),
      tests: tests.map((t) => ({
        id: t.id,
        title: t.title,
        topicId: t.topicId,
        topicTitle: t.topic?.title ?? null,
        maxScore: t.maxScore,
        durationMinutes: t.durationMinutes,
        status: t.status,
      })),
      students: studentsData,
    };
  }

  // ==========================================
  // ATTENDANCE MANAGEMENT (PHASE 10)
  // ==========================================

  async getGroupAttendance(
    userId: string | undefined,
    groupId: string,
    dateStr?: string,
  ) {
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
      throw new ForbiddenException('Бұл топтың қатысу мәліметтерін көруге рұқсатыңыз жоқ');
    }

    // Default to today if dateStr is invalid or missing
    const validDateStr =
      dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
        ? dateStr
        : new Date().toISOString().split('T')[0];

    const parsedDate = new Date(`${validDateStr}T00:00:00.000Z`);

    // Fetch active students in the group
    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        groupId: group.id,
        status: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          user: {
            fullName: 'asc',
          },
        },
      },
    });

    // Fetch attendance records for this date
    const existingRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        groupId: group.id,
        date: parsedDate,
      },
    });

    const recordMap = new Map(existingRecords.map((r) => [r.studentId, r]));

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let unmarkedCount = 0;

    const students = memberships.map((m) => {
      const rec = recordMap.get(m.studentId);
      if (rec) {
        if (rec.status === 'PRESENT') presentCount++;
        else if (rec.status === 'ABSENT') absentCount++;
        else if (rec.status === 'LATE') lateCount++;
        else if (rec.status === 'EXCUSED') excusedCount++;
      } else {
        unmarkedCount++;
      }

      return {
        id: m.student.id,
        userId: m.student.user.id,
        fullName: m.student.user.fullName,
        email: m.student.user.email,
        avatarUrl: m.student.avatarUrl,
        status: rec ? rec.status : null,
        note: rec?.note || null,
        markedAt: rec?.updatedAt ? rec.updatedAt.toISOString() : null,
      };
    });

    // Group overall attendance rate calculation
    const allGroupRecords = await this.prisma.attendanceRecord.findMany({
      where: { groupId: group.id },
      select: { status: true, date: true },
    });

    const uniqueDatesCount = new Set(
      allGroupRecords.map((r) => r.date.toISOString().split('T')[0]),
    ).size;

    const totalMarkedRecords = allGroupRecords.length;
    const totalPresentOrLate = allGroupRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE',
    ).length;
    const overallRate =
      totalMarkedRecords > 0
        ? Math.round((totalPresentOrLate / totalMarkedRecords) * 100)
        : 0;

    return {
      message: 'Топ бойынша қатысу мәліметтері',
      group: {
        id: group.id,
        name: group.name,
        course: group.course,
        semester: group.semester,
        academicYear: group.academicYear,
        lessonDay: group.lessonDay,
        lessonTime: group.lessonTime,
        classroom: group.classroom,
        subject: {
          id: group.subject.id,
          name: group.subject.name,
          code: group.subject.code,
        },
      },
      date: validDateStr,
      isSaved: existingRecords.length > 0,
      stats: {
        totalStudents: memberships.length,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        unmarkedCount,
        uniqueDatesCount,
        overallRate,
      },
      students,
    };
  }

  async saveGroupAttendance(
    userId: string | undefined,
    groupId: string,
    dto: SaveAttendanceDto,
  ) {
    const teacher = await this.getTeacherProfileByUserId(userId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Топ табылмады');
    }

    if (group.teacherId !== teacher.id) {
      throw new ForbiddenException('Бұл топқа қатысу белгілеуге рұқсатыңыз жоқ');
    }

    const parsedDate = new Date(`${dto.date}T00:00:00.000Z`);

    // Verify student IDs belong to active group memberships
    const activeMemberships = await this.prisma.groupMembership.findMany({
      where: {
        groupId: group.id,
        status: 'ACTIVE',
      },
      select: { studentId: true },
    });

    const activeStudentIds = new Set(activeMemberships.map((m) => m.studentId));

    const validRecords = dto.records.filter((r) => activeStudentIds.has(r.studentId));

    if (validRecords.length === 0) {
      return {
        message: 'Сақталатын қатысу жазбалары табылмады',
        date: dto.date,
        savedCount: 0,
      };
    }

    // Upsert each record cleanly
    const operations = validRecords.map((r) =>
      this.prisma.attendanceRecord.upsert({
        where: {
          studentId_groupId_date: {
            studentId: r.studentId,
            groupId: group.id,
            date: parsedDate,
          },
        },
        create: {
          studentId: r.studentId,
          groupId: group.id,
          date: parsedDate,
          status: r.status,
          markedByTeacherId: teacher.id,
          note: r.note ? r.note.trim() : null,
        },
        update: {
          status: r.status,
          markedByTeacherId: teacher.id,
          note: r.note ? r.note.trim() : null,
        },
      }),
    );

    await this.prisma.$transaction(operations);

    return {
      message: 'Сабаққа қатысу жазбалары сәтті сақталды',
      date: dto.date,
      savedCount: validRecords.length,
    };
  }

  // =========================================================================
  // ACADEMIC TERM GRADES (RK-1, RK-2, SESSION)
  // =========================================================================

  async getGroupGrades(userId: string | undefined, groupId: string) {
    if (!groupId) {
      throw new BadRequestException('Топ көрсетілмеді');
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
      throw new ForbiddenException('Бұл топтың бағаларын көруге рұқсатыңыз жоқ');
    }

    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        groupId: group.id,
        status: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          user: {
            fullName: 'asc',
          },
        },
      },
    });

    const termGrades = await this.prisma.termGrade.findMany({
      where: {
        groupId: group.id,
      },
    });

    const gradeMap = new Map(termGrades.map((g) => [g.studentId, g]));

    let rk1Count = 0;
    let rk2Count = 0;
    let sessionCount = 0;
    let completeCount = 0;

    let rk1Sum = 0;
    let rk2Sum = 0;
    let sessionSum = 0;
    let finalSum = 0;
    let finalCount = 0;

    const students = memberships.map((m) => {
      const g = gradeMap.get(m.studentId);
      const rk1 = g?.rk1 ?? null;
      const rk2 = g?.rk2 ?? null;
      const session = g?.session ?? null;

      if (rk1 !== null) {
        rk1Count++;
        rk1Sum += rk1;
      }
      if (rk2 !== null) {
        rk2Count++;
        rk2Sum += rk2;
      }
      if (session !== null) {
        sessionCount++;
        sessionSum += session;
      }

      const admissionRating = calculateAdmissionRating(rk1, rk2);
      const finalScore = calculateFinalScore(rk1, rk2, session);
      const gradeLetter = getGradeLetter(finalScore, session);
      const status = getGradeStatus(rk1, rk2, session);

      if (status === 'COMPLETE') {
        completeCount++;
      }
      if (finalScore !== null) {
        finalCount++;
        finalSum += finalScore;
      }

      return {
        id: m.student.id,
        userId: m.student.user.id,
        fullName: m.student.user.fullName,
        email: m.student.user.email,
        avatarUrl: m.student.avatarUrl,
        rk1,
        rk2,
        session,
        admissionRating,
        finalScore,
        gradeLetter,
        status,
        note: g?.note ?? null,
        updatedAt: g?.updatedAt ? g.updatedAt.toISOString() : null,
      };
    });

    const totalStudents = memberships.length;
    const rk1Average = rk1Count > 0 ? Math.round((rk1Sum / rk1Count) * 10) / 10 : null;
    const rk2Average = rk2Count > 0 ? Math.round((rk2Sum / rk2Count) * 10) / 10 : null;
    const sessionAverage = sessionCount > 0 ? Math.round((sessionSum / sessionCount) * 10) / 10 : null;
    const finalAverage = finalCount > 0 ? Math.round((finalSum / finalCount) * 10) / 10 : null;

    return {
      message: 'Топтың академиялық бағалары',
      group: {
        id: group.id,
        name: group.name,
        course: group.course,
        semester: group.semester,
        academicYear: group.academicYear,
        lessonDay: group.lessonDay,
        lessonTime: group.lessonTime,
        classroom: group.classroom,
        subject: {
          id: group.subject.id,
          name: group.subject.name,
          code: group.subject.code,
        },
      },
      stats: {
        totalStudents,
        rk1Count,
        rk2Count,
        sessionCount,
        completeCount,
        rk1Average,
        rk2Average,
        sessionAverage,
        finalAverage,
      },
      students,
    };
  }

  async saveGroupGrades(
    userId: string | undefined,
    groupId: string,
    dto: SaveTermGradesDto,
  ) {
    if (!groupId) {
      throw new BadRequestException('Топ көрсетілмеді');
    }

    const teacher = await this.getTeacherProfileByUserId(userId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Топ табылмады');
    }

    if (group.teacherId !== teacher.id) {
      throw new ForbiddenException('Бұл топтың бағаларын қоюға/өзгертуге рұқсатыңыз жоқ');
    }

    // Verify active students in group
    const activeMemberships = await this.prisma.groupMembership.findMany({
      where: {
        groupId: group.id,
        status: 'ACTIVE',
      },
      select: { studentId: true },
    });

    const activeStudentIds = new Set(activeMemberships.map((m) => m.studentId));
    const validGrades = dto.grades.filter((g) => activeStudentIds.has(g.studentId));

    if (validGrades.length === 0) {
      return {
        message: 'Сақталатын бағалар табылмады',
        savedCount: 0,
      };
    }

    const period = dto.period || AssessmentPeriod.ALL;

    const operations = validGrades.map((g) => {
      const updateData: any = {
        markedByTeacherId: teacher.id,
      };
      if (g.note !== undefined) {
        updateData.note = g.note ? g.note.trim() : null;
      }

      if (period === AssessmentPeriod.RK1) {
        updateData.rk1 = g.rk1 ?? null;
      } else if (period === AssessmentPeriod.RK2) {
        updateData.rk2 = g.rk2 ?? null;
      } else if (period === AssessmentPeriod.SESSION) {
        updateData.session = g.session ?? null;
      } else {
        if (g.rk1 !== undefined) updateData.rk1 = g.rk1;
        if (g.rk2 !== undefined) updateData.rk2 = g.rk2;
        if (g.session !== undefined) updateData.session = g.session;
      }

      const createData: any = {
        studentId: g.studentId,
        groupId: group.id,
        subjectId: group.subjectId,
        markedByTeacherId: teacher.id,
        note: g.note ? g.note.trim() : null,
        rk1: period === AssessmentPeriod.RK1 || period === AssessmentPeriod.ALL ? (g.rk1 ?? null) : null,
        rk2: period === AssessmentPeriod.RK2 || period === AssessmentPeriod.ALL ? (g.rk2 ?? null) : null,
        session: period === AssessmentPeriod.SESSION || period === AssessmentPeriod.ALL ? (g.session ?? null) : null,
      };

      return this.prisma.termGrade.upsert({
        where: {
          studentId_groupId: {
            studentId: g.studentId,
            groupId: group.id,
          },
        },
        create: createData,
        update: updateData,
      });
    });

    await this.prisma.$transaction(operations);

    return {
      message: 'Академиялық бағалар сәтті сақталды',
      savedCount: validGrades.length,
    };
  }
}