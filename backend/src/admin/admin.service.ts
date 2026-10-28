import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus } from '../generated/prisma/enums';
import {
  calculateAdmissionRating,
  calculateFinalScore,
  getGradeStatus,
} from '../common/grading.util';
import {
  CreateSubjectDto,
  UpdateAdminGroupDto,
  UpdateSubjectDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // 1. DASHBOARD OVERVIEW & STATS
  // =========================================================================
  async getDashboardStats() {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalSubjects,
      totalGroups,
      activeGroupsCount,
      activeMembershipsCount,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.STUDENT } }),
      this.prisma.user.count({ where: { role: UserRole.TEACHER } }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
      this.prisma.subject.count(),
      this.prisma.group.count(),
      this.prisma.group.count({ where: { status: 'ACTIVE' } }),
      this.prisma.groupMembership.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      message: 'Әкімшілік панель статистикасы',
      stats: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        totalSubjects,
        totalGroups,
        activeGroupsCount,
        activeMembershipsCount,
      },
      recentUsers,
    };
  }

  // =========================================================================
  // 2. USERS MANAGEMENT
  // =========================================================================
  async getUsers(params: {
    search?: string;
    role?: UserRole;
    status?: UserStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (params.role) {
      where.role = params.role;
    }

    if (params.status) {
      where.status = params.status;
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          studentProfile: {
            select: {
              id: true,
              course: true,
              university: { select: { id: true, name: true, shortName: true } },
              faculty: { select: { id: true, name: true } },
              major: { select: { id: true, name: true } },
              _count: {
                select: {
                  memberships: { where: { status: 'ACTIVE' } },
                  assignmentSubmissions: true,
                },
              },
            },
          },
          teacherProfile: {
            select: {
              id: true,
              department: true,
              position: true,
              experience: true,
              university: { select: { id: true, name: true, shortName: true } },
              faculty: { select: { id: true, name: true } },
              _count: {
                select: {
                  groups: { where: { status: 'ACTIVE' } },
                  tests: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      message: 'Пайдаланушылар тізімі',
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
        studentProfile: {
          include: {
            university: true,
            faculty: true,
            major: true,
            memberships: {
              where: { status: 'ACTIVE' },
              include: {
                group: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
        },
        teacherProfile: {
          include: {
            university: true,
            faculty: true,
            groups: {
              where: { status: 'ACTIVE' },
              include: {
                subject: true,
                _count: {
                  select: {
                    memberships: { where: { status: 'ACTIVE' } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пайдаланушы табылмады');
    }

    return {
      message: 'Пайдаланушы мәліметтері',
      user,
    };
  }

  async updateUserRole(adminUserId: string, targetUserId: string, dto: UpdateUserRoleDto) {
    if (adminUserId === targetUserId && dto.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Әкімші өз рөлін ADMIN-нен басқа рөлге ауыстыра алмайды');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Пайдаланушы табылмады');
    }

    // Соңғы әкімшіні рөлінен айыруға тыйым салу
    if (targetUser.role === UserRole.ADMIN && dto.role !== UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Жүйедегі соңғы белсенді әкімшінің рөлін өзгертуге тыйым салынады');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return {
      message: 'Пайдаланушы рөлі сәтті жаңартылды',
      user: updated,
    };
  }

  async updateUserStatus(adminUserId: string, targetUserId: string, dto: UpdateUserStatusDto) {
    if (adminUserId === targetUserId && dto.status === UserStatus.BLOCKED) {
      throw new ForbiddenException('Әкімші өз аккаунтын бұғаттай алмайды');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Пайдаланушы табылмады');
    }

    // Соңғы әкімшіні бұғаттауға тыйым салу
    if (targetUser.role === UserRole.ADMIN && dto.status === UserStatus.BLOCKED) {
      const activeAdminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestException('Жүйедегі жалғыз белсенді әкімшіні бұғаттауға болмайды');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: dto.status },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return {
      message: 'Пайдаланушы статусы жаңартылды',
      user: updated,
    };
  }

  async deleteUser(adminUserId: string, targetUserId: string) {
    if (adminUserId === targetUserId) {
      throw new ForbiddenException('Әкімші өзінің аккаунтын жоя алмайды');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        studentProfile: {
          include: {
            memberships: { where: { status: 'ACTIVE' } },
            assignmentSubmissions: true,
            testAttempts: true,
          },
        },
        teacherProfile: {
          include: {
            groups: true,
            tests: true,
          },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Пайдаланушы табылмады');
    }

    // Соңғы әкімшіні жоюға тыйым салу
    if (targetUser.role === UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Жүйедегі жалғыз әкімшіні жоюға болмайды');
      }
    }

    // Data integrity safeguards: prevent deletion if active academic ties exist
    if (targetUser.studentProfile) {
      const activeGroups = targetUser.studentProfile.memberships.length;
      const submissions = targetUser.studentProfile.assignmentSubmissions.length;
      if (activeGroups > 0 || submissions > 0) {
        throw new BadRequestException(
          `Студентті жою мүмкін емес: оның белсенді топтары (${activeGroups}) немесе тапсырма жауаптары (${submissions}) бар. Оның орнына аккаунтты бұғаттаңыз.`,
        );
      }
    }

    if (targetUser.teacherProfile) {
      const groupsCount = targetUser.teacherProfile.groups.length;
      const testsCount = targetUser.teacherProfile.tests.length;
      if (groupsCount > 0 || testsCount > 0) {
        throw new BadRequestException(
          `Оқытушыны жою мүмкін емес: оның жетекшілік ететін топтары (${groupsCount}) немесе тесттері (${testsCount}) бар. Оның орнына аккаунтты бұғаттаңыз.`,
        );
      }
    }

    await this.prisma.user.delete({
      where: { id: targetUserId },
    });

    return {
      message: 'Пайдаланушы қауіпсіз түрде жүйеден жойылды',
      success: true,
    };
  }

  // =========================================================================
  // 3. SUBJECTS MANAGEMENT
  // =========================================================================
  async getSubjects(search?: string) {
    const where: any = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    const subjects = await this.prisma.subject.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            groups: true,
            topics: true,
            tests: true,
          },
        },
      },
    });

    return {
      message: 'Пәндер тізімі',
      subjects: subjects.map((sub) => ({
        id: sub.id,
        name: sub.name,
        code: sub.code,
        description: sub.description,
        createdAt: sub.createdAt,
        groupsCount: sub._count.groups,
        topicsCount: sub._count.topics,
        testsCount: sub._count.tests,
      })),
    };
  }

  async createSubject(dto: CreateSubjectDto) {
    const trimmedName = dto.name.trim();
    const trimmedCode = dto.code ? dto.code.trim().toUpperCase() : null;

    // Check duplicate code if provided
    if (trimmedCode) {
      const existingByCode = await this.prisma.subject.findFirst({
        where: { code: { equals: trimmedCode, mode: 'insensitive' } },
      });
      if (existingByCode) {
        throw new ConflictException(`«${trimmedCode}» кодымен пән бұрын тіркелген`);
      }
    }

    const created = await this.prisma.subject.create({
      data: {
        name: trimmedName,
        code: trimmedCode,
        description: dto.description ? dto.description.trim() : null,
      },
    });

    return {
      message: 'Жаңа пән сәтті қосылды',
      subject: created,
    };
  }

  async updateSubject(subjectId: string, dto: UpdateSubjectDto) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Пән табылмады');
    }

    const updateData: any = {};
    if (dto.name !== undefined) {
      updateData.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description ? dto.description.trim() : null;
    }
    if (dto.code !== undefined) {
      const trimmedCode = dto.code ? dto.code.trim().toUpperCase() : null;
      if (trimmedCode && trimmedCode !== subject.code) {
        const existingByCode = await this.prisma.subject.findFirst({
          where: {
            id: { not: subjectId },
            code: { equals: trimmedCode, mode: 'insensitive' },
          },
        });
        if (existingByCode) {
          throw new ConflictException(`«${trimmedCode}» кодымен басқа пән тіркелген`);
        }
      }
      updateData.code = trimmedCode;
    }

    const updated = await this.prisma.subject.update({
      where: { id: subjectId },
      data: updateData,
    });

    return {
      message: 'Пән мәліметтері сәтті жаңартылды',
      subject: updated,
    };
  }

  async deleteSubject(subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        _count: {
          select: {
            groups: true,
            topics: true,
            tests: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Пән табылмады');
    }

    const { groups, topics, tests } = subject._count;
    if (groups > 0 || topics > 0 || tests > 0) {
      throw new BadRequestException(
        `Бұл пәнді жою мүмкін емес: оған байланысты топтар (${groups}), оқу тақырыптары (${topics}) немесе тесттер (${tests}) бар. Деректер тұтастығын қорғау үшін жою бұғатталды.`,
      );
    }

    await this.prisma.subject.delete({
      where: { id: subjectId },
    });

    return {
      message: 'Пән сәтті жойылды',
      success: true,
    };
  }

  // =========================================================================
  // 4. GROUPS OVERVIEW & MANAGEMENT
  // =========================================================================
  async getGroups(params: { search?: string; status?: string; course?: number }) {
    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.course) {
      where.course = Number(params.course);
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { subject: { name: { contains: q, mode: 'insensitive' } } },
        { teacher: { user: { fullName: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const groups = await this.prisma.group.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: {
          select: { id: true, name: true, code: true },
        },
        teacher: {
          select: {
            id: true,
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        _count: {
          select: {
            memberships: { where: { status: 'ACTIVE' } },
            joinRequests: { where: { status: 'PENDING' } },
          },
        },
      },
    });

    return {
      message: 'Топтар тізімі',
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        course: g.course,
        capacity: g.capacity,
        semester: g.semester,
        academicYear: g.academicYear,
        lessonDay: g.lessonDay,
        lessonTime: g.lessonTime,
        classroom: g.classroom,
        status: g.status,
        createdAt: g.createdAt,
        activeStudentsCount: g._count.memberships,
        pendingRequestsCount: g._count.joinRequests,
        subject: g.subject,
        teacher: {
          id: g.teacher.id,
          fullName: g.teacher.user.fullName,
          email: g.teacher.user.email,
        },
      })),
    };
  }

  async getGroupDetails(groupId: string) {
    const group: any = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
          },
        },
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              include: {
                user: {
                  select: { id: true, fullName: true, email: true, phone: true },
                },
                faculty: { select: { name: true } },
                major: { select: { name: true } },
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Топ табылмады');
    }

    return {
      message: 'Топ мәліметтері',
      group: {
        id: group.id,
        name: group.name,
        course: group.course,
        capacity: group.capacity,
        semester: group.semester,
        academicYear: group.academicYear,
        lessonDay: group.lessonDay,
        lessonTime: group.lessonTime,
        classroom: group.classroom,
        status: group.status,
        createdAt: group.createdAt,
        subject: group.subject,
        teacher: {
          id: group.teacher?.id,
          fullName: group.teacher?.user?.fullName,
          email: group.teacher?.user?.email,
          phone: group.teacher?.user?.phone,
        },
        students: (group.memberships || []).map((m: any) => ({
          membershipId: m.id,
          studentId: m.student.id,
          userId: m.student.user.id,
          fullName: m.student.user.fullName,
          email: m.student.user.email,
          phone: m.student.user.phone,
          course: m.student.course,
          faculty: m.student.faculty?.name,
          major: m.student.major?.name,
          joinedAt: m.joinedAt,
        })),
      },
    };
  }

  async updateGroup(groupId: string, dto: UpdateAdminGroupDto) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Топ табылмады');
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.course !== undefined) updateData.course = dto.course;
    if (dto.capacity !== undefined) updateData.capacity = dto.capacity;
    if (dto.semester !== undefined) updateData.semester = dto.semester;
    if (dto.academicYear !== undefined) updateData.academicYear = dto.academicYear.trim();
    if (dto.lessonDay !== undefined) updateData.lessonDay = dto.lessonDay ? dto.lessonDay.trim() : null;
    if (dto.lessonTime !== undefined) updateData.lessonTime = dto.lessonTime ? dto.lessonTime.trim() : null;
    if (dto.classroom !== undefined) updateData.classroom = dto.classroom ? dto.classroom.trim() : null;
    if (dto.status !== undefined) updateData.status = dto.status.trim();

    const updated = await this.prisma.group.update({
      where: { id: groupId },
      data: updateData,
    });

    return {
      message: 'Топ ақпараты сәтті жаңартылды',
      group: updated,
    };
  }

  // =========================================================================
  // 5. ACADEMIC MONITORING & PERFORMANCE
  // =========================================================================

  private getGradeLetter(percentage: number | null): string {
    if (percentage === null) return '—';
    if (percentage >= 95) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 85) return 'B+';
    if (percentage >= 80) return 'B';
    if (percentage >= 75) return 'B-';
    if (percentage >= 70) return 'C+';
    if (percentage >= 65) return 'C';
    if (percentage >= 60) return 'C-';
    if (percentage >= 50) return 'D';
    return 'F';
  }

  async getAcademicOverview() {
    const [
      totalStudents,
      activeGroupsCount,
      totalSubjects,
      totalAssignments,
      totalSubmissions,
      totalTests,
      gradedSubmissions,
      completedAttempts,
      activeMemberships,
      groups,
      subjects,
    ] = await Promise.all([
      this.prisma.studentProfile.count(),
      this.prisma.group.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subject.count(),
      this.prisma.assignment.count(),
      this.prisma.assignmentSubmission.count(),
      this.prisma.test.count(),
      this.prisma.assignmentSubmission.findMany({
        where: {
          status: 'GRADED',
          score: { not: null },
        },
        select: {
          score: true,
          assignment: {
            select: { maxScore: true },
          },
        },
      }),
      this.prisma.testAttempt.findMany({
        where: {
          status: { in: ['COMPLETED', 'EXPIRED'] },
          OR: [{ percentage: { not: null } }, { score: { not: null } }],
        },
        select: {
          score: true,
          percentage: true,
          test: {
            select: { maxScore: true },
          },
        },
      }),
      this.prisma.groupMembership.findMany({
        where: { status: 'ACTIVE' },
        select: {
          groupId: true,
          group: {
            select: {
              subjectId: true,
            },
          },
        },
      }),
      this.prisma.group.findMany({
        where: { status: 'ACTIVE' },
        include: {
          subject: true,
          teacher: {
            include: {
              user: {
                select: { fullName: true },
              },
            },
          },
          _count: {
            select: {
              memberships: { where: { status: 'ACTIVE' } },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.subject.findMany({
        include: {
          _count: {
            select: {
              groups: { where: { status: 'ACTIVE' } },
              topics: true,
              tests: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    // 1. Calculate Assignment Average %
    let averageAssignmentScore: number | null = null;
    const assignmentPercentages: number[] = [];
    gradedSubmissions.forEach((sub) => {
      if (sub.assignment.maxScore > 0 && sub.score !== null) {
        assignmentPercentages.push((sub.score / sub.assignment.maxScore) * 100);
      }
    });
    if (assignmentPercentages.length > 0) {
      const sum = assignmentPercentages.reduce((a, b) => a + b, 0);
      averageAssignmentScore =
        Math.round((sum / assignmentPercentages.length) * 10) / 10;
    }

    // 2. Calculate Test Average %
    let averageTestScore: number | null = null;
    const testPercentages: number[] = [];
    completedAttempts.forEach((att) => {
      if (att.percentage !== null) {
        testPercentages.push(att.percentage);
      } else if (att.score !== null && att.test.maxScore > 0) {
        testPercentages.push((att.score / att.test.maxScore) * 100);
      }
    });
    if (testPercentages.length > 0) {
      const sum = testPercentages.reduce((a, b) => a + b, 0);
      averageTestScore = Math.round((sum / testPercentages.length) * 10) / 10;
    }

    // 3. Combined Overall Average %
    const allPercentages = [...assignmentPercentages, ...testPercentages];
    const overallAcademicAverage =
      allPercentages.length > 0
        ? Math.round(
            (allPercentages.reduce((a, b) => a + b, 0) /
              allPercentages.length) *
              10,
          ) / 10
        : null;

    // 4. Submission Rate
    // Group subject IDs
    const subjectAssignmentsCountMap = new Map<string, number>();
    const subjectTestsCountMap = new Map<string, number>();

    const [allAssignments, allTests] = await Promise.all([
      this.prisma.assignment.findMany({
        select: {
          id: true,
          topic: { select: { subjectId: true } },
        },
      }),
      this.prisma.test.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          subjectId: true,
        },
      }),
    ]);

    allAssignments.forEach((a) => {
      const sId = a.topic.subjectId;
      subjectAssignmentsCountMap.set(
        sId,
        (subjectAssignmentsCountMap.get(sId) || 0) + 1,
      );
    });

    allTests.forEach((t) => {
      subjectTestsCountMap.set(
        t.subjectId,
        (subjectTestsCountMap.get(t.subjectId) || 0) + 1,
      );
    });

    let totalExpectedTasks = 0;
    activeMemberships.forEach((m) => {
      const sId = m.group.subjectId;
      const assignCount = subjectAssignmentsCountMap.get(sId) || 0;
      const testCount = subjectTestsCountMap.get(sId) || 0;
      totalExpectedTasks += assignCount + testCount;
    });

    const totalCompletedOrSubmitted =
      gradedSubmissions.length + completedAttempts.length;
    const submissionRate =
      totalExpectedTasks > 0
        ? Math.round((totalCompletedOrSubmitted / totalExpectedTasks) * 100)
        : 0;

    return {
      message: 'Академиялық мониторинг шолуы',
      stats: {
        totalStudents,
        activeGroupsCount,
        totalSubjects,
        totalAssignments,
        totalSubmissions,
        gradedSubmissionsCount: gradedSubmissions.length,
        totalTests,
        completedAttemptsCount: completedAttempts.length,
        averageAssignmentScore,
        averageTestScore,
        overallAcademicAverage,
        submissionRate,
      },
      groupsList: groups.map((g) => ({
        id: g.id,
        name: g.name,
        course: g.course,
        semester: g.semester,
        academicYear: g.academicYear,
        subject: {
          id: g.subject.id,
          name: g.subject.name,
          code: g.subject.code,
        },
        teacherName: g.teacher?.user?.fullName || 'Мұғалім бекітілмеген',
        activeStudentsCount: g._count.memberships,
      })),
      subjectsList: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code,
        activeGroupsCount: s._count.groups,
        topicsCount: s._count.topics,
        testsCount: s._count.tests,
      })),
    };
  }

  async getAcademicStudents(params: {
    search?: string;
    groupId?: string;
    subjectId?: string;
    course?: number;
    performance?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));

    const where: any = {};

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.user = {
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    if (params.course) {
      where.course = Number(params.course);
    }

    if (params.groupId) {
      where.memberships = {
        some: {
          groupId: params.groupId,
          status: 'ACTIVE',
        },
      };
    } else if (params.subjectId) {
      where.memberships = {
        some: {
          group: {
            subjectId: params.subjectId,
          },
          status: 'ACTIVE',
        },
      };
    }

    const students = await this.prisma.studentProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        university: { select: { name: true } },
        faculty: { select: { name: true } },
        major: { select: { name: true } },
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            group: {
              include: {
                subject: true,
                teacher: {
                  include: {
                    user: { select: { fullName: true } },
                  },
                },
              },
            },
          },
        },
        assignmentSubmissions: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                maxScore: true,
                topic: { select: { subjectId: true } },
              },
            },
          },
        },
        testAttempts: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
                maxScore: true,
                subjectId: true,
              },
            },
          },
          orderBy: {
            startedAt: 'desc',
          },
        },
      },
      orderBy: {
        user: { fullName: 'asc' },
      },
    });

    // Extract all subjectIds for enrolled students to prefetch curriculum counts
    const allEnrolledSubjectIds = Array.from(
      new Set(
        students.flatMap((s) => s.memberships.map((m) => m.group.subjectId)),
      ),
    );

    const [allSubjectAssignments, allSubjectTests] = await Promise.all([
      allEnrolledSubjectIds.length > 0
        ? this.prisma.assignment.findMany({
            where: {
              topic: {
                subjectId: { in: allEnrolledSubjectIds },
              },
            },
            select: {
              id: true,
              title: true,
              maxScore: true,
              topic: { select: { subjectId: true } },
            },
          })
        : Promise.resolve([]),
      allEnrolledSubjectIds.length > 0
        ? this.prisma.test.findMany({
            where: {
              subjectId: { in: allEnrolledSubjectIds },
              status: 'PUBLISHED',
            },
            select: {
              id: true,
              title: true,
              maxScore: true,
              subjectId: true,
            },
          })
        : Promise.resolve([]),
    ]);

    // Map each student's academic metrics
    const mappedStudents = students.map((student) => {
      const enrolledSubjectIds = Array.from(
        new Set(student.memberships.map((m) => m.group.subjectId)),
      );

      // Total assignments assigned for this student's subjects
      const assignedAssignments = allSubjectAssignments.filter((a) =>
        enrolledSubjectIds.includes(a.topic.subjectId),
      );
      // Total published tests for this student's subjects
      const assignedTests = allSubjectTests.filter((t) =>
        enrolledSubjectIds.includes(t.subjectId),
      );

      // Submissions
      const submissions = student.assignmentSubmissions.filter((sub) =>
        assignedAssignments.some((a) => a.id === sub.assignmentId),
      );
      const submittedCount = submissions.filter(
        (s) => s.status !== 'NOT_SUBMITTED',
      ).length;
      const gradedSubmissions = submissions.filter(
        (s) => s.status === 'GRADED' && s.score !== null,
      );

      let assignmentsAverage: number | null = null;
      if (gradedSubmissions.length > 0) {
        const sum = gradedSubmissions.reduce(
          (acc, sub) =>
            acc + (sub.score! / sub.assignment.maxScore) * 100,
          0,
        );
        assignmentsAverage =
          Math.round((sum / gradedSubmissions.length) * 10) / 10;
      }

      // Test Attempts (take latest attempt per testId without double-counting)
      const latestAttemptMap = new Map<
        string,
        (typeof student.testAttempts)[0]
      >();
      student.testAttempts.forEach((att) => {
        if (!latestAttemptMap.has(att.testId)) {
          latestAttemptMap.set(att.testId, att);
        }
      });

      const uniqueAttempts = Array.from(latestAttemptMap.values()).filter(
        (att) => assignedTests.some((t) => t.id === att.testId),
      );
      const completedAttempts = uniqueAttempts.filter(
        (att) =>
          (att.status === 'COMPLETED' || att.status === 'EXPIRED') &&
          (att.percentage !== null || att.score !== null),
      );

      let testsAverage: number | null = null;
      if (completedAttempts.length > 0) {
        const sum = completedAttempts.reduce((acc, att) => {
          const pct =
            att.percentage ??
            (att.score !== null && att.test.maxScore > 0
              ? (att.score / att.test.maxScore) * 100
              : 0);
          return acc + pct;
        }, 0);
        testsAverage =
          Math.round((sum / completedAttempts.length) * 10) / 10;
      }

      // Overall average (only considering graded/completed scores)
      const allGradedScores = [
        ...gradedSubmissions.map(
          (s) => (s.score! / s.assignment.maxScore) * 100,
        ),
        ...completedAttempts.map(
          (att) =>
            att.percentage ??
            (att.score !== null && att.test.maxScore > 0
              ? (att.score / att.test.maxScore) * 100
              : 0),
        ),
      ];

      const totalAverage =
        allGradedScores.length > 0
          ? Math.round(
              (allGradedScores.reduce((acc, v) => acc + v, 0) /
                allGradedScores.length) *
                10,
            ) / 10
          : null;

      // Completion rate
      const totalExpected = assignedAssignments.length + assignedTests.length;
      const totalCompletedWork = submittedCount + completedAttempts.length;
      const completionRate =
        totalExpected > 0
          ? Math.round((totalCompletedWork / totalExpected) * 100)
          : 0;

      return {
        id: student.id,
        userId: student.user.id,
        fullName: student.user.fullName,
        email: student.user.email,
        phone: student.user.phone,
        course: student.course,
        avatarUrl: student.avatarUrl,
        faculty: student.faculty?.name || null,
        major: student.major?.name || null,
        groups: student.memberships.map((m) => ({
          id: m.group.id,
          name: m.group.name,
          course: m.group.course,
          subject: {
            id: m.group.subject.id,
            name: m.group.subject.name,
            code: m.group.subject.code,
          },
          teacherName:
            m.group.teacher?.user?.fullName || 'Мұғалім бекітілмеген',
        })),
        assignmentsStats: {
          totalAssigned: assignedAssignments.length,
          submittedCount,
          gradedCount: gradedSubmissions.length,
          averageScore: assignmentsAverage,
        },
        testsStats: {
          totalTests: assignedTests.length,
          attemptedCount: uniqueAttempts.length,
          completedCount: completedAttempts.length,
          averageScore: testsAverage,
        },
        metrics: {
          totalAverage,
          gradeLetter: this.getGradeLetter(totalAverage),
          completionRate,
        },
      };
    });

    // Performance filtering
    let filteredStudents = mappedStudents;
    if (params.performance === 'EXCELLENT') {
      filteredStudents = mappedStudents.filter(
        (s) => s.metrics.totalAverage !== null && s.metrics.totalAverage >= 85,
      );
    } else if (params.performance === 'GOOD') {
      filteredStudents = mappedStudents.filter(
        (s) =>
          s.metrics.totalAverage !== null &&
          s.metrics.totalAverage >= 70 &&
          s.metrics.totalAverage < 85,
      );
    } else if (params.performance === 'SATISFACTORY') {
      filteredStudents = mappedStudents.filter(
        (s) =>
          s.metrics.totalAverage !== null &&
          s.metrics.totalAverage >= 50 &&
          s.metrics.totalAverage < 70,
      );
    } else if (params.performance === 'AT_RISK') {
      filteredStudents = mappedStudents.filter(
        (s) =>
          s.metrics.totalAverage === null ||
          s.metrics.totalAverage < 50 ||
          s.metrics.completionRate < 30,
      );
    }

    const totalStudents = filteredStudents.length;
    const totalPages = Math.ceil(totalStudents / limit) || 1;
    const skip = (page - 1) * limit;
    const paginatedStudents = filteredStudents.slice(skip, skip + limit);

    return {
      message: 'Студенттердің академиялық көрсеткіштері',
      students: paginatedStudents,
      pagination: {
        page,
        limit,
        totalStudents,
        totalPages,
      },
    };
  }

  async getStudentAcademicDetails(studentId: string) {
    if (!studentId) {
      throw new BadRequestException('Студент ID көрсетілмеген');
    }

    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        university: { select: { name: true } },
        faculty: { select: { name: true } },
        major: { select: { name: true } },
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            group: {
              include: {
                subject: true,
                teacher: {
                  include: {
                    user: { select: { fullName: true, email: true } },
                  },
                },
              },
            },
          },
        },
        assignmentSubmissions: {
          include: {
            assignment: {
              include: {
                topic: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        testAttempts: {
          include: {
            test: {
              include: {
                subject: true,
                topic: true,
              },
            },
          },
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Студент профилі табылмады');
    }

    const enrolledSubjectIds = Array.from(
      new Set(student.memberships.map((m) => m.group.subjectId)),
    );

    // Fetch all assignments and tests for student's subjects
    const [allSubjectAssignments, allSubjectTests] = await Promise.all([
      enrolledSubjectIds.length > 0
        ? this.prisma.assignment.findMany({
            where: {
              topic: {
                subjectId: { in: enrolledSubjectIds },
              },
            },
            include: {
              topic: {
                include: {
                  subject: true,
                },
              },
            },
            orderBy: [{ topic: { order: 'asc' } }, { createdAt: 'asc' }],
          })
        : Promise.resolve([]),
      enrolledSubjectIds.length > 0
        ? this.prisma.test.findMany({
            where: {
              subjectId: { in: enrolledSubjectIds },
              status: 'PUBLISHED',
            },
            include: {
              subject: true,
              topic: true,
            },
            orderBy: { createdAt: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    // Map Submissions by assignmentId
    const submissionMap = new Map<
      string,
      (typeof student.assignmentSubmissions)[0]
    >();
    student.assignmentSubmissions.forEach((sub) => {
      submissionMap.set(sub.assignmentId, sub);
    });

    // Map test attempts by testId (latest attempt)
    const latestAttemptMap = new Map<
      string,
      (typeof student.testAttempts)[0]
    >();
    student.testAttempts.forEach((att) => {
      if (!latestAttemptMap.has(att.testId)) {
        latestAttemptMap.set(att.testId, att);
      }
    });

    // Assignments detailed list
    const assignmentsDetails = allSubjectAssignments.map((assignment) => {
      const sub = submissionMap.get(assignment.id);
      const score = sub?.score ?? null;
      const percentage =
        score !== null && assignment.maxScore > 0
          ? Math.round((score / assignment.maxScore) * 1000) / 10
          : null;

      return {
        id: assignment.id,
        title: assignment.title,
        subjectId: assignment.topic.subject.id,
        subjectName: assignment.topic.subject.name,
        subjectCode: assignment.topic.subject.code,
        topicTitle: assignment.topic.title,
        maxScore: assignment.maxScore,
        deadline: assignment.deadline,
        responseType: assignment.responseType,
        status: sub ? sub.status : 'NOT_SUBMITTED',
        score,
        percentage,
        submittedAt: sub?.submittedAt || null,
        gradedAt: sub?.gradedAt || null,
        teacherComment: sub?.teacherComment || null,
        submissionId: sub?.id || null,
      };
    });

    // Tests detailed list
    const testsDetails = allSubjectTests.map((test) => {
      const att = latestAttemptMap.get(test.id);
      const score = att?.score ?? null;
      let percentage: number | null = null;
      if (att?.percentage != null) {
        percentage = Math.round(att.percentage * 10) / 10;
      } else if (score != null && test.maxScore > 0) {
        percentage = Math.round((score / test.maxScore) * 1000) / 10;
      }

      return {
        id: test.id,
        title: test.title,
        subjectId: test.subject.id,
        subjectName: test.subject.name,
        subjectCode: test.subject.code,
        topicTitle: test.topic?.title || null,
        maxScore: test.maxScore,
        durationMinutes: test.durationMinutes,
        status: att ? att.status : 'NOT_STARTED',
        score,
        percentage,
        submittedAt: att?.submittedAt || null,
        attemptId: att?.id || null,
      };
    });

    // Graded stats & overall calculations
    const gradedAssignments = assignmentsDetails.filter(
      (a) => a.status === 'GRADED' && a.score !== null,
    );
    const assignmentsAverage =
      gradedAssignments.length > 0
        ? Math.round(
            (gradedAssignments.reduce(
              (acc, a) => acc + (a.percentage ?? 0),
              0,
            ) /
              gradedAssignments.length) *
              10,
          ) / 10
        : null;

    const completedTests = testsDetails.filter(
      (t) =>
        (t.status === 'COMPLETED' || t.status === 'EXPIRED') &&
        t.percentage !== null,
    );
    const testsAverage =
      completedTests.length > 0
        ? Math.round(
            (completedTests.reduce(
              (acc, t) => acc + (t.percentage ?? 0),
              0,
            ) /
              completedTests.length) *
              10,
          ) / 10
        : null;

    const allScores = [
      ...gradedAssignments.map((a) => a.percentage ?? 0),
      ...completedTests.map((t) => t.percentage ?? 0),
    ];
    const totalAverage =
      allScores.length > 0
        ? Math.round(
            (allScores.reduce((acc, v) => acc + v, 0) / allScores.length) * 10,
          ) / 10
        : null;

    const totalAssignedWork =
      assignmentsDetails.length + testsDetails.length;
    const submittedWorkCount =
      assignmentsDetails.filter((a) => a.status !== 'NOT_SUBMITTED').length +
      completedTests.length;
    const completionRate =
      totalAssignedWork > 0
        ? Math.round((submittedWorkCount / totalAssignedWork) * 100)
        : 0;

    // Term Grades (RK-1, RK-2, Session)
    const termGrades = await this.prisma.termGrade.findMany({
      where: { studentId: student.id },
      include: {
        group: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const termGradesDetails = termGrades.map((g) => {
      const admissionRating = calculateAdmissionRating(g.rk1, g.rk2);
      const finalScore = calculateFinalScore(g.rk1, g.rk2, g.session);
      const gradeLetter = this.getGradeLetter(finalScore);
      const status = getGradeStatus(g.rk1, g.rk2, g.session);

      return {
        id: g.id,
        groupId: g.groupId,
        groupName: g.group.name,
        subjectId: g.subjectId,
        subjectName: g.subject.name,
        subjectCode: g.subject.code,
        rk1: g.rk1,
        rk2: g.rk2,
        admissionRating,
        session: g.session,
        finalScore,
        gradeLetter,
        status,
        note: g.note,
        updatedAt: g.updatedAt,
      };
    });

    return {
      message: 'Студенттің толық академиялық ведомосі',
      student: {
        id: student.id,
        userId: student.user.id,
        fullName: student.user.fullName,
        email: student.user.email,
        phone: student.user.phone,
        course: student.course,
        avatarUrl: student.avatarUrl,
        university: student.university?.name || null,
        faculty: student.faculty?.name || null,
        major: student.major?.name || null,
      },
      groups: student.memberships.map((m) => ({
        id: m.group.id,
        name: m.group.name,
        course: m.group.course,
        semester: m.group.semester,
        academicYear: m.group.academicYear,
        subject: {
          id: m.group.subject.id,
          name: m.group.subject.name,
          code: m.group.subject.code,
        },
        teacher: {
          fullName: m.group.teacher?.user?.fullName || 'Мұғалім бекітілмеген',
          email: m.group.teacher?.user?.email || null,
        },
      })),
      termGrades: termGradesDetails,
      assignments: assignmentsDetails,
      tests: testsDetails,
      metrics: {
        assignmentsAverage,
        testsAverage,
        totalAverage,
        gradeLetter: this.getGradeLetter(totalAverage),
        completionRate,
        submittedAssignmentsCount: assignmentsDetails.filter(
          (a) => a.status !== 'NOT_SUBMITTED',
        ).length,
        totalAssignmentsCount: assignmentsDetails.length,
        completedTestsCount: completedTests.length,
        totalTestsCount: testsDetails.length,
      },
    };
  }
}
