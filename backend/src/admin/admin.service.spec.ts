import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus } from '../generated/prisma/enums';

describe('AdminService (Phase 5)', () => {
  let adminService: AdminService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      subject: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      group: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      groupMembership: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      studentProfile: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      assignment: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      assignmentSubmission: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      test: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      testAttempt: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    adminService = module.get<AdminService>(AdminService);
  });

  describe('getDashboardStats()', () => {
    it('барлық нақты статистиканы қайтарады', async () => {
      prisma.user.count
        .mockResolvedValueOnce(50) // totalUsers
        .mockResolvedValueOnce(35) // totalStudents
        .mockResolvedValueOnce(12) // totalTeachers
        .mockResolvedValueOnce(3); // totalAdmins

      prisma.subject.count.mockResolvedValueOnce(15);
      prisma.group.count
        .mockResolvedValueOnce(20) // totalGroups
        .mockResolvedValueOnce(18); // activeGroupsCount

      prisma.groupMembership.count.mockResolvedValueOnce(140); // activeMemberships

      const mockRecent = [
        { id: 'u1', fullName: 'Тест Студент', role: UserRole.STUDENT },
      ];
      prisma.user.findMany.mockResolvedValueOnce(mockRecent);

      const res = await adminService.getDashboardStats();

      expect(res.stats.totalUsers).toBe(50);
      expect(res.stats.totalStudents).toBe(35);
      expect(res.stats.totalTeachers).toBe(12);
      expect(res.stats.totalAdmins).toBe(3);
      expect(res.stats.totalSubjects).toBe(15);
      expect(res.stats.totalGroups).toBe(20);
      expect(res.stats.activeGroupsCount).toBe(18);
      expect(res.stats.activeMembershipsCount).toBe(140);
      expect(res.recentUsers).toEqual(mockRecent);
    });
  });

  describe('updateUserRole()', () => {
    it('әкімші өз рөлін өзі өзгерткісі келсе ForbiddenException береді', async () => {
      await expect(
        adminService.updateUserRole('admin-1', 'admin-1', {
          role: UserRole.STUDENT,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('соңғы әкімшінің рөлін өзгертуге тырысқанда BadRequestException береді', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'target-admin',
        role: UserRole.ADMIN,
      });

      prisma.user.count.mockResolvedValue(1); // жалғыз ғана әкімші қалған

      await expect(
        adminService.updateUserRole('caller-admin', 'target-admin', {
          role: UserRole.TEACHER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('рұқсат етілген жағдайда рөл сәтті өзгереді', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'student-1',
        role: UserRole.STUDENT,
      });

      prisma.user.update.mockResolvedValue({
        id: 'student-1',
        fullName: 'Студент Асан',
        role: UserRole.TEACHER,
        status: UserStatus.ACTIVE,
      });

      const res = await adminService.updateUserRole('caller-admin', 'student-1', {
        role: UserRole.TEACHER,
      });

      expect(res.user.role).toBe(UserRole.TEACHER);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'student-1' },
          data: { role: UserRole.TEACHER },
        }),
      );
    });
  });

  describe('updateUserStatus()', () => {
    it('әкімші өз аккаунтын өзі бұғаттауға тырысқанда ForbiddenException береді', async () => {
      await expect(
        adminService.updateUserStatus('admin-1', 'admin-1', {
          status: UserStatus.BLOCKED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('соңғы әкімшіні бұғаттауға тырысқанда BadRequestException береді', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-target',
        role: UserRole.ADMIN,
      });
      prisma.user.count.mockResolvedValue(1); // 1 active admin

      await expect(
        adminService.updateUserStatus('admin-caller', 'admin-target', {
          status: UserStatus.BLOCKED,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUser()', () => {
    it('әкімші өзін өзі жоюға тырысса ForbiddenException береді', async () => {
      await expect(
        adminService.deleteUser('admin-1', 'admin-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('белсенді топтары немесе тапсырмалары бар студентті жоюды бұғаттайды (data integrity)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'student-1',
        role: UserRole.STUDENT,
        studentProfile: {
          memberships: [{ id: 'm1' }],
          assignmentSubmissions: [{ id: 's1' }],
          testAttempts: [],
        },
      });

      await expect(
        adminService.deleteUser('admin-1', 'student-1'),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('байланысқан академиялық деректері жоқ пайдаланушы қауіпсіз жойылады', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'student-empty',
        role: UserRole.STUDENT,
        studentProfile: {
          memberships: [],
          assignmentSubmissions: [],
          testAttempts: [],
        },
      });

      prisma.user.delete.mockResolvedValue({ id: 'student-empty' });

      const res = await adminService.deleteUser('admin-1', 'student-empty');
      expect(res.success).toBe(true);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'student-empty' },
      });
    });
  });

  describe('Subject Management', () => {
    it('қайталанатын пән коды болса ConflictException береді', async () => {
      prisma.subject.findFirst.mockResolvedValue({
        id: 'sub-existing',
        code: 'CS101',
      });

      await expect(
        adminService.createSubject({
          name: 'Информатика',
          code: 'CS101',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('байланысқан топтары немесе материалдары бар пәнді жоюды бұғаттайды', async () => {
      prisma.subject.findUnique.mockResolvedValue({
        id: 'sub-1',
        _count: {
          groups: 3,
          topics: 5,
          tests: 2,
        },
      });

      await expect(adminService.deleteSubject('sub-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.subject.delete).not.toHaveBeenCalled();
    });
  });

  describe('Academic Monitoring & Performance (Phase 8)', () => {
    describe('getAcademicOverview()', () => {
      it('академиялық көрсеткіштер мен топ/пән тізімдерін дұрыс есептеп қайтарады', async () => {
        prisma.studentProfile.count.mockResolvedValue(100);
        prisma.group.count.mockResolvedValue(10);
        prisma.subject.count.mockResolvedValue(8);
        prisma.assignment.count.mockResolvedValue(25);
        prisma.assignmentSubmission.count.mockResolvedValue(200);
        prisma.test.count.mockResolvedValue(12);

        // Graded submissions: 2 subs (80/100 = 80%, 40/50 = 80%) -> avg = 80%
        prisma.assignmentSubmission.findMany.mockResolvedValue([
          { score: 80, assignment: { maxScore: 100 } },
          { score: 40, assignment: { maxScore: 50 } },
        ]);

        // Completed test attempts: 2 attempts (90%, 80%) -> avg = 85%
        prisma.testAttempt.findMany.mockResolvedValue([
          { score: 90, percentage: 90, test: { maxScore: 100 } },
          { score: 8, percentage: 80, test: { maxScore: 10 } },
        ]);

        prisma.groupMembership.findMany.mockResolvedValue([
          { groupId: 'g1', group: { subjectId: 's1' } },
        ]);

        prisma.group.findMany.mockResolvedValue([
          {
            id: 'g1',
            name: 'CS-101',
            course: 1,
            semester: 1,
            academicYear: '2026-2027',
            subject: { id: 's1', name: 'Python', code: 'CS1' },
            teacher: { user: { fullName: 'Оқытушы А.' } },
            _count: { memberships: 25 },
          },
        ]);

        prisma.subject.findMany.mockResolvedValue([
          {
            id: 's1',
            name: 'Python',
            code: 'CS1',
            _count: { groups: 1, topics: 4, tests: 2 },
          },
        ]);

        prisma.assignment.findMany.mockResolvedValue([
          { id: 'a1', topic: { subjectId: 's1' } },
        ]);
        prisma.test.findMany.mockResolvedValue([
          { id: 't1', subjectId: 's1' },
        ]);

        const res = await adminService.getAcademicOverview();

        expect(res.stats.totalStudents).toBe(100);
        expect(res.stats.activeGroupsCount).toBe(10);
        expect(res.stats.totalSubjects).toBe(8);
        expect(res.stats.totalAssignments).toBe(25);
        expect(res.stats.gradedSubmissionsCount).toBe(2);
        expect(res.stats.averageAssignmentScore).toBe(80);
        expect(res.stats.averageTestScore).toBe(85);
        // Overall: [80, 80, 90, 80] -> sum = 330 / 4 = 82.5%
        expect(res.stats.overallAcademicAverage).toBe(82.5);
        expect(res.groupsList.length).toBe(1);
        expect(res.subjectsList.length).toBe(1);
      });

      it('бағаланған жұмыстар болмағанда орташа балл 0 емес, null қайтарады', async () => {
        prisma.studentProfile.count.mockResolvedValue(10);
        prisma.group.count.mockResolvedValue(2);
        prisma.subject.count.mockResolvedValue(2);
        prisma.assignment.count.mockResolvedValue(0);
        prisma.assignmentSubmission.count.mockResolvedValue(0);
        prisma.test.count.mockResolvedValue(0);

        prisma.assignmentSubmission.findMany.mockResolvedValue([]);
        prisma.testAttempt.findMany.mockResolvedValue([]);
        prisma.groupMembership.findMany.mockResolvedValue([]);
        prisma.group.findMany.mockResolvedValue([]);
        prisma.subject.findMany.mockResolvedValue([]);
        prisma.assignment.findMany.mockResolvedValue([]);
        prisma.test.findMany.mockResolvedValue([]);

        const res = await adminService.getAcademicOverview();

        expect(res.stats.averageAssignmentScore).toBeNull();
        expect(res.stats.averageTestScore).toBeNull();
        expect(res.stats.overallAcademicAverage).toBeNull();
        expect(res.stats.submissionRate).toBe(0);
      });
    });

    describe('getAcademicStudents()', () => {
      it('студенттердің үлгерімін есептейді, қайталанған тесттерді бір рет санайды және баға әрпін береді', async () => {
        const mockStudent = {
          id: 'sp-1',
          userId: 'u-1',
          course: 2,
          avatarUrl: null,
          user: {
            id: 'u-1',
            fullName: 'Азамат Серік',
            email: 'azamat@smartuni.kz',
            phone: '+77011234567',
          },
          faculty: { name: 'IT' },
          major: { name: 'CS' },
          memberships: [
            {
              group: {
                id: 'g-1',
                name: 'CS-201',
                course: 2,
                subjectId: 'sub-1',
                subject: { id: 'sub-1', name: 'Алгоритмдер', code: 'CS2' },
                teacher: { user: { fullName: 'Оқытушы Б.' } },
              },
            },
          ],
          assignmentSubmissions: [
            {
              assignmentId: 'assign-1',
              status: 'GRADED',
              score: 90,
              assignment: {
                id: 'assign-1',
                title: 'Тапсырма 1',
                maxScore: 100,
                topic: { subjectId: 'sub-1' },
              },
            },
          ],
          testAttempts: [
            // Student took test twice: attempt 1 (latest) 85%, attempt 2 (old) 60%
            {
              testId: 'test-1',
              status: 'COMPLETED',
              score: 85,
              percentage: 85,
              startedAt: new Date('2026-10-10'),
              test: { id: 'test-1', title: 'Тест 1', maxScore: 100, subjectId: 'sub-1' },
            },
            {
              testId: 'test-1',
              status: 'COMPLETED',
              score: 60,
              percentage: 60,
              startedAt: new Date('2026-10-09'),
              test: { id: 'test-1', title: 'Тест 1', maxScore: 100, subjectId: 'sub-1' },
            },
          ],
        };

        prisma.studentProfile.findMany.mockResolvedValue([mockStudent]);
        prisma.assignment.findMany.mockResolvedValue([
          { id: 'assign-1', title: 'Тапсырма 1', maxScore: 100, topic: { subjectId: 'sub-1' } },
        ]);
        prisma.test.findMany.mockResolvedValue([
          { id: 'test-1', title: 'Тест 1', maxScore: 100, subjectId: 'sub-1' },
        ]);

        const res = await adminService.getAcademicStudents({});

        expect(res.students.length).toBe(1);
        const s = res.students[0];
        expect(s.fullName).toBe('Азамат Серік');
        expect(s.assignmentsStats.gradedCount).toBe(1);
        expect(s.assignmentsStats.averageScore).toBe(90);
        // Test took twice, but only latest (85%) counted
        expect(s.testsStats.completedCount).toBe(1);
        expect(s.testsStats.averageScore).toBe(85);
        // Overall: (90 + 85) / 2 = 87.5% -> Letter: B+
        expect(s.metrics.totalAverage).toBe(87.5);
        expect(s.metrics.gradeLetter).toBe('B+');
      });
    });

    describe('getStudentAcademicDetails()', () => {
      it('студент профилі табылмаса NotFoundException береді', async () => {
        prisma.studentProfile.findUnique.mockResolvedValue(null);

        await expect(
          adminService.getStudentAcademicDetails('non-existent'),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });
});

