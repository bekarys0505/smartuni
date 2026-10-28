import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../generated/prisma/enums';

describe('AuthService - Profile & Security (Phase 4)', () => {
  let authService: AuthService;
  let prisma: any;
  let jwtService: any;

  const mockStudentUser = {
    id: 'student-user-1',
    fullName: 'Әлішер Студент',
    email: 'alisher@smartuni.kz',
    phone: '+77011234567',
    passwordHash: '$2b$12$somehashedpasswordstudent',
    role: UserRole.STUDENT,
    status: 'ACTIVE',
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-01T00:00:00Z'),
    studentProfile: {
      id: 'student-profile-1',
      userId: 'student-user-1',
      course: 2,
      avatarUrl: null,
      premium: false,
      university: {
        id: 'uni-1',
        name: 'SmartUni Ұлттық Университеті',
        shortName: 'SmartUni',
      },
      faculty: {
        id: 'fac-1',
        name: 'Ақпараттық технологиялар',
      },
      major: {
        id: 'maj-1',
        name: 'Бағдарламалық қамтамасыз ету',
      },
      memberships: [
        {
          id: 'mem-1',
          status: 'ACTIVE',
          group: {
            id: 'grp-1',
            name: 'CS-201',
            course: 2,
            subject: {
              id: 'sub-1',
              name: 'Алгоритмдер және деректер құрылымы',
              code: 'CS201',
            },
          },
        },
      ],
    },
    teacherProfile: null,
  };

  const mockTeacherUser = {
    id: 'teacher-user-1',
    fullName: 'Ернар Оқытушы',
    email: 'ernar@smartuni.kz',
    phone: '+77029876543',
    passwordHash: '$2b$12$somehashedpasswordteacher',
    role: UserRole.TEACHER,
    status: 'ACTIVE',
    createdAt: new Date('2026-08-15T00:00:00Z'),
    updatedAt: new Date('2026-08-15T00:00:00Z'),
    studentProfile: null,
    teacherProfile: {
      id: 'teacher-profile-1',
      userId: 'teacher-user-1',
      department: 'Информатика кафедрасы',
      position: 'Аға оқытушы',
      experience: 8,
      bio: 'Жасанды интеллект және алгоритмдер бойынша дәріскер',
      avatarUrl: null,
      premium: true,
      university: {
        id: 'uni-1',
        name: 'SmartUni Ұлттық Университеті',
        shortName: 'SmartUni',
      },
      faculty: {
        id: 'fac-1',
        name: 'Ақпараттық технологиялар',
      },
      groups: [
        {
          id: 'grp-1',
          name: 'CS-201',
          course: 2,
          subject: {
            id: 'sub-1',
            name: 'Алгоритмдер және деректер құрылымы',
            code: 'CS201',
          },
          _count: {
            memberships: 25,
          },
        },
      ],
    },
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      teacherProfile: {
        update: jest.fn(),
      },
      studentProfile: {
        update: jest.fn(),
      },
      university: {
        findUnique: jest.fn(),
      },
      faculty: {
        findFirst: jest.fn(),
      },
      major: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        return cb(prisma);
      }),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('getProfile()', () => {
    it('қолданушы өзінің профилін толық және қауіпсіз көре алады (passwordHash жоқ)', async () => {
      prisma.user.findUnique.mockResolvedValue(mockStudentUser);

      const result = await authService.getProfile(mockStudentUser.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockStudentUser.id },
        }),
      );

      expect(result.profile).toBeDefined();
      expect(result.profile.id).toBe(mockStudentUser.id);
      expect(result.profile.fullName).toBe(mockStudentUser.fullName);
      expect(result.profile.email).toBe(mockStudentUser.email);
      expect(result.profile.role).toBe(UserRole.STUDENT);
      expect(result.profile.student).toBeDefined();
      expect(result.profile.student.university.name).toBe('SmartUni Ұлттық Университеті');
      expect(result.profile.student.groups).toHaveLength(1);

      // ЖАУАПТА PASSWORDHASH ЖӘНЕ ҚҰПИЯ ӨРІСТЕР БОЛМАУЫ ТИІС
      expect((result.profile as any).passwordHash).toBeUndefined();
    });

    it('мұғалім өзінің профилін, оқытатын пәндері мен топтарын көре алады', async () => {
      prisma.user.findUnique.mockResolvedValue(mockTeacherUser);

      const result = await authService.getProfile(mockTeacherUser.id);

      expect(result.profile.id).toBe(mockTeacherUser.id);
      expect(result.profile.role).toBe(UserRole.TEACHER);
      expect(result.profile.teacher).toBeDefined();
      expect(result.profile.teacher.department).toBe('Информатика кафедрасы');
      expect(result.profile.teacher.subjects).toHaveLength(1);
      expect(result.profile.teacher.subjects[0].name).toBe('Алгоритмдер және деректер құрылымы');
      expect(result.profile.teacher.groups[0].activeStudentsCount).toBe(25);

      // ЖАУАПТА PASSWORDHASH БОЛМАУЫ ТИІС
      expect((result.profile as any).passwordHash).toBeUndefined();
    });

    it('userId анықталмаса немесе жоқ болса UnauthorizedException лақтырады', async () => {
      await expect(authService.getProfile(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('пайдаланушы базада табылмаса UnauthorizedException лақтырады', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getProfile('non-existent-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateProfile()', () => {
    it('пайдаланушы рұқсат етілген өрістерді (fullName, phone) жаңарта алады', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(mockStudentUser) // first check in updateProfile
        .mockResolvedValueOnce(null) // phone collision check
        .mockResolvedValueOnce({
          ...mockStudentUser,
          fullName: 'Әлішер Серікұлы',
          phone: '+77019998877',
        }); // second check in getProfile

      const result = await authService.updateProfile(mockStudentUser.id, {
        fullName: '  Әлішер Серікұлы  ',
        phone: '+77019998877',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockStudentUser.id },
        data: {
          fullName: 'Әлішер Серікұлы',
          phone: '+77019998877',
        },
      });

      expect(result.profile.fullName).toBe('Әлішер Серікұлы');
    });

    it('мұғалім кафедрасы, лауазымы, өмірбаяны және тәжірибесін қауіпсіз жаңарта алады', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(mockTeacherUser)
        .mockResolvedValueOnce({
          ...mockTeacherUser,
          teacherProfile: {
            ...mockTeacherUser.teacherProfile,
            department: 'Жасанды интеллект кафедрасы',
            position: 'Қауымдастырылған профессор',
            experience: 10,
          },
        });

      await authService.updateProfile(mockTeacherUser.id, {
        department: 'Жасанды интеллект кафедрасы',
        position: 'Қауымдастырылған профессор',
        experience: 10,
      });

      expect(prisma.teacherProfile.update).toHaveBeenCalledWith({
        where: { id: mockTeacherUser.teacherProfile.id },
        data: {
          department: 'Жасанды интеллект кафедрасы',
          position: 'Қауымдастырылған профессор',
          experience: 10,
        },
      });
    });

    it('телефон нөмірі басқа пайдаланушыда болса ConflictException лақтырады', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(mockStudentUser)
        .mockResolvedValueOnce({ id: 'another-user-id', phone: '+77011112233' }); // collision!

      await expect(
        authService.updateProfile(mockStudentUser.id, {
          phone: '+77011112233',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('қорғалған өрістер (role, passwordHash, email, emailVerified) клиенттен келсе де өзгертілмейді', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(mockStudentUser)
        .mockResolvedValueOnce({
          ...mockStudentUser,
          fullName: 'Жаңа Аты',
        });

      // Жасанды dto шабуылы (клиент рөлді ADMIN қылуға немесе email ауыстыруға тырысты)
      const maliciousDto: any = {
        fullName: 'Жаңа Аты',
        role: 'ADMIN',
        email: 'hacked@smartuni.kz',
        passwordHash: 'hacked_hash',
      };

      await authService.updateProfile(mockStudentUser.id, maliciousDto);

      // Update тек fullName өрісіне ғана рұқсат берді
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockStudentUser.id },
        data: {
          fullName: 'Жаңа Аты',
        },
      });
    });
  });

  describe('changePassword()', () => {
    it('қазіргі құпиясөз қате болса, құпиясөз өзгермейді және BadRequestException береді', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: await bcrypt.hash('CorrectPassword123', 12),
      });

      await expect(
        authService.changePassword('user-1', {
          currentPassword: 'WrongPassword123',
          newPassword: 'NewValidPassword123',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('жаңа құпиясөз қазіргі құпиясөзбен бірдей болса BadRequestException береді', async () => {
      const currentPass = 'SamePassword123';
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: await bcrypt.hash(currentPass, 12),
      });

      await expect(
        authService.changePassword('user-1', {
          currentPassword: currentPass,
          newPassword: currentPass,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('құпиясөз дұрыс берілсе, жаңа құпиясөз bcrypt арқылы қауіпсіз хештеліп сақталады', async () => {
      const oldPass = 'OldSecretPass123';
      const newPass = 'NewSecretPass456';

      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: await bcrypt.hash(oldPass, 12),
      });

      prisma.user.update.mockResolvedValue({ id: 'user-1' });

      const result = await authService.changePassword('user-1', {
        currentPassword: oldPass,
        newPassword: newPass,
      });

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            passwordHash: expect.any(String),
          }),
        }),
      );

      // Хештің жаңа құпиясөзге сәйкес келетінін тексеру
      const updatedHash = prisma.user.update.mock.calls[0][0].data.passwordHash;
      expect(updatedHash).not.toBe(newPass); // ашық күйде сақталмаған
      const isMatch = await bcrypt.compare(newPass, updatedHash);
      expect(isMatch).toBe(true);
    });
  });
});

