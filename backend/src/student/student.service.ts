import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

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
      throw new NotFoundException(
        'Студент профилі табылмады',
      );
    }

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
      throw new NotFoundException(
        'Студент профилі табылмады',
      );
    }

    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
      },
      include: {
        group: {
          include: {
            subject: true,
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

    return {
      message: 'Студенттің пәндері',
      subjects: memberships.map((membership) => ({
        membershipId: membership.id,

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
          id: membership.group.subject.id,
          name: membership.group.subject.name,
          code: membership.group.subject.code,
          description: membership.group.subject.description,
        },

        teacher: {
          id: membership.group.teacher.id,
          fullName: membership.group.teacher.user.fullName,
        },

        joinedAt: membership.joinedAt,
      })),
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
      throw new NotFoundException(
        'Студент профилі табылмады',
      );
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

        let status:
          | 'AVAILABLE'
          | 'PENDING'
          | 'MEMBER'
          | 'REJECTED' = 'AVAILABLE';

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
          availablePlaces:
            group.capacity - group._count.memberships,

          status,
        };
      }),
    };
  }

  async joinGroup(
    userId?: string,
    groupId?: string,
  ) {
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
      throw new NotFoundException(
        'Студент профилі табылмады',
      );
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
      throw new NotFoundException(
        'Белсенді топ табылмады',
      );
    }

    if (group.course !== student.course) {
      throw new ConflictException(
        'Бұл топ сіздің курсыңызға сәйкес келмейді',
      );
    }

    const existingMembership =
      await this.prisma.groupMembership.findUnique({
        where: {
          studentId_groupId: {
            studentId: student.id,
            groupId: group.id,
          },
        },
      });

    if (
      existingMembership &&
      existingMembership.status === 'ACTIVE'
    ) {
      throw new ConflictException(
        'Сіз бұл топтың мүшесісіз',
      );
    }

    const existingRequest =
      await this.prisma.joinRequest.findFirst({
        where: {
          studentId: student.id,
          groupId: group.id,
          status: 'PENDING',
        },
      });

    if (existingRequest) {
      throw new ConflictException(
        'Бұл топқа қосылу өтініші бұрын жіберілген',
      );
    }

    const currentStudents =
      await this.prisma.groupMembership.count({
        where: {
          groupId: group.id,
          status: 'ACTIVE',
        },
      });

    if (currentStudents >= group.capacity) {
      throw new ConflictException(
        'Бұл топта бос орын жоқ',
      );
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
}