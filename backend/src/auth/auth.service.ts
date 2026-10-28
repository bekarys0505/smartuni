import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../generated/prisma/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const {
      fullName,
      phone,
      email,
      password,
      universityId,
      facultyId,
      majorId,
      course,
    } = registerDto;

    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      throw new ConflictException('Бұл email бұрын тіркелген');
    }

    if (phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone },
      });

      if (existingPhone) {
        throw new ConflictException('Бұл телефон нөмірі бұрын тіркелген');
      }
    }

    // Университет, факультет, мамандық байланысын тексеру
    const university = await this.prisma.university.findUnique({
      where: { id: universityId },
    });

    if (!university) {
      throw new BadRequestException('Университет табылмады');
    }

    const faculty = await this.prisma.faculty.findFirst({
      where: {
        id: facultyId,
        universityId,
      },
    });

    if (!faculty) {
      throw new BadRequestException(
        'Факультет көрсетілген университетке тиесілі емес',
      );
    }

    const major = await this.prisma.major.findFirst({
      where: {
        id: majorId,
        facultyId,
      },
    });

    if (!major) {
      throw new BadRequestException(
        'Мамандық көрсетілген факультетке тиесілі емес',
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Студент аккаунтын қауіпсіз құру (қоғамдық тіркелуде рөл қатаң түрде STUDENT)
    const user = await this.prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        passwordHash,
        role: UserRole.STUDENT,
        status: 'ACTIVE',
        studentProfile: {
          create: {
            universityId,
            facultyId,
            majorId,
            course: course || 1,
            premium: false,
          },
        },
      },
      include: {
        studentProfile: {
          include: {
            university: true,
            faculty: true,
            major: true,
          },
        },
      },
    });

    return {
      message: 'Тіркелу сәтті аяқталды',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        studentProfile: user.studentProfile,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        studentProfile: {
          include: {
            university: true,
            faculty: true,
            major: true,
          },
        },
        teacherProfile: {
          include: {
            university: true,
            faculty: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email немесе пароль қате');
    }

    if (user.status === 'BLOCKED') {
      throw new UnauthorizedException('Бұл аккаунт бұғатталған');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email немесе пароль қате');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Жүйеге сәтті кірдіңіз',
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        studentProfile: user.studentProfile,
        teacherProfile: user.teacherProfile,
      },
    };
  }

  async getProfile(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Қолданушы анықталмады');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
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
                    memberships: {
                      where: { status: 'ACTIVE' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Қолданушы табылмады');
    }

    // Role-specific enrichments
    let studentInfo: any = null;
    if (user.role === UserRole.STUDENT && user.studentProfile) {
      const activeGroups = user.studentProfile.memberships.map((m) => ({
        id: m.group.id,
        name: m.group.name,
        course: m.group.course,
        subject: {
          id: m.group.subject.id,
          name: m.group.subject.name,
          code: m.group.subject.code,
        },
      }));

      studentInfo = {
        id: user.studentProfile.id,
        course: user.studentProfile.course,
        avatarUrl: user.studentProfile.avatarUrl,
        premium: user.studentProfile.premium,
        university: user.studentProfile.university
          ? {
              id: user.studentProfile.university.id,
              name: user.studentProfile.university.name,
              shortName: user.studentProfile.university.shortName,
            }
          : null,
        faculty: user.studentProfile.faculty
          ? {
              id: user.studentProfile.faculty.id,
              name: user.studentProfile.faculty.name,
            }
          : null,
        major: user.studentProfile.major
          ? {
              id: user.studentProfile.major.id,
              name: user.studentProfile.major.name,
            }
          : null,
        groups: activeGroups,
      };
    }

    let teacherInfo: any = null;
    if (user.role === UserRole.TEACHER && user.teacherProfile) {
      // Unique subjects taught
      const subjectsMap = new Map<string, { id: string; name: string; code: string | null }>();
      user.teacherProfile.groups.forEach((g) => {
        if (g.subject) {
          subjectsMap.set(g.subject.id, {
            id: g.subject.id,
            name: g.subject.name,
            code: g.subject.code,
          });
        }
      });

      const groups = user.teacherProfile.groups.map((g) => ({
        id: g.id,
        name: g.name,
        course: g.course,
        activeStudentsCount: g._count.memberships,
        subject: {
          id: g.subject.id,
          name: g.subject.name,
          code: g.subject.code,
        },
      }));

      teacherInfo = {
        id: user.teacherProfile.id,
        department: user.teacherProfile.department,
        position: user.teacherProfile.position,
        experience: user.teacherProfile.experience,
        bio: user.teacherProfile.bio,
        avatarUrl: user.teacherProfile.avatarUrl,
        premium: user.teacherProfile.premium,
        university: user.teacherProfile.university
          ? {
              id: user.teacherProfile.university.id,
              name: user.teacherProfile.university.name,
              shortName: user.teacherProfile.university.shortName,
            }
          : null,
        faculty: user.teacherProfile.faculty
          ? {
              id: user.teacherProfile.faculty.id,
              name: user.teacherProfile.faculty.name,
            }
          : null,
        subjects: Array.from(subjectsMap.values()),
        groups,
      };
    }

    return {
      message: 'Профиль деректері',
      profile: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        student: studentInfo,
        teacher: teacherInfo,
      },
    };
  }

  async updateProfile(
    userId: string | undefined,
    dto: {
      fullName?: string;
      phone?: string;
      department?: string;
      position?: string;
      experience?: number;
      bio?: string;
      avatarUrl?: string;
      course?: number;
    },
  ) {
    if (!userId) {
      throw new UnauthorizedException('Қолданушы анықталмады');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Қолданушы табылмады');
    }

    if (dto.phone !== undefined && dto.phone !== user.phone) {
      const trimmedPhone = dto.phone ? dto.phone.trim() : null;
      if (trimmedPhone) {
        const existingPhone = await this.prisma.user.findUnique({
          where: { phone: trimmedPhone },
        });
        if (existingPhone && existingPhone.id !== userId) {
          throw new ConflictException('Бұл телефон нөмірі басқа қолданушыда тіркелген');
        }
      }
    }

    // Atomic update
    await this.prisma.$transaction(async (tx) => {
      // 1. Update User basic allowed fields (fullName, phone)
      const userUpdateData: { fullName?: string; phone?: string | null } = {};
      if (dto.fullName !== undefined) {
        userUpdateData.fullName = dto.fullName.trim();
      }
      if (dto.phone !== undefined) {
        userUpdateData.phone = dto.phone ? dto.phone.trim() : null;
      }

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdateData,
        });
      }

      // 2. Role-specific profile updates
      if (user.role === UserRole.TEACHER && user.teacherProfile) {
        const teacherUpdateData: {
          department?: string;
          position?: string;
          experience?: number;
          bio?: string;
          avatarUrl?: string;
        } = {};

        if (dto.department !== undefined) teacherUpdateData.department = dto.department.trim();
        if (dto.position !== undefined) teacherUpdateData.position = dto.position.trim();
        if (dto.experience !== undefined) teacherUpdateData.experience = dto.experience;
        if (dto.bio !== undefined) teacherUpdateData.bio = dto.bio.trim();
        if (dto.avatarUrl !== undefined) teacherUpdateData.avatarUrl = dto.avatarUrl.trim();

        if (Object.keys(teacherUpdateData).length > 0) {
          await tx.teacherProfile.update({
            where: { id: user.teacherProfile.id },
            data: teacherUpdateData,
          });
        }
      } else if (user.role === UserRole.STUDENT && user.studentProfile) {
        const studentUpdateData: {
          course?: number;
          avatarUrl?: string;
        } = {};

        if (dto.course !== undefined) studentUpdateData.course = dto.course;
        if (dto.avatarUrl !== undefined) studentUpdateData.avatarUrl = dto.avatarUrl.trim();

        if (Object.keys(studentUpdateData).length > 0) {
          await tx.studentProfile.update({
            where: { id: user.studentProfile.id },
            data: studentUpdateData,
          });
        }
      }
    });

    return this.getProfile(userId);
  }

  async changePassword(
    userId: string | undefined,
    dto: { currentPassword: string; newPassword: string },
  ) {
    if (!userId) {
      throw new UnauthorizedException('Қолданушы анықталмады');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Қолданушы табылмады');
    }

    const isCurrentValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentValid) {
      throw new BadRequestException('Қазіргі құпиясөз қате енгізілді');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Жаңа құпиясөз қазіргі құпиясөзбен бірдей болмауы керек');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return {
      message: 'Құпиясөз сәтті жаңартылды',
      success: true,
    };
  }
}