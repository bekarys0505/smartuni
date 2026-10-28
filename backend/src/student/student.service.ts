import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from './progress.service';
import {
  calculateAdmissionRating,
  calculateFinalScore,
  getGradeLetter,
  getGradeStatus,
  getGpaPoints,
} from '../common/grading.util';

@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
  ) {}

  async getDashboard(userId?: string) {
    if (!userId) {
      throw new NotFoundException('Қолданушы анықталмады');
    }

    const student = await this.prisma.studentProfile.findUnique({
      where: {
        userId,
      },
      include: {
        user: true,
        university: true,
        faculty: true,
        major: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Студент профилі табылмады');
    }

    // Compute live progress data safely
    const [learning, academic] = await Promise.all([
      this.progressService.getLearningProgress(userId),
      this.progressService.getAcademicResults(userId),
    ]);

    return {
      message: 'Student Dashboard деректері',
      student: {
        id: student.id,
        fullName: student.user.fullName,
        email: student.user.email,
        phone: student.user.phone,
        role: student.user.role,
        university: {
          id: student.university.id,
          name: student.university.name,
          shortName: student.university.shortName,
        },
        faculty: {
          id: student.faculty.id,
          name: student.faculty.name,
        },
        major: {
          id: student.major.id,
          name: student.major.name,
        },
        course: student.course,
        premium: student.premium,
      },
      progress: {
        learning: learning.overall,
        academic: academic.academicScore,
        totalMaterials: learning.totalMaterials,
        completedMaterials: learning.completedMaterials,
        assignmentAverage: academic.assignmentAverage,
        testAverage: academic.testAverage,
      },
    };
  }

  async getSubjects(userId?: string) {
    if (!userId) {
      throw new NotFoundException('Қолданушы анықталмады');
    }

    const student = await this.prisma.studentProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!student) {
      throw new NotFoundException('Студент профилі табылмады');
    }

    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
      },
      include: {
        group: {
          include: {
            subject: {
              include: {
                topics: {
                  include: {
                    materials: {
                      select: {
                        id: true,
                      },
                    },
                  },
                },
              },
            },
            teacher: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    // Fetch all completed material IDs for this student
    const completedProgresses = await this.prisma.studentMaterialProgress.findMany({
      where: {
        studentId: student.id,
        status: 'COMPLETED',
      },
      select: {
        materialId: true,
      },
    });
    const completedMaterialIdSet = new Set(completedProgresses.map((p) => p.materialId));

    return {
      message: 'Студенттің пәндері',
      subjects: memberships.map((membership) => {
        const subject = membership.group.subject;
        const topicCount = subject.topics.length;

        // Calculate progress across all materials in this subject
        const allMaterialIds = subject.topics.flatMap((t) => t.materials.map((m) => m.id));
        const totalMaterials = allMaterialIds.length;
        const completedCount = allMaterialIds.filter((id) => completedMaterialIdSet.has(id)).length;
        const progress = totalMaterials > 0 ? Math.round((completedCount / totalMaterials) * 100) : 0;

        return {
          membershipId: membership.id,
          id: subject.id,
          name: subject.name,
          code: subject.code,
          description: subject.description,
          group: {
            id: membership.group.id,
            name: membership.group.name,
            course: membership.group.course,
            semester: membership.group.semester,
            academicYear: membership.group.academicYear,
            lessonDay: membership.group.lessonDay,
            lessonTime: membership.group.lessonTime,
            classroom: membership.group.classroom,
          },
          subject: {
            id: subject.id,
            name: subject.name,
            code: subject.code,
            description: subject.description,
          },
          teacher: {
            id: membership.group.teacher.id,
            fullName: membership.group.teacher.user.fullName,
          },
          topicCount,
          totalMaterials,
          completedCount,
          progress,
          joinedAt: membership.joinedAt,
        };
      }),
    };
  }

  async getAvailableGroups(userId?: string) {
    if (!userId) {
      throw new NotFoundException('Қолданушы анықталмады');
    }

    const student = await this.prisma.studentProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!student) {
      throw new NotFoundException('Студент профилі табылмады');
    }

    const groups = await this.prisma.group.findMany({
      where: {
        status: 'ACTIVE',
        course: student.course,
      },
      include: {
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
        memberships: {
          where: {
            studentId: student.id,
          },
          select: {
            id: true,
            status: true,
          },
        },
        joinRequests: {
          where: {
            studentId: student.id,
          },
          select: {
            id: true,
            status: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            memberships: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Қолжетімді топтар',
      groups: groups.map((group) => {
        const membership = group.memberships[0];
        const request = group.joinRequests[0];

        let status: 'AVAILABLE' | 'PENDING' | 'MEMBER' | 'REJECTED' = 'AVAILABLE';

        if (membership?.status === 'ACTIVE') {
          status = 'MEMBER';
        } else if (request?.status === 'PENDING') {
          status = 'PENDING';
        } else if (request?.status === 'REJECTED') {
          status = 'REJECTED';
        }

        return {
          id: group.id,
          name: group.name,
          subject: {
            id: group.subject.id,
            name: group.subject.name,
            code: group.subject.code,
          },
          teacher: {
            id: group.teacher.id,
            fullName: group.teacher.user.fullName,
          },
          course: group.course,
          semester: group.semester,
          academicYear: group.academicYear,
          schedule: {
            day: group.lessonDay,
            time: group.lessonTime,
            classroom: group.classroom,
          },
          capacity: group.capacity,
          currentStudents: group._count.memberships,
          availablePlaces: Math.max(0, group.capacity - group._count.memberships),
          status,
        };
      }),
    };
  }

  async joinGroup(userId?: string, groupId?: string) {
    if (!userId) {
      throw new NotFoundException('Қолданушы анықталмады');
    }

    if (!groupId) {
      throw new NotFoundException('Топ көрсетілмеді');
    }

    const student = await this.prisma.studentProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!student) {
      throw new NotFoundException('Студент профилі табылмады');
    }

    const group = await this.prisma.group.findUnique({
      where: {
        id: groupId,
      },
      include: {
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!group || group.status !== 'ACTIVE') {
      throw new NotFoundException('Белсенді топ табылмады');
    }

    if (group.course !== student.course) {
      throw new ConflictException('Бұл топ сіздің курсыңызға сәйкес келмейді');
    }

    const existingMembership = await this.prisma.groupMembership.findUnique({
      where: {
        studentId_groupId: {
          studentId: student.id,
          groupId: group.id,
        },
      },
    });

    if (existingMembership && existingMembership.status === 'ACTIVE') {
      throw new ConflictException('Сіз бұл топтың мүшесісіз');
    }

    const existingRequest = await this.prisma.joinRequest.findFirst({
      where: {
        studentId: student.id,
        groupId: group.id,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      throw new ConflictException('Бұл топқа қосылу өтініші бұрын жіберілген');
    }

    const currentStudents = await this.prisma.groupMembership.count({
      where: {
        groupId: group.id,
        status: 'ACTIVE',
      },
    });

    if (currentStudents >= group.capacity) {
      throw new ConflictException('Бұл топта бос орын жоқ');
    }

    const request = await this.prisma.joinRequest.create({
      data: {
        studentId: student.id,
        groupId: group.id,
        status: 'PENDING',
      },
      include: {
        group: {
          include: {
            subject: true,
          },
        },
      },
    });

    return {
      message: 'Топқа қосылу өтініші жіберілді',
      request: {
        id: request.id,
        status: request.status,
        createdAt: request.createdAt,
        group: {
          id: request.group.id,
          name: request.group.name,
          subject: request.group.subject.name,
        },
      },
    };
  }

  // =========================================================================
  // LMS LEARNING FLOW METHODS
  // =========================================================================

  private async getStudentProfile(userId?: string) {
    if (!userId) {
      throw new NotFoundException('Қолданушы анықталмады');
    }
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new NotFoundException('Студент профилі табылмады');
    }
    return student;
  }

  private async verifyStudentSubjectAccess(studentId: string, subjectId: string) {
    const membership = await this.prisma.groupMembership.findFirst({
      where: {
        studentId,
        status: 'ACTIVE',
        group: {
          subjectId,
          status: 'ACTIVE',
        },
      },
      include: {
        group: {
          include: {
            teacher: {
              include: { user: true },
            },
            subject: true,
          },
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Сіз бұл пәннің белсенді тыңдаушысы емессіз немесе рұқсатыңыз жоқ');
    }

    return membership;
  }

  async getSubjectDetails(userId: string | undefined, subjectId: string) {
    const student = await this.getStudentProfile(userId);
    const membership = await this.verifyStudentSubjectAccess(student.id, subjectId);

    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        topics: {
          orderBy: { order: 'asc' },
          include: {
            materials: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Пән табылмады');
    }

    // Get completed progresses for this student
    const completedProgresses = await this.prisma.studentMaterialProgress.findMany({
      where: {
        studentId: student.id,
        status: 'COMPLETED',
      },
      select: { materialId: true },
    });
    const completedSet = new Set(completedProgresses.map((p) => p.materialId));

    const topicsWithProgress = subject.topics.map((topic) => {
      const materialCount = topic.materials.length;
      const completedMaterialCount = topic.materials.filter((m) => completedSet.has(m.id)).length;
      const progress = materialCount > 0 ? Math.round((completedMaterialCount / materialCount) * 100) : 0;

      return {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        order: topic.order,
        materialCount,
        completedMaterialCount,
        progress,
      };
    });

    // Overall subject progress
    const allMaterials = subject.topics.flatMap((t) => t.materials.map((m) => m.id));
    const totalMaterials = allMaterials.length;
    const completedTotal = allMaterials.filter((id) => completedSet.has(id)).length;
    const overallProgress = totalMaterials > 0 ? Math.round((completedTotal / totalMaterials) * 100) : 0;

    return {
      message: 'Пән туралы толық мәлімет',
      subject: {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        overallProgress,
        totalMaterials,
        completedTotal,
      },
      teacher: {
        id: membership.group.teacher.id,
        fullName: membership.group.teacher.user.fullName,
      },
      group: {
        id: membership.group.id,
        name: membership.group.name,
        course: membership.group.course,
        semester: membership.group.semester,
        academicYear: membership.group.academicYear,
      },
      topics: topicsWithProgress,
    };
  }

  async getTopicDetails(userId: string | undefined, topicId: string) {
    const student = await this.getStudentProfile(userId);

    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        subject: true,
        materials: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException('Тақырып табылмады');
    }

    // Verify access to subject
    await this.verifyStudentSubjectAccess(student.id, topic.subjectId);

    // Get material statuses
    const progresses = await this.prisma.studentMaterialProgress.findMany({
      where: {
        studentId: student.id,
        materialId: { in: topic.materials.map((m) => m.id) },
      },
    });

    const statusMap = new Map(progresses.map((p) => [p.materialId, p.status]));

    const materialsWithStatus = topic.materials.map((mat) => ({
      id: mat.id,
      title: mat.title,
      description: mat.description,
      type: mat.type,
      contentUrl: mat.contentUrl,
      contentText: mat.contentText,
      order: mat.order,
      status: statusMap.get(mat.id) || 'UNREAD',
    }));

    const topicAssignments = await this.prisma.assignment.findMany({
      where: { topicId: topic.id },
      include: {
        submissions: {
          where: { studentId: student.id },
        },
      },
      orderBy: { deadline: 'asc' },
    });

    const assignmentsWithStatus = topicAssignments.map((a) => {
      const sub = a.submissions[0];
      const isLate = a.deadline ? new Date() > new Date(a.deadline) : false;
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        responseType: a.responseType,
        attachmentUrl: a.attachmentUrl,
        maxScore: a.maxScore,
        deadline: a.deadline,
        allowLate: a.allowLate,
        status: sub ? sub.status : 'NOT_SUBMITTED',
        score: sub?.score ?? null,
        teacherComment: sub?.teacherComment ?? null,
        submittedAt: sub?.submittedAt ?? null,
        isLate,
      };
    });

    return {
      message: 'Тақырып материалдары',
      topic: {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        order: topic.order,
      },
      subject: {
        id: topic.subject.id,
        name: topic.subject.name,
        code: topic.subject.code,
      },
      materials: materialsWithStatus,
      assignments: assignmentsWithStatus,
    };
  }

  async getMaterials(
    userId?: string,
    query?: {
      subjectId?: string;
      type?: string;
      search?: string;
    },
  ) {
    const student = await this.getStudentProfile(userId);

    // 1. Get active memberships and allowed subjects
    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
        group: {
          status: 'ACTIVE',
        },
      },
      include: {
        group: {
          include: {
            subject: true,
          },
        },
      },
    });

    const subjectsMap = new Map<string, { id: string; name: string; code: string | null }>();
    memberships.forEach((m) => {
      const s = m.group.subject;
      if (!subjectsMap.has(s.id)) {
        subjectsMap.set(s.id, {
          id: s.id,
          name: s.name,
          code: s.code,
        });
      }
    });

    const allowedSubjectIds = Array.from(subjectsMap.keys());
    if (allowedSubjectIds.length === 0) {
      return {
        message: 'Оқу материалдары',
        materials: [],
        subjects: [],
      };
    }

    // 2. Validate requested subjectId if provided
    let targetSubjectIds = allowedSubjectIds;
    if (query?.subjectId) {
      if (!allowedSubjectIds.includes(query.subjectId)) {
        throw new ForbiddenException('Бұл пәннің материалдарын көруге рұқсатыңыз жоқ');
      }
      targetSubjectIds = [query.subjectId];
    }

    // 3. Build Prisma where clause
    const where: any = {
      topic: {
        subjectId: { in: targetSubjectIds },
      },
    };

    if (query?.type && ['LECTURE', 'VIDEO', 'ADDITIONAL_RESOURCE'].includes(query.type)) {
      where.type = query.type;
    }

    if (query?.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const materials = await this.prisma.material.findMany({
      where,
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
        progresses: {
          where: {
            studentId: student.id,
          },
        },
      },
      orderBy: [
        { topic: { order: 'asc' } },
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const formattedMaterials = materials.map((m) => {
      const progress = m.progresses[0];
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        type: m.type,
        contentUrl: m.contentUrl,
        hasTextContent: Boolean(m.contentText),
        order: m.order,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        status: progress ? progress.status : 'UNREAD',
        topic: {
          id: m.topic.id,
          title: m.topic.title,
          order: m.topic.order,
        },
        subject: {
          id: m.topic.subject.id,
          name: m.topic.subject.name,
          code: m.topic.subject.code,
        },
      };
    });

    return {
      message: 'Оқу материалдарының тізімі',
      materials: formattedMaterials,
      subjects: Array.from(subjectsMap.values()),
    };
  }

  async getMaterialDetails(userId: string | undefined, materialId: string) {
    const student = await this.getStudentProfile(userId);

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
      throw new NotFoundException('Материал табылмады');
    }

    // Verify access
    await this.verifyStudentSubjectAccess(student.id, material.topic.subjectId);

    // Fetch or create initial progress if needed
    let progress = await this.prisma.studentMaterialProgress.findUnique({
      where: {
        studentId_materialId: {
          studentId: student.id,
          materialId: material.id,
        },
      },
    });

    return {
      message: 'Материал деректері',
      material: {
        id: material.id,
        title: material.title,
        description: material.description,
        type: material.type,
        contentUrl: material.contentUrl,
        contentText: material.contentText,
        order: material.order,
        status: progress?.status || 'UNREAD',
        startedAt: progress?.startedAt || null,
        completedAt: progress?.completedAt || null,
      },
      topic: {
        id: material.topic.id,
        title: material.topic.title,
      },
      subject: {
        id: material.topic.subject.id,
        name: material.topic.subject.name,
        code: material.topic.subject.code,
      },
    };
  }

  async startMaterial(userId: string | undefined, materialId: string) {
    const student = await this.getStudentProfile(userId);

    const material = await this.prisma.material.findUnique({
      where: { id: materialId },
      include: {
        topic: true,
      },
    });

    if (!material) {
      throw new NotFoundException('Материал табылмады');
    }

    await this.verifyStudentSubjectAccess(student.id, material.topic.subjectId);

    // Check existing progress
    const existing = await this.prisma.studentMaterialProgress.findUnique({
      where: {
        studentId_materialId: {
          studentId: student.id,
          materialId: material.id,
        },
      },
    });

    // If already COMPLETED, keep COMPLETED (do not downgrade)
    if (existing && existing.status === 'COMPLETED') {
      return {
        message: 'Материал бұрын аяқталған',
        status: 'COMPLETED',
        completedAt: existing.completedAt,
      };
    }

    const progress = await this.prisma.studentMaterialProgress.upsert({
      where: {
        studentId_materialId: {
          studentId: student.id,
          materialId: material.id,
        },
      },
      update: {
        status: 'STARTED',
        startedAt: existing?.startedAt || new Date(),
      },
      create: {
        studentId: student.id,
        materialId: material.id,
        status: 'STARTED',
        startedAt: new Date(),
      },
    });

    return {
      message: 'Материалды оқу басталды',
      status: progress.status,
      startedAt: progress.startedAt,
    };
  }

  async completeMaterial(userId: string | undefined, materialId: string) {
    const student = await this.getStudentProfile(userId);

    const material = await this.prisma.material.findUnique({
      where: { id: materialId },
      include: {
        topic: true,
      },
    });

    if (!material) {
      throw new NotFoundException('Материал табылмады');
    }

    await this.verifyStudentSubjectAccess(student.id, material.topic.subjectId);

    const progress = await this.prisma.studentMaterialProgress.upsert({
      where: {
        studentId_materialId: {
          studentId: student.id,
          materialId: material.id,
        },
      },
      update: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      create: {
        studentId: student.id,
        materialId: material.id,
        status: 'COMPLETED',
        startedAt: new Date(),
        completedAt: new Date(),
      },
    });

    return {
      message: 'Материал сәтті аяқталды',
      status: progress.status,
      completedAt: progress.completedAt,
    };
  }

  // =========================================================================
  // STUDENT ASSIGNMENT METHODS
  // =========================================================================

  async getAssignments(userId?: string) {
    const student = await this.getStudentProfile(userId);

    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
      },
      include: {
        group: {
          include: {
            subject: {
              include: {
                topics: true,
              },
            },
            teacher: {
              include: { user: true },
            },
          },
        },
      },
    });

    const topicIds = memberships.flatMap((m) => m.group.subject.topics.map((t) => t.id));

    const assignments = await this.prisma.assignment.findMany({
      where: {
        topicId: { in: topicIds },
      },
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
        submissions: {
          where: { studentId: student.id },
        },
      },
      orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
    });

    const teacherMap = new Map<string, { id: string; fullName: string }>();
    memberships.forEach((m) => {
      teacherMap.set(m.group.subjectId, {
        id: m.group.teacher.id,
        fullName: m.group.teacher.user.fullName,
      });
    });

    const items = assignments.map((a) => {
      const submission = a.submissions[0] || null;
      const isLate = a.deadline ? new Date() > new Date(a.deadline) : false;
      const teacher = teacherMap.get(a.topic.subjectId) || { id: '', fullName: 'Оқытушы' };

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
        teacher,
        submission: submission
          ? {
              id: submission.id,
              textAnswer: submission.textAnswer,
              fileUrl: submission.fileUrl,
              status: submission.status,
              submittedAt: submission.submittedAt,
              score: submission.score,
              teacherComment: submission.teacherComment,
              gradedAt: submission.gradedAt,
            }
          : null,
        status: submission ? submission.status : 'NOT_SUBMITTED',
        score: submission?.score ?? null,
        teacherComment: submission?.teacherComment ?? null,
        isLate,
      };
    });

    return {
      message: 'Студент тапсырмалары',
      assignments: items,
    };
  }

  async getAssignmentDetails(userId: string | undefined, assignmentId: string) {
    const student = await this.getStudentProfile(userId);

    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
        submissions: {
          where: { studentId: student.id },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Тапсырма табылмады');
    }

    const membership = await this.verifyStudentSubjectAccess(student.id, assignment.topic.subjectId);

    const submission = assignment.submissions[0] || null;
    const isLate = assignment.deadline ? new Date() > new Date(assignment.deadline) : false;

    return {
      message: 'Тапсырма туралы мәлімет',
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
      teacher: {
        id: membership.group.teacher.id,
        fullName: membership.group.teacher.user.fullName,
      },
      submission: submission
        ? {
            id: submission.id,
            textAnswer: submission.textAnswer,
            fileUrl: submission.fileUrl,
            status: submission.status,
            submittedAt: submission.submittedAt,
            score: submission.score,
            teacherComment: submission.teacherComment,
            gradedAt: submission.gradedAt,
          }
        : null,
      status: submission ? submission.status : 'NOT_SUBMITTED',
      score: submission?.score ?? null,
      teacherComment: submission?.teacherComment ?? null,
      deadline: assignment.deadline,
      isLate,
    };
  }

  async submitAssignment(
    userId: string | undefined,
    assignmentId: string,
    dto: { textAnswer?: string; fileUrl?: string; fileName?: string },
  ) {
    const student = await this.getStudentProfile(userId);

    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        topic: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Тапсырма табылмады');
    }

    await this.verifyStudentSubjectAccess(student.id, assignment.topic.subjectId);

    const now = new Date();
    let status: 'SUBMITTED' | 'LATE' = 'SUBMITTED';

    if (assignment.deadline && now > new Date(assignment.deadline)) {
      if (!assignment.allowLate) {
        throw new BadRequestException('Тапсырманы қабылдау мерзімі аяқталды (Deadline passed)');
      }
      status = 'LATE';
    }

    if (assignment.responseType === 'TEXT' && (!dto.textAnswer || !dto.textAnswer.trim())) {
      throw new BadRequestException('Мәтіндік жауап енгізу міндетті');
    }
    if (assignment.responseType === 'FILE' && (!dto.fileUrl || !dto.fileUrl.trim())) {
      throw new BadRequestException('Жауап файлын тіркеу міндетті');
    }
    if (
      assignment.responseType === 'TEXT_AND_FILE' &&
      (!dto.textAnswer || !dto.textAnswer.trim()) &&
      (!dto.fileUrl || !dto.fileUrl.trim())
    ) {
      throw new BadRequestException('Мәтіндік жауап немесе файл тіркеу міндетті');
    }

    if (dto.fileName) {
      const ext = dto.fileName.toLowerCase().slice(dto.fileName.lastIndexOf('.'));
      const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
      const dangerous = ['.exe', '.bat', '.cmd', '.sh', '.js', '.vbs', '.php', '.msi'];
      if (dangerous.includes(ext) || !allowed.includes(ext)) {
        throw new BadRequestException('Қабылданбайтын файл түрі. Тек PDF, DOC, DOCX, JPG, PNG рұқсат етілген.');
      }
    }

    // Verify existing submission status to prevent overwriting graded submissions
    const existingSubmission = await this.prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: assignment.id,
          studentId: student.id,
        },
      },
    });

    if (existingSubmission && existingSubmission.status === 'GRADED') {
      throw new BadRequestException(
        'Тапсырма бұрын бағаланған. Бағаланған тапсырманы қайта тапсыру мүмкін емес.',
      );
    }

    const submission = await this.prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: assignment.id,
          studentId: student.id,
        },
      },
      update: {
        textAnswer: dto.textAnswer?.trim() || null,
        fileUrl: dto.fileUrl?.trim() || null,
        status,
        submittedAt: now,
        score: null,
        teacherComment: null,
        gradedAt: null,
      },
      create: {
        assignmentId: assignment.id,
        studentId: student.id,
        textAnswer: dto.textAnswer?.trim() || null,
        fileUrl: dto.fileUrl?.trim() || null,
        status,
        submittedAt: now,
      },
    });

    return {
      message: status === 'LATE' ? 'Тапсырма мерзімінен кеш қабылданды' : 'Жауабыңыз сәтті жіберілді',
      assignmentId: assignment.id,
      submission: {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.submittedAt,
        textAnswer: submission.textAnswer,
        fileUrl: submission.fileUrl,
        score: submission.score,
        teacherComment: submission.teacherComment,
      },
      status: submission.status,
      score: submission.score,
      teacherComment: submission.teacherComment,
      deadline: assignment.deadline,
      isLate: status === 'LATE',
    };
  }

  // ==========================================
  // TEST SYSTEM (STUDENT)
  // ==========================================

  private shuffleArray<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  async getTests(userId?: string) {
    const student = await this.getStudentProfile(userId);

    // Get active subjects
    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
      },
      include: {
        group: {
          include: {
            subject: true,
          },
        },
      },
    });

    const subjectIds = Array.from(new Set(memberships.map((m) => m.group.subjectId)));

    const tests = await this.prisma.test.findMany({
      where: {
        subjectId: { in: subjectIds },
        status: 'PUBLISHED',
      },
      include: {
        subject: true,
        topic: true,
        questions: {
          select: { id: true, points: true },
        },
        attempts: {
          where: { studentProfileId: student.id },
          orderBy: { startedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    return {
      message: 'Студентке қолжетімді тесттер',
      tests: tests.map((t) => {
        // Auto-expire any pending expired attempt
        const activeAttempt = t.attempts.find((a) => a.status === 'IN_PROGRESS');
        let currentStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' = 'NOT_STARTED';
        let latestAttempt = t.attempts[0] || null;

        if (latestAttempt) {
          if (latestAttempt.status === 'IN_PROGRESS' && now > latestAttempt.expiresAt) {
            // mark expired in response
            currentStatus = 'EXPIRED';
          } else {
            currentStatus = latestAttempt.status as any;
          }
        }

        return {
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
          questionsCount: t.questions.length,
          totalPoints: t.questions.reduce((sum, q) => sum + q.points, 0),
          showResultsImmediately: t.showResultsImmediately,
          status: currentStatus,
          latestAttempt: latestAttempt
            ? {
                id: latestAttempt.id,
                status: latestAttempt.status,
                startedAt: latestAttempt.startedAt,
                submittedAt: latestAttempt.submittedAt,
                score: latestAttempt.score,
                percentage: latestAttempt.percentage,
                correctAnswers: latestAttempt.correctAnswers,
                totalQuestions: latestAttempt.totalQuestions,
              }
            : null,
        };
      }),
    };
  }

  async getTestDetails(userId?: string, testId?: string) {
    const student = await this.getStudentProfile(userId);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        subject: true,
        topic: true,
        questions: {
          select: { id: true, points: true },
        },
        attempts: {
          where: { studentProfileId: student.id },
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!test || test.status !== 'PUBLISHED') {
      throw new NotFoundException('Тест табылмады немесе жарияланбаған');
    }

    // Access check
    const membership = await this.prisma.groupMembership.findFirst({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
        group: { subjectId: test.subjectId },
      },
    });
    if (!membership) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    const latestAttempt = test.attempts[0] || null;

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
        questionsCount: test.questions.length,
        totalPoints: test.questions.reduce((sum, q) => sum + q.points, 0),
        showResultsImmediately: test.showResultsImmediately,
        latestAttempt: latestAttempt
          ? {
              id: latestAttempt.id,
              status: latestAttempt.status,
              startedAt: latestAttempt.startedAt,
              submittedAt: latestAttempt.submittedAt,
              expiresAt: latestAttempt.expiresAt,
              score: latestAttempt.score,
              percentage: latestAttempt.percentage,
              correctAnswers: latestAttempt.correctAnswers,
              totalQuestions: latestAttempt.totalQuestions,
            }
          : null,
      },
    };
  }

  async startTest(userId?: string, testId?: string) {
    const student = await this.getStudentProfile(userId);

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });

    if (!test || test.status !== 'PUBLISHED') {
      throw new NotFoundException('Тест табылмады немесе жарияланбаған');
    }

    const membership = await this.prisma.groupMembership.findFirst({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
        group: { subjectId: test.subjectId },
      },
    });
    if (!membership) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    const now = new Date();

    // Check existing active attempt
    const activeAttempt = await this.prisma.testAttempt.findFirst({
      where: {
        testId: test.id,
        studentProfileId: student.id,
        status: 'IN_PROGRESS',
      },
      include: {
        answers: true,
      },
    });

    if (activeAttempt) {
      if (now > activeAttempt.expiresAt) {
        // Expire it automatically
        await this.autoSubmitAttempt(activeAttempt.id, test);
      } else {
        return {
          message: 'Ағымдағы белсенді тест жалғасуда',
          attemptId: activeAttempt.id,
          expiresAt: activeAttempt.expiresAt,
          durationMinutes: test.durationMinutes,
        };
      }
    }

    // Create new attempt
    const expiresAt = new Date(now.getTime() + test.durationMinutes * 60 * 1000);

    const newAttempt = await this.prisma.testAttempt.create({
      data: {
        testId: test.id,
        studentProfileId: student.id,
        status: 'IN_PROGRESS',
        startedAt: now,
        expiresAt,
        totalQuestions: test.questions.length,
      },
    });

    return {
      message: 'Тест басталды',
      attemptId: newAttempt.id,
      expiresAt: newAttempt.expiresAt,
      durationMinutes: test.durationMinutes,
      totalQuestions: test.questions.length,
    };
  }

  async getAttempt(userId?: string, testId?: string, attemptId?: string) {
    const student = await this.getStudentProfile(userId);

    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: {
                options: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    optionText: true,
                    order: true,
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt || attempt.testId !== testId) {
      throw new NotFoundException('Тест әрекеті табылмады');
    }

    if (attempt.studentProfileId !== student.id) {
      throw new ForbiddenException('Бұл тест нәтижесі басқа қолданушыға тиесілі');
    }

    const now = new Date();
    if (attempt.status === 'IN_PROGRESS' && now > attempt.expiresAt) {
      // Auto submit on read if expired
      await this.autoSubmitAttempt(attempt.id, attempt.test);
      attempt.status = 'EXPIRED';
    }

    const answersMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

    let questions = attempt.test.questions.map((q) => {
      const studentAns = answersMap.get(q.id);
      let selectedOptionIds: string[] = [];
      try {
        if (studentAns?.selectedOptionIds) {
          selectedOptionIds = JSON.parse(studentAns.selectedOptionIds);
        }
      } catch {
        selectedOptionIds = [];
      }

      let options = q.options.map((o) => ({
        id: o.id,
        optionText: o.optionText,
        order: o.order,
      }));

      if (attempt.test.shuffleAnswers) {
        options = this.shuffleArray(options);
      }

      return {
        id: q.id,
        order: q.order,
        type: q.type,
        questionText: q.questionText,
        points: q.points,
        options,
        studentAnswer: {
          textAnswer: studentAns?.textAnswer || null,
          selectedOptionIds,
          isAnswered: Boolean(studentAns && (studentAns.textAnswer || selectedOptionIds.length > 0)),
        },
      };
    });

    if (attempt.test.shuffleQuestions) {
      questions = this.shuffleArray(questions);
    }

    return {
      message: 'Тест сұрақтары мен жауаптар күйі',
      attempt: {
        id: attempt.id,
        testId: attempt.test.id,
        testTitle: attempt.test.title,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        durationMinutes: attempt.test.durationMinutes,
        totalQuestions: attempt.totalQuestions,
        answeredCount: attempt.answers.filter((a) => a.textAnswer || a.selectedOptionIds).length,
      },
      questions,
    };
  }

  async answerQuestion(
    userId?: string,
    testId?: string,
    attemptId?: string,
    dto?: {
      questionId?: string;
      textAnswer?: string;
      selectedOptionIds?: string[];
    },
  ) {
    const student = await this.getStudentProfile(userId);

    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!attempt || attempt.testId !== testId) {
      throw new NotFoundException('Тест әрекеті табылмады');
    }
    if (attempt.studentProfileId !== student.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    const now = new Date();
    if (attempt.status !== 'IN_PROGRESS' || now > attempt.expiresAt) {
      if (attempt.status === 'IN_PROGRESS' && now > attempt.expiresAt) {
        await this.autoSubmitAttempt(attempt.id, attempt.test);
      }
      throw new BadRequestException('Тест уақыты аяқталған немесе тапсырылған');
    }

    if (!dto?.questionId) {
      throw new BadRequestException('Сұрақ ID көрсетілмеген');
    }

    const question = attempt.test.questions.find((q) => q.id === dto.questionId);
    if (!question) {
      throw new NotFoundException('Сұрақ тестке тиесілі емес');
    }

    const selectedOptionIds = Array.isArray(dto.selectedOptionIds) ? dto.selectedOptionIds : [];
    const textAnswer = dto.textAnswer?.trim() || null;

    // Intermediate grading logic
    let isCorrect: boolean | null = null;
    let score: number | null = null;

    if (question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE') {
      if (selectedOptionIds.length > 0) {
        const correctOpt = question.options.find((o) => o.isCorrect);
        isCorrect = correctOpt ? selectedOptionIds[0] === correctOpt.id : false;
        score = isCorrect ? question.points : 0;
      }
    } else if (question.type === 'MULTIPLE_CHOICE') {
      if (selectedOptionIds.length > 0) {
        const correctOptIds = question.options.filter((o) => o.isCorrect).map((o) => o.id);
        const allCorrectSelected = correctOptIds.length === selectedOptionIds.length &&
          correctOptIds.every((id) => selectedOptionIds.includes(id));
        isCorrect = allCorrectSelected;
        score = isCorrect ? question.points : 0;
      }
    } else if (question.type === 'OPEN_TEXT') {
      isCorrect = null;
      score = null;
    }

    const savedAnswer = await this.prisma.testAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: attempt.id,
          questionId: question.id,
        },
      },
      update: {
        textAnswer,
        selectedOptionIds: JSON.stringify(selectedOptionIds),
        isCorrect,
        score,
        answeredAt: now,
      },
      create: {
        attemptId: attempt.id,
        questionId: question.id,
        textAnswer,
        selectedOptionIds: JSON.stringify(selectedOptionIds),
        isCorrect,
        score,
        answeredAt: now,
      },
    });

    return {
      message: 'Жауап сақталды',
      questionId: question.id,
      saved: true,
    };
  }

  private async autoSubmitAttempt(attemptId: string, test: any, manual = false) {
    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
      },
    });
    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return attempt;
    }

    const questions = test.questions || (await this.prisma.testQuestion.findMany({
      where: { testId: test.id },
      include: { options: true },
    }));

    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

    let correctCount = 0;
    let earnedPoints = 0;
    const totalPossible = questions.reduce((sum: number, q: any) => sum + q.points, 0);

    for (const q of questions) {
      const existing = answerMap.get(q.id);
      if (q.type === 'OPEN_TEXT') {
        // Teacher review needed
      } else {
        let isCorrect = false;
        let selectedIds: string[] = [];
        try {
          if (existing?.selectedOptionIds) {
            selectedIds = JSON.parse(existing.selectedOptionIds);
          }
        } catch {
          selectedIds = [];
        }

        if (q.type === 'SINGLE_CHOICE' || q.type === 'TRUE_FALSE') {
          const correctOpt = q.options.find((o: any) => o.isCorrect);
          isCorrect = Boolean(correctOpt && selectedIds[0] === correctOpt.id);
        } else if (q.type === 'MULTIPLE_CHOICE') {
          const correctOptIds = q.options.filter((o: any) => o.isCorrect).map((o: any) => o.id);
          isCorrect = correctOptIds.length === selectedIds.length &&
            correctOptIds.every((id: string) => selectedIds.includes(id));
        }

        const score = isCorrect ? q.points : 0;
        if (isCorrect) correctCount++;
        earnedPoints += score;

        if (existing) {
          await this.prisma.testAnswer.update({
            where: { id: existing.id },
            data: { isCorrect, score },
          });
        } else {
          await this.prisma.testAnswer.create({
            data: {
              attemptId: attempt.id,
              questionId: q.id,
              selectedOptionIds: '[]',
              isCorrect: false,
              score: 0,
            },
          });
        }
      }
    }

    const percentage = totalPossible > 0 ? Math.round((earnedPoints / totalPossible) * 100 * 10) / 10 : 0;
    const now = new Date();
    const isExpired = !manual && now > attempt.expiresAt;

    return this.prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: isExpired ? 'EXPIRED' : 'COMPLETED',
        submittedAt: now,
        score: earnedPoints,
        percentage,
        correctAnswers: correctCount,
        totalQuestions: questions.length,
      },
    });
  }

  async submitTest(userId?: string, testId?: string, attemptId?: string) {
    const student = await this.getStudentProfile(userId);

    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!attempt || attempt.testId !== testId) {
      throw new NotFoundException('Тест әрекеті табылмады');
    }
    if (attempt.studentProfileId !== student.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return {
        message: 'Тест бұрын аяқталған',
        attemptId: attempt.id,
        status: attempt.status,
      };
    }

    const finalized = await this.autoSubmitAttempt(attempt.id, attempt.test, true);

    return {
      message: 'Тест сәтті аяқталды және бағаланды',
      attempt: {
        id: finalized!.id,
        status: finalized!.status,
        score: finalized!.score,
        percentage: finalized!.percentage,
        correctAnswers: finalized!.correctAnswers,
        totalQuestions: finalized!.totalQuestions,
      },
    };
  }

  async getAttemptResult(userId?: string, testId?: string, attemptId?: string) {
    const student = await this.getStudentProfile(userId);

    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: {
              select: { id: true, points: true, type: true },
            },
          },
        },
        answers: {
          include: { question: true },
        },
      },
    });

    if (!attempt || attempt.testId !== testId) {
      throw new NotFoundException('Тест әрекеті табылмады');
    }
    if (attempt.studentProfileId !== student.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    const openAnswers = attempt.answers.filter((a) => a.question.type === 'OPEN_TEXT');
    const pendingOpenTextCount = openAnswers.filter((a) => a.score === null).length;
    const totalPoints = attempt.test.questions.reduce((sum, q) => sum + q.points, 0);

    return {
      message: 'Тест нәтижесі',
      result: {
        testId: attempt.test.id,
        testTitle: attempt.test.title,
        showResultsImmediately: attempt.test.showResultsImmediately,
        status: attempt.status,
        startedAt: attempt.startedAt,
        completedAt: attempt.submittedAt,
        score: attempt.score,
        maxScore: totalPoints,
        percentage: attempt.percentage,
        correctAnswers: attempt.correctAnswers,
        totalQuestions: attempt.totalQuestions,
        pendingOpenTextCount,
      },
    };
  }

  async getAttemptErrors(userId?: string, testId?: string, attemptId?: string) {
    const student = await this.getStudentProfile(userId);

    const attempt = await this.prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: { options: true },
            },
          },
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

    if (!attempt || attempt.testId !== testId) {
      throw new NotFoundException('Тест әрекеті табылмады');
    }
    if (attempt.studentProfileId !== student.id) {
      throw new ForbiddenException('Бұл тестке қолжетімділік жоқ');
    }

    if (!attempt.test.showResultsImmediately) {
      return {
        message: 'Бұл тестте қателерді көру өшірілген',
        errors: [],
        showResultsImmediately: false,
      };
    }

    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

    const errors = attempt.test.questions.map((q) => {
      const studentAns = answerMap.get(q.id);
      let selectedIds: string[] = [];
      try {
        if (studentAns?.selectedOptionIds) {
          selectedIds = JSON.parse(studentAns.selectedOptionIds);
        }
      } catch {
        selectedIds = [];
      }

      if (q.type === 'OPEN_TEXT') {
        return {
          questionId: q.id,
          order: q.order,
          questionText: q.questionText,
          type: q.type,
          studentAnswer: studentAns?.textAnswer || 'Жауап берілмеді',
          correctAnswer: 'Оқытушы тексеруде',
          explanation: q.explanation,
          isCorrect: studentAns?.isCorrect,
          score: studentAns?.score,
          points: q.points,
          isOpenText: true,
        };
      }

      const studentSelectedTexts = q.options
        .filter((o) => selectedIds.includes(o.id))
        .map((o) => o.optionText);

      const correctTexts = q.options
        .filter((o) => o.isCorrect)
        .map((o) => o.optionText);

      return {
        questionId: q.id,
        order: q.order,
        questionText: q.questionText,
        type: q.type,
        studentAnswer: studentSelectedTexts.length > 0 ? studentSelectedTexts.join(', ') : 'Жауап таңдалмады',
        correctAnswer: correctTexts.join(', '),
        explanation: q.explanation,
        isCorrect: studentAns ? studentAns.isCorrect : false,
        score: studentAns?.score || 0,
        points: q.points,
        isOpenText: false,
      };
    });

    return {
      message: 'Тест қателерін талдау',
      showResultsImmediately: true,
      errors,
    };
  }

  // ==========================================
  // ACADEMIC TERM GRADES (RK-1, RK-2, SESSION)
  // ==========================================

  async getStudentGrades(userId?: string) {
    const student = await this.getStudentProfile(userId);

    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
        group: {
          status: 'ACTIVE',
        },
      },
      include: {
        group: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    if (memberships.length === 0) {
      return {
        message: 'Академиялық бағалар мен рейтингтер',
        summary: {
          totalSubjects: 0,
          completedSubjects: 0,
          incompleteSubjects: 0,
          averageRk1: null,
          averageRk2: null,
          averageAdmissionRating: null,
          averageSession: null,
          averageFinalScore: null,
          gpa: null,
        },
        subjects: [],
      };
    }

    const groupIds = memberships.map((m) => m.groupId);

    const termGrades = await this.prisma.termGrade.findMany({
      where: {
        studentId: student.id,
        groupId: { in: groupIds },
      },
    });

    const gradesByGroupId = new Map(termGrades.map((g) => [g.groupId, g]));

    const subjects = memberships.map((membership) => {
      const g = gradesByGroupId.get(membership.groupId);
      const rk1 = g?.rk1 !== undefined ? g.rk1 : null;
      const rk2 = g?.rk2 !== undefined ? g.rk2 : null;
      const session = g?.session !== undefined ? g.session : null;

      const admissionRating = calculateAdmissionRating(rk1, rk2);
      const finalScore = calculateFinalScore(rk1, rk2, session);
      const gradeLetter = getGradeLetter(finalScore, session);
      const status = getGradeStatus(rk1, rk2, session);

      return {
        groupId: membership.group.id,
        groupName: membership.group.name,
        subjectId: membership.group.subject.id,
        subjectName: membership.group.subject.name,
        subjectCode: membership.group.subject.code,
        course: membership.group.course,
        semester: membership.group.semester,
        academicYear: membership.group.academicYear,
        teacher: {
          fullName: membership.group.teacher?.user?.fullName || 'Мұғалім бекітілмеген',
          email: membership.group.teacher?.user?.email || null,
        },
        rk1,
        rk2,
        admissionRating,
        session,
        finalScore,
        gradeLetter,
        status,
        note: g?.note ?? null,
        updatedAt: g?.updatedAt ?? null,
      };
    });

    // Summary calculations
    const rk1Values = subjects.map((s) => s.rk1).filter((v): v is number => v !== null);
    const rk2Values = subjects.map((s) => s.rk2).filter((v): v is number => v !== null);
    const admissionValues = subjects.map((s) => s.admissionRating).filter((v): v is number => v !== null);
    const sessionValues = subjects.map((s) => s.session).filter((v): v is number => v !== null);
    const finalValues = subjects.map((s) => s.finalScore).filter((v): v is number => v !== null);

    const avg = (arr: number[]) =>
      arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

    const gpaPoints = subjects
      .map((s) => getGpaPoints(s.gradeLetter))
      .filter((v): v is number => v !== null);

    const gpa =
      gpaPoints.length > 0
        ? Math.round((gpaPoints.reduce((a, b) => a + b, 0) / gpaPoints.length) * 100) / 100
        : null;

    return {
      message: 'Академиялық бағалар мен рейтингтер',
      summary: {
        totalSubjects: subjects.length,
        completedSubjects: subjects.filter((s) => s.status === 'COMPLETE').length,
        incompleteSubjects: subjects.filter((s) => s.status === 'INCOMPLETE').length,
        averageRk1: avg(rk1Values),
        averageRk2: avg(rk2Values),
        averageAdmissionRating: avg(admissionValues),
        averageSession: avg(sessionValues),
        averageFinalScore: avg(finalValues),
        gpa,
      },
      subjects,
    };
  }
}