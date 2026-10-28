import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { StudentService } from './student.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from './progress.service';

describe('StudentService - Assignment Submissions Protection', () => {
  let service: StudentService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      studentProfile: {
        findUnique: jest.fn(),
      },
      assignment: {
        findUnique: jest.fn(),
      },
      assignmentSubmission: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      groupMembership: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      material: {
        findMany: jest.fn(),
      },
      termGrade: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProgressService, useValue: {} },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
  });

  it('should reject submission with BadRequestException if assignment was already GRADED', async () => {
    const userId = 'user-student-1';
    const studentId = 'student-profile-1';
    const assignmentId = 'assignment-1';

    // Mock student profile
    prisma.studentProfile.findUnique.mockResolvedValue({
      id: studentId,
      userId,
    });

    // Mock assignment
    prisma.assignment.findUnique.mockResolvedValue({
      id: assignmentId,
      responseType: 'TEXT',
      deadline: null,
      allowLate: true,
      topic: { subjectId: 'subject-1' },
    });

    // Mock subject enrollment
    prisma.groupMembership.findFirst.mockResolvedValue({
      id: 'membership-1',
      status: 'ACTIVE',
    });

    // Mock existing submission with GRADED status
    prisma.assignmentSubmission.findUnique.mockResolvedValue({
      id: 'submission-1',
      assignmentId,
      studentId,
      status: 'GRADED',
      score: 95,
      teacherComment: 'Жақсы орындалған!',
    });

    await expect(
      service.submitAssignment(userId, assignmentId, {
        textAnswer: 'Жаңа жауапты қайта тапсыру әрекеті',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should allow submission if existing submission is SUBMITTED (not yet graded)', async () => {
    const userId = 'user-student-1';
    const studentId = 'student-profile-1';
    const assignmentId = 'assignment-1';

    prisma.studentProfile.findUnique.mockResolvedValue({
      id: studentId,
      userId,
    });

    prisma.assignment.findUnique.mockResolvedValue({
      id: assignmentId,
      responseType: 'TEXT',
      deadline: null,
      allowLate: true,
      topic: { subjectId: 'subject-1' },
    });

    prisma.groupMembership.findFirst.mockResolvedValue({
      id: 'membership-1',
      status: 'ACTIVE',
    });

    // Existing submission is not graded yet
    prisma.assignmentSubmission.findUnique.mockResolvedValue({
      id: 'submission-1',
      assignmentId,
      studentId,
      status: 'SUBMITTED',
      score: null,
    });

    prisma.assignmentSubmission.upsert.mockResolvedValue({
      id: 'submission-1',
      assignmentId,
      studentId,
      status: 'SUBMITTED',
      textAnswer: 'Жаңартылған жауап мәтіні',
    });

    const result = await service.submitAssignment(userId, assignmentId, {
      textAnswer: 'Жаңартылған жауап мәтіні',
    });

    expect(result).toBeDefined();
    expect(result.message).toContain('сәтті жіберілді');
    expect(prisma.assignmentSubmission.upsert).toHaveBeenCalled();
  });

  describe('StudentService - getMaterials (Phase 9)', () => {
    it('should return materials for enrolled subjects with progress status', async () => {
      const userId = 'user-student-1';
      const studentId = 'student-profile-1';

      prisma.studentProfile.findUnique.mockResolvedValue({
        id: studentId,
        userId,
      });

      prisma.groupMembership.findMany.mockResolvedValue([
        {
          id: 'membership-1',
          status: 'ACTIVE',
          group: {
            status: 'ACTIVE',
            subject: { id: 'subject-1', name: 'Математика', code: 'MATH101' },
          },
        },
      ]);

      prisma.material.findMany.mockResolvedValue([
        {
          id: 'mat-1',
          title: '1-дәріс: Кіріспе',
          description: 'Негізгі ұғымдар',
          type: 'LECTURE',
          contentUrl: '/uploads/lecture1.pdf',
          contentText: null,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          topic: {
            id: 'topic-1',
            title: '1-тақырып',
            order: 1,
            subject: { id: 'subject-1', name: 'Математика', code: 'MATH101' },
          },
          progresses: [
            {
              status: 'COMPLETED',
            },
          ],
        },
      ]);

      const result = await service.getMaterials(userId);
      expect(result).toBeDefined();
      expect(result.materials).toHaveLength(1);
      expect(result.materials[0].title).toBe('1-дәріс: Кіріспе');
      expect(result.materials[0].status).toBe('COMPLETED');
      expect(result.subjects).toHaveLength(1);
      expect(result.subjects[0].name).toBe('Математика');
    });

    it('should reject request with ForbiddenException if querying a subject student is not enrolled in', async () => {
      const userId = 'user-student-1';
      const studentId = 'student-profile-1';

      prisma.studentProfile.findUnique.mockResolvedValue({
        id: studentId,
        userId,
      });

      prisma.groupMembership.findMany.mockResolvedValue([
        {
          id: 'membership-1',
          status: 'ACTIVE',
          group: {
            status: 'ACTIVE',
            subject: { id: 'subject-1', name: 'Математика', code: 'MATH101' },
          },
        },
      ]);

      await expect(
        service.getMaterials(userId, { subjectId: 'alien-subject-99' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return empty list if student has no active group memberships', async () => {
      const userId = 'user-student-1';
      const studentId = 'student-profile-1';

      prisma.studentProfile.findUnique.mockResolvedValue({
        id: studentId,
        userId,
      });

      prisma.groupMembership.findMany.mockResolvedValue([]);

      const result = await service.getMaterials(userId);
      expect(result.materials).toEqual([]);
      expect(result.subjects).toEqual([]);
    });
  });

  describe('Student Academic Term Grades (getStudentGrades)', () => {
    it('should throw NotFoundException if student profile does not exist', async () => {
      prisma.studentProfile.findUnique.mockResolvedValue(null);

      await expect(service.getStudentGrades('non-existent-user')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty summary structure if student has no active group memberships', async () => {
      const userId = 'user-student-1';
      const studentId = 'student-profile-1';

      prisma.studentProfile.findUnique.mockResolvedValue({
        id: studentId,
        userId,
      });

      prisma.groupMembership.findMany.mockResolvedValue([]);

      const result = await service.getStudentGrades(userId);

      expect(result.summary.totalSubjects).toBe(0);
      expect(result.summary.gpa).toBeNull();
      expect(result.subjects).toEqual([]);
    });

    it('should return grades and compute simple arithmetic GPA without converting null into 0', async () => {
      const userId = 'user-student-1';
      const studentId = 'student-profile-1';

      prisma.studentProfile.findUnique.mockResolvedValue({
        id: studentId,
        userId,
      });

      const mockMemberships = [
        {
          id: 'membership-1',
          groupId: 'group-1',
          studentId,
          status: 'ACTIVE',
          group: {
            id: 'group-1',
            name: 'CS-101',
            course: 1,
            semester: 1,
            academicYear: '2026-2027',
            subject: { id: 'subj-1', name: 'Бағдарламалау', code: 'CS101' },
            teacher: { user: { fullName: 'Айдос Мұғалім', email: 'teacher1@smartuni.kz' } },
          },
        },
        {
          id: 'membership-2',
          groupId: 'group-2',
          studentId,
          status: 'ACTIVE',
          group: {
            id: 'group-2',
            name: 'MATH-101',
            course: 1,
            semester: 1,
            academicYear: '2026-2027',
            subject: { id: 'subj-2', name: 'Математика', code: 'MATH101' },
            teacher: { user: { fullName: 'Берік Мұғалім', email: 'teacher2@smartuni.kz' } },
          },
        },
      ];

      prisma.groupMembership.findMany.mockResolvedValue(mockMemberships);

      prisma.termGrade.findMany.mockResolvedValue([
        {
          id: 'tg-1',
          studentId,
          groupId: 'group-1',
          subjectId: 'subj-1',
          rk1: 90,
          rk2: 90,
          session: 95, // Admission = 90, Final = 0.6*90 + 0.4*95 = 92 -> Letter: 'A-' (GPA 3.67)
          note: 'Керемет',
          updatedAt: new Date(),
        },
        {
          id: 'tg-2',
          studentId,
          groupId: 'group-2',
          subjectId: 'subj-2',
          rk1: 80,
          rk2: null, // Incomplete! Admission = null, Final = null, Letter = null
          session: null,
          note: null,
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getStudentGrades(userId);

      expect(result.summary.totalSubjects).toBe(2);
      expect(result.summary.completedSubjects).toBe(1);
      expect(result.summary.incompleteSubjects).toBe(1);
      // GPA is computed from graded subjects with letters (subj-1 has A- = 3.67)
      expect(result.summary.gpa).toBe(3.67);

      const subj1 = result.subjects.find((s) => s.groupId === 'group-1');
      expect(subj1?.admissionRating).toBe(90);
      expect(subj1?.finalScore).toBe(92);
      expect(subj1?.gradeLetter).toBe('A-');
      expect(subj1?.status).toBe('COMPLETE');

      const subj2 = result.subjects.find((s) => s.groupId === 'group-2');
      expect(subj2?.rk1).toBe(80);
      expect(subj2?.rk2).toBeNull();
      expect(subj2?.session).toBeNull();
      expect(subj2?.admissionRating).toBeNull(); // Missing RK2 must remain null, NOT 40
      expect(subj2?.finalScore).toBeNull(); // Incomplete must remain null, NOT 0
      expect(subj2?.gradeLetter).toBeNull();
      expect(subj2?.status).toBe('INCOMPLETE');
    });
  });
});
