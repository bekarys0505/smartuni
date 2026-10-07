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
}