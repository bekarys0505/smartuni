import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  async getJoinRequests(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException(
        'Қолданушы анықталмады',
      );
    }

    const teacher = await this.prisma.teacherProfile.findUnique({
      where: {
        userId,
      },
    });

    if (!teacher) {
      throw new NotFoundException(
        'Мұғалім профилі табылмады',
      );
    }

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

          university: request.student.university.name,
          faculty: request.student.faculty.name,
          major: request.student.major.name,
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

  async acceptJoinRequest(
    userId?: string,
    requestId?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException(
        'Қолданушы анықталмады',
      );
    }

    if (!requestId) {
      throw new NotFoundException(
        'Өтініш көрсетілмеді',
      );
    }

    const teacher =
      await this.prisma.teacherProfile.findUnique({
        where: {
          userId,
        },
      });

    if (!teacher) {
      throw new NotFoundException(
        'Мұғалім профилі табылмады',
      );
    }

    const request =
      await this.prisma.joinRequest.findUnique({
        where: {
          id: requestId,
        },
        include: {
          group: true,
          student: true,
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Өтініш табылмады',
      );
    }

    if (request.group.teacherId !== teacher.id) {
      throw new UnauthorizedException(
        'Бұл өтінішті басқаруға рұқсатыңыз жоқ',
      );
    }

    if (request.status !== 'PENDING') {
      throw new ConflictException(
        'Бұл өтініш бұрын өңделген',
      );
    }

    const existingMembership =
      await this.prisma.groupMembership.findUnique({
        where: {
          studentId_groupId: {
            studentId: request.studentId,
            groupId: request.groupId,
          },
        },
      });

    if (
      existingMembership &&
      existingMembership.status === 'ACTIVE'
    ) {
      throw new ConflictException(
        'Студент бұл топтың мүшесі болып тұр',
      );
    }

    const currentStudents =
      await this.prisma.groupMembership.count({
        where: {
          groupId: request.groupId,
          status: 'ACTIVE',
        },
      });

    if (currentStudents >= request.group.capacity) {
      throw new ConflictException(
        'Бұл топта бос орын жоқ',
      );
    }

    const result =
      await this.prisma.$transaction(async (tx) => {
        const updatedRequest =
          await tx.joinRequest.update({
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
          membership =
            await tx.groupMembership.update({
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
          membership =
            await tx.groupMembership.create({
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
      message:
        'Студенттің топқа қосылу өтініші қабылданды',
      request: {
        id: result.updatedRequest.id,
        status: result.updatedRequest.status,
        respondedAt:
          result.updatedRequest.respondedAt,
      },
      membership: {
        id: result.membership.id,
        status: result.membership.status,
        studentId: result.membership.studentId,
        groupId: result.membership.groupId,
        joinedAt: result.membership.joinedAt,
      },
    };
  }
}