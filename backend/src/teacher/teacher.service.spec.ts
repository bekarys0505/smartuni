import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssessmentPeriod } from './dto/term-grade.dto';

describe('TeacherService - Course Content & Groups Management', () => {
  let service: TeacherService;
  let prisma: any;

  const mockTeacherUserId = 'user-teacher-123';
  const mockTeacherProfile = {
    id: 'teacher-profile-123',
    userId: mockTeacherUserId,
    user: { fullName: 'Айдос Оқытушы', email: 'teacher@smartuni.kz' },
    university: { name: 'SmartUni University' },
    faculty: { name: 'IT және Инженерия' },
  };

  const mockSubject = {
    id: 'subject-101',
    name: 'Бағдарламалау негіздері',
    code: 'CS101',
    description: 'Python және алгоритмдер',
  };

  const mockTopic = {
    id: 'topic-201',
    subjectId: 'subject-101',
    title: '1-дәріс: Кіріспе',
    description: 'Негізгі ұғымдар',
    order: 1,
    subject: mockSubject,
  };

  const mockMaterial = {
    id: 'material-301',
    topicId: 'topic-201',
    title: 'Дәріс тезистері',
    description: 'PDF файл',
    type: 'LECTURE',
    contentUrl: '/api/files/lecture1.pdf',
    contentText: 'Кіріспе мәтін',
    order: 1,
    topic: mockTopic,
  };

  beforeEach(async () => {
    prisma = {
      teacherProfile: {
        findUnique: jest.fn(),
      },
      subject: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      group: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      groupMembership: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      joinRequest: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      topic: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn(),
      },
      material: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        aggregate: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      assignmentSubmission: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      assignment: {
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
      test: {
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
      testAttempt: {
        findMany: jest.fn(),
      },
      studentMaterialProgress: {
        deleteMany: jest.fn(),
      },
      attendanceRecord: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      termGrade: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(async (cbOrArray) => {
        if (typeof cbOrArray === 'function') {
          return cbOrArray(prisma);
        }
        return Promise.all(cbOrArray);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TeacherService>(TeacherService);

    // Default mock: teacher profile exists
    prisma.teacherProfile.findUnique.mockResolvedValue(mockTeacherProfile);
  });

  describe('Teacher Authorization & Subject Access', () => {
    it('should throw UnauthorizedException if userId is missing', async () => {
      await expect(service.getSubjectTopics(undefined, 'subject-101')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw NotFoundException if subject does not exist', async () => {
      prisma.subject.findUnique.mockResolvedValue(null);

      await expect(
        service.getSubjectTopics(mockTeacherUserId, 'non-existent-subject'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if teacher does not teach any group in the subject', async () => {
      prisma.subject.findUnique.mockResolvedValue(mockSubject);
      prisma.group.findFirst.mockResolvedValue(null); // No group for this teacher

      await expect(
        service.getSubjectTopics(mockTeacherUserId, 'subject-101'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should grant access when teacher teaches an active group in the subject', async () => {
      prisma.subject.findUnique.mockResolvedValue(mockSubject);
      prisma.group.findFirst.mockResolvedValue({ id: 'group-1', teacherId: mockTeacherProfile.id });
      prisma.topic.findMany.mockResolvedValue([
        {
          ...mockTopic,
          _count: { materials: 2, assignments: 1, tests: 0 },
        },
      ]);

      const result = await service.getSubjectTopics(mockTeacherUserId, 'subject-101');
      expect(result.topics).toHaveLength(1);
      expect(result.topics[0].id).toBe('topic-201');
      expect(result.subject.name).toBe(mockSubject.name);
    });
  });

  describe('Topic Management (CRUD & Reorder)', () => {
    beforeEach(() => {
      prisma.subject.findUnique.mockResolvedValue(mockSubject);
      prisma.group.findFirst.mockResolvedValue({ id: 'group-1', teacherId: mockTeacherProfile.id });
      prisma.topic.findUnique.mockResolvedValue(mockTopic);
    });

    it('should create a topic with calculated order if order is not provided', async () => {
      prisma.topic.aggregate.mockResolvedValue({ _max: { order: 3 } });
      prisma.topic.create.mockResolvedValue({
        id: 'topic-202',
        subjectId: 'subject-101',
        title: '2-дәріс: Шартты операторлар',
        description: 'if-else құрылымдары',
        order: 4,
        createdAt: new Date(),
      });

      const result = await service.createTopic(mockTeacherUserId, 'subject-101', {
        title: '2-дәріс: Шартты операторлар',
        description: 'if-else құрылымдары',
      });

      expect(prisma.topic.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subjectId: 'subject-101',
          title: '2-дәріс: Шартты операторлар',
          order: 4,
        }),
      });
      expect(result.topic.order).toBe(4);
    });

    it('should update topic fields correctly', async () => {
      prisma.topic.update.mockResolvedValue({
        ...mockTopic,
        title: 'Жаңартылған тақырып',
        order: 2,
        updatedAt: new Date(),
      });

      const result = await service.updateTopic(mockTeacherUserId, 'topic-201', {
        title: 'Жаңартылған тақырып',
        order: 2,
      });

      expect(prisma.topic.update).toHaveBeenCalledWith({
        where: { id: 'topic-201' },
        data: {
          title: 'Жаңартылған тақырып',
          order: 2,
        },
      });
      expect(result.topic.title).toBe('Жаңартылған тақырып');
    });

    it('should reorder topics successfully when all topic IDs belong to the subject', async () => {
      prisma.topic.findMany.mockResolvedValue([
        { id: 'topic-201' },
        { id: 'topic-202' },
      ]);

      const result = await service.reorderTopics(mockTeacherUserId, 'subject-101', [
        'topic-202',
        'topic-201',
      ]);

      expect(result.message).toContain('сақталды');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should reject reorder with BadRequestException if a topic ID does not belong to the subject', async () => {
      prisma.topic.findMany.mockResolvedValue([{ id: 'topic-201' }]);

      await expect(
        service.reorderTopics(mockTeacherUserId, 'subject-101', ['topic-201', 'alien-topic-999']),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Topic Deletion Safeguards (Student Submissions Protection)', () => {
    beforeEach(() => {
      prisma.subject.findUnique.mockResolvedValue(mockSubject);
      prisma.group.findFirst.mockResolvedValue({ id: 'group-1', teacherId: mockTeacherProfile.id });
      prisma.topic.findUnique.mockResolvedValue(mockTopic);
    });

    it('should block topic deletion with BadRequestException if student submissions exist', async () => {
      // 5 submissions submitted by students
      prisma.assignmentSubmission.count.mockResolvedValue(5);

      await expect(
        service.deleteTopic(mockTeacherUserId, 'topic-201'),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.topic.delete).not.toHaveBeenCalled();
    });

    it('should unlink tests and delete topic & materials when 0 student submissions exist', async () => {
      prisma.assignmentSubmission.count.mockResolvedValue(0);
      prisma.test.updateMany.mockResolvedValue({ count: 1 });
      prisma.studentMaterialProgress.deleteMany.mockResolvedValue({ count: 0 });
      prisma.material.deleteMany.mockResolvedValue({ count: 2 });
      prisma.assignment.deleteMany.mockResolvedValue({ count: 1 });
      prisma.topic.delete.mockResolvedValue(mockTopic);

      const result = await service.deleteTopic(mockTeacherUserId, 'topic-201');

      // Tests unlinked from topic
      expect(prisma.test.updateMany).toHaveBeenCalledWith({
        where: { topicId: 'topic-201' },
        data: { topicId: null },
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.message).toContain('сәтті өшірілді');
    });
  });

  describe('Learning Materials Management (CRUD & Reorder)', () => {
    beforeEach(() => {
      prisma.subject.findUnique.mockResolvedValue(mockSubject);
      prisma.group.findFirst.mockResolvedValue({ id: 'group-1', teacherId: mockTeacherProfile.id });
      prisma.topic.findUnique.mockResolvedValue(mockTopic);
      prisma.material.findUnique.mockResolvedValue(mockMaterial);
    });

    it('should create a material with specified type and contentUrl', async () => {
      prisma.material.aggregate.mockResolvedValue({ _max: { order: 1 } });
      prisma.material.create.mockResolvedValue({
        ...mockMaterial,
        id: 'material-302',
        title: 'Бейнедәріс 1',
        type: 'VIDEO',
        contentUrl: 'https://youtube.com/watch?v=123',
        order: 2,
        createdAt: new Date(),
      });

      const result = await service.createMaterial(mockTeacherUserId, 'topic-201', {
        title: 'Бейнедәріс 1',
        type: 'VIDEO',
        contentUrl: 'https://youtube.com/watch?v=123',
      });

      expect(prisma.material.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          topicId: 'topic-201',
          title: 'Бейнедәріс 1',
          type: 'VIDEO',
          contentUrl: 'https://youtube.com/watch?v=123',
          order: 2,
        }),
      });
      expect(result.material.type).toBe('VIDEO');
    });

    it('should update material content and text', async () => {
      prisma.material.update.mockResolvedValue({
        ...mockMaterial,
        title: 'Жаңартылған дәріс',
        contentText: 'Толықтырылған мәтін',
        updatedAt: new Date(),
      });

      const result = await service.updateMaterial(mockTeacherUserId, 'material-301', {
        title: 'Жаңартылған дәріс',
        contentText: 'Толықтырылған мәтін',
      });

      expect(prisma.material.update).toHaveBeenCalledWith({
        where: { id: 'material-301' },
        data: {
          title: 'Жаңартылған дәріс',
          contentText: 'Толықтырылған мәтін',
        },
      });
      expect(result.material.title).toBe('Жаңартылған дәріс');
    });

    it('should delete material and related student progress within a transaction', async () => {
      prisma.studentMaterialProgress.deleteMany.mockResolvedValue({ count: 10 });
      prisma.material.delete.mockResolvedValue(mockMaterial);

      const result = await service.deleteMaterial(mockTeacherUserId, 'material-301');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.message).toContain('сәтті өшірілді');
    });

    it('should reorder materials within a topic', async () => {
      prisma.material.findMany.mockResolvedValue([
        { id: 'material-301' },
        { id: 'material-302' },
      ]);

      const result = await service.reorderMaterials(mockTeacherUserId, 'topic-201', [
        'material-302',
        'material-301',
      ]);

      expect(result.message).toContain('сақталды');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if material ID does not belong to the topic during reorder', async () => {
      prisma.material.findMany.mockResolvedValue([{ id: 'material-301' }]);

      await expect(
        service.reorderMaterials(mockTeacherUserId, 'topic-201', [
          'material-301',
          'alien-material-999',
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Teacher Groups & Join Requests Management (Phase 3)', () => {
    const mockGroup = {
      id: 'group-501',
      name: 'IS-23-1',
      subjectId: 'subject-101',
      teacherId: 'teacher-profile-123',
      course: 2,
      capacity: 30,
      semester: 1,
      academicYear: '2026-2027',
      lessonDay: 'Дүйсенбі',
      lessonTime: '14:00',
      classroom: '301',
      status: 'ACTIVE',
      subject: mockSubject,
      _count: {
        memberships: 1,
      },
    };

    const mockAnotherTeacherGroup = {
      ...mockGroup,
      id: 'group-alien-999',
      teacherId: 'another-teacher-profile',
    };

    const mockStudentUser = {
      id: 'user-student-777',
      fullName: 'Арман Студент',
      email: 'arman@smartuni.kz',
      phone: '+77015554433',
    };

    const mockStudentProfile = {
      id: 'student-profile-777',
      userId: mockStudentUser.id,
      user: mockStudentUser,
      course: 2,
      university: { name: 'SmartUni University' },
      faculty: { name: 'IT Факультет' },
      major: { name: 'Ақпараттық жүйелер' },
    };

    const mockJoinRequest = {
      id: 'request-801',
      studentId: mockStudentProfile.id,
      groupId: mockGroup.id,
      status: 'PENDING',
      createdAt: new Date(),
      group: mockGroup,
      student: mockStudentProfile,
    };

    describe('Groups Retrieval and Details', () => {
      it('should return only groups belonging to the authenticated teacher', async () => {
        prisma.group.findMany.mockResolvedValue([mockGroup]);

        const result = await service.getGroups(mockTeacherUserId);
        expect(prisma.group.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { teacherId: mockTeacherProfile.id },
          }),
        );
        expect(result.groups).toHaveLength(1);
        expect(result.groups[0].id).toBe(mockGroup.id);
      });

      it('should return group details with enrolled students and pending requests', async () => {
        prisma.group.findUnique.mockResolvedValue(mockGroup);
        prisma.groupMembership.findMany.mockResolvedValue([
          {
            id: 'membership-1',
            studentId: mockStudentProfile.id,
            groupId: mockGroup.id,
            status: 'ACTIVE',
            joinedAt: new Date(),
            student: mockStudentProfile,
          },
        ]);
        prisma.joinRequest.findMany.mockResolvedValue([mockJoinRequest]);

        const result = await service.getGroupDetails(mockTeacherUserId, mockGroup.id);
        expect(result.group.id).toBe(mockGroup.id);
        expect(result.students).toHaveLength(1);
        expect(result.students[0].fullName).toBe(mockStudentUser.fullName);
        expect(result.pendingRequests).toHaveLength(1);
      });

      it('should block access with ForbiddenException when teacher views another teacher group', async () => {
        prisma.group.findUnique.mockResolvedValue(mockAnotherTeacherGroup);

        await expect(
          service.getGroupDetails(mockTeacherUserId, mockAnotherTeacherGroup.id),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw NotFoundException if group does not exist', async () => {
        prisma.group.findUnique.mockResolvedValue(null);

        await expect(
          service.getGroupDetails(mockTeacherUserId, 'non-existent-group'),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('Group Creation and Mutation', () => {
      it('should create a group successfully when subject exists', async () => {
        prisma.subject.findUnique.mockResolvedValue(mockSubject);
        prisma.group.create.mockResolvedValue(mockGroup);

        const dto = {
          name: 'IS-23-1',
          subjectId: mockSubject.id,
          course: 2,
          semester: 1,
          academicYear: '2026-2027',
          capacity: 30,
        };

        const result = await service.createGroup(mockTeacherUserId, dto);
        expect(prisma.group.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            name: 'IS-23-1',
            teacherId: mockTeacherProfile.id,
            subjectId: mockSubject.id,
          }),
          include: { subject: true },
        });
        expect(result.group.name).toBe('IS-23-1');
      });

      it('should throw NotFoundException on createGroup if subject does not exist', async () => {
        prisma.subject.findUnique.mockResolvedValue(null);

        await expect(
          service.createGroup(mockTeacherUserId, {
            name: 'IS-23-1',
            subjectId: 'invalid-subject',
            course: 2,
            semester: 1,
            academicYear: '2026-2027',
          }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should update group fields when teacher owns the group', async () => {
        prisma.group.findUnique.mockResolvedValue(mockGroup);
        prisma.group.update.mockResolvedValue({
          ...mockGroup,
          name: 'IS-23-1 (Жаңартылған)',
          capacity: 35,
        });

        const result = await service.updateGroup(mockTeacherUserId, mockGroup.id, {
          name: 'IS-23-1 (Жаңартылған)',
          capacity: 35,
        });

        expect(result.group.name).toBe('IS-23-1 (Жаңартылған)');
      });

      it('should block updateGroup with ForbiddenException if teacher is not the owner', async () => {
        prisma.group.findUnique.mockResolvedValue(mockAnotherTeacherGroup);

        await expect(
          service.updateGroup(mockTeacherUserId, mockAnotherTeacherGroup.id, { name: 'Hack' }),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('Group Deletion and Student Removal Safeguards', () => {
      it('should block deleteGroup with BadRequestException if active students exist in group', async () => {
        // mockGroup._count.memberships = 1
        prisma.group.findUnique.mockResolvedValue(mockGroup);

        await expect(
          service.deleteGroup(mockTeacherUserId, mockGroup.id),
        ).rejects.toThrow(BadRequestException);
      });

      it('should delete group when 0 active students exist', async () => {
        const emptyGroup = {
          ...mockGroup,
          _count: { memberships: 0 },
        };
        prisma.group.findUnique.mockResolvedValue(emptyGroup);

        const result = await service.deleteGroup(mockTeacherUserId, emptyGroup.id);
        expect(prisma.$transaction).toHaveBeenCalled();
        expect(result.message).toContain('сәтті өшірілді');
      });

      it('should remove student from group successfully', async () => {
        prisma.group.findUnique.mockResolvedValue(mockGroup);
        prisma.groupMembership.findUnique.mockResolvedValue({
          id: 'membership-1',
          studentId: mockStudentProfile.id,
          groupId: mockGroup.id,
          student: mockStudentProfile,
        });

        const result = await service.removeStudentFromGroup(
          mockTeacherUserId,
          mockGroup.id,
          mockStudentProfile.id,
        );

        expect(prisma.groupMembership.delete).toHaveBeenCalledWith({
          where: { id: 'membership-1' },
        });
        expect(result.message).toContain('топтан шығарылды');
      });

      it('should block removeStudentFromGroup with ForbiddenException on another teacher group', async () => {
        prisma.group.findUnique.mockResolvedValue(mockAnotherTeacherGroup);

        await expect(
          service.removeStudentFromGroup(
            mockTeacherUserId,
            mockAnotherTeacherGroup.id,
            mockStudentProfile.id,
          ),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('Join Requests (Accept, Reject & Duplicate Prevention)', () => {
      it('should accept join request, set status to ACCEPTED, and create active membership in transaction', async () => {
        prisma.joinRequest.findUnique.mockResolvedValue(mockJoinRequest);
        prisma.groupMembership.findUnique.mockResolvedValue(null); // No previous membership
        prisma.groupMembership.count.mockResolvedValue(10); // Capacity 30, so space available

        prisma.joinRequest.update.mockResolvedValue({
          ...mockJoinRequest,
          status: 'ACCEPTED',
          respondedAt: new Date(),
        });
        prisma.groupMembership.create.mockResolvedValue({
          id: 'new-membership-1',
          studentId: mockStudentProfile.id,
          groupId: mockGroup.id,
          status: 'ACTIVE',
          joinedAt: new Date(),
        });

        const result = await service.acceptJoinRequest(mockTeacherUserId, mockJoinRequest.id);

        expect(prisma.$transaction).toHaveBeenCalled();
        expect(result.request.status).toBe('ACCEPTED');
        expect(result.membership.status).toBe('ACTIVE');
      });

      it('should prevent duplicate membership with ConflictException if student is already active', async () => {
        prisma.joinRequest.findUnique.mockResolvedValue(mockJoinRequest);
        // Student already active in this group
        prisma.groupMembership.findUnique.mockResolvedValue({
          id: 'existing-membership-1',
          studentId: mockStudentProfile.id,
          groupId: mockGroup.id,
          status: 'ACTIVE',
        });

        await expect(
          service.acceptJoinRequest(mockTeacherUserId, mockJoinRequest.id),
        ).rejects.toThrow(ConflictException);
      });

      it('should block acceptJoinRequest with ConflictException if group capacity is reached', async () => {
        prisma.joinRequest.findUnique.mockResolvedValue(mockJoinRequest);
        prisma.groupMembership.findUnique.mockResolvedValue(null);
        // Capacity is 30, current students = 30
        prisma.groupMembership.count.mockResolvedValue(30);

        await expect(
          service.acceptJoinRequest(mockTeacherUserId, mockJoinRequest.id),
        ).rejects.toThrow(ConflictException);
      });

      it('should block acceptJoinRequest with ForbiddenException if request belongs to another teacher group', async () => {
        prisma.joinRequest.findUnique.mockResolvedValue({
          ...mockJoinRequest,
          group: mockAnotherTeacherGroup,
        });

        await expect(
          service.acceptJoinRequest(mockTeacherUserId, mockJoinRequest.id),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should reject join request without modifying group memberships', async () => {
        prisma.joinRequest.findUnique.mockResolvedValue(mockJoinRequest);
        prisma.joinRequest.update.mockResolvedValue({
          ...mockJoinRequest,
          status: 'REJECTED',
          respondedAt: new Date(),
        });

        const result = await service.rejectJoinRequest(mockTeacherUserId, mockJoinRequest.id);

        expect(prisma.joinRequest.update).toHaveBeenCalledWith({
          where: { id: mockJoinRequest.id },
          data: expect.objectContaining({ status: 'REJECTED' }),
        });
        expect(prisma.groupMembership.create).not.toHaveBeenCalled();
        expect(prisma.groupMembership.update).not.toHaveBeenCalled();
        expect(result.request.status).toBe('REJECTED');
      });

      it('should throw ConflictException on rejectJoinRequest if request was already processed', async () => {
        prisma.joinRequest.findUnique.mockResolvedValue({
          ...mockJoinRequest,
          status: 'ACCEPTED',
        });

        await expect(
          service.rejectJoinRequest(mockTeacherUserId, mockJoinRequest.id),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('Teacher Electronic Journal & Gradebook', () => {
      const mockJournalGroup = {
        id: 'group-101',
        name: 'CS-201',
        subjectId: 'subject-101',
        teacherId: mockTeacherProfile.id,
        course: 2,
        semester: 3,
        academicYear: '2026-2027',
        subject: mockSubject,
      };

      const mockStudent1 = {
        id: 'student-prof-1',
        userId: 'user-stud-1',
        course: 2,
        avatarUrl: null,
        user: { fullName: 'Алихан Серік', email: 'alikhan@smartuni.kz', phone: '+77011112233' },
      };

      const mockStudent2 = {
        id: 'student-prof-2',
        userId: 'user-stud-2',
        course: 2,
        avatarUrl: null,
        user: { fullName: 'Динара Нұрлан', email: 'dinara@smartuni.kz', phone: '+77022223344' },
      };

      const mockMemberships = [
        { id: 'mem-1', groupId: 'group-101', studentId: 'student-prof-1', status: 'ACTIVE', student: mockStudent1 },
        { id: 'mem-2', groupId: 'group-101', studentId: 'student-prof-2', status: 'ACTIVE', student: mockStudent2 },
      ];

      const mockAssignments = [
        {
          id: 'assign-1',
          topicId: 'topic-201',
          title: 'Тапсырма 1',
          maxScore: 100,
          deadline: new Date('2026-11-01'),
          responseType: 'TEXT',
          topic: { id: 'topic-201', title: '1-дәріс' },
        },
        {
          id: 'assign-2',
          topicId: 'topic-201',
          title: 'Тапсырма 2',
          maxScore: 50,
          deadline: new Date('2026-11-15'),
          responseType: 'FILE',
          topic: { id: 'topic-201', title: '1-дәріс' },
        },
      ];

      const mockTests = [
        {
          id: 'test-1',
          subjectId: 'subject-101',
          topicId: 'topic-201',
          title: 'Тест 1',
          maxScore: 100,
          durationMinutes: 20,
          status: 'PUBLISHED',
          topic: { id: 'topic-201', title: '1-дәріс' },
        },
      ];

      it('should throw BadRequestException if groupId is missing', async () => {
        await expect(service.getGroupJournal(mockTeacherUserId, undefined)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should throw NotFoundException if group does not exist', async () => {
        prisma.group.findUnique.mockResolvedValue(null);

        await expect(service.getGroupJournal(mockTeacherUserId, 'non-existent')).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should throw ForbiddenException if group belongs to another teacher', async () => {
        prisma.group.findUnique.mockResolvedValue({
          ...mockJournalGroup,
          teacherId: 'other-teacher-profile',
        });

        await expect(service.getGroupJournal(mockTeacherUserId, mockJournalGroup.id)).rejects.toThrow(
          ForbiddenException,
        );
      });

      it('should return complete journal matrix and correctly calculate student and group metrics', async () => {
        prisma.group.findUnique.mockResolvedValue(mockJournalGroup);
        prisma.groupMembership.findMany.mockResolvedValue(mockMemberships);
        prisma.assignment.findMany.mockResolvedValue(mockAssignments);
        prisma.test.findMany.mockResolvedValue(mockTests);

        // Student 1:
        // - assign-1: GRADED, 80/100 (80%)
        // - assign-2: SUBMITTED (ungraded), score: null
        // - test-1: COMPLETED, score: 90, percentage: 90%
        // Student 2:
        // - assign-1: NOT_SUBMITTED
        // - assign-2: NOT_SUBMITTED
        // - test-1: NOT_STARTED
        prisma.assignmentSubmission.findMany.mockResolvedValue([
          {
            id: 'sub-1',
            assignmentId: 'assign-1',
            studentId: 'student-prof-1',
            status: 'GRADED',
            score: 80,
            submittedAt: new Date('2026-10-10'),
            gradedAt: new Date('2026-10-11'),
            teacherComment: 'Жақсы орындалған',
          },
          {
            id: 'sub-2',
            assignmentId: 'assign-2',
            studentId: 'student-prof-1',
            status: 'SUBMITTED',
            score: null,
            submittedAt: new Date('2026-10-12'),
            gradedAt: null,
            teacherComment: null,
          },
        ]);

        prisma.testAttempt.findMany.mockResolvedValue([
          {
            id: 'att-1',
            testId: 'test-1',
            studentProfileId: 'student-prof-1',
            status: 'COMPLETED',
            score: 90,
            percentage: 90,
            expiresAt: new Date(Date.now() + 60000),
            startedAt: new Date('2026-10-10'),
            submittedAt: new Date('2026-10-10'),
          },
        ]);

        const result = await service.getGroupJournal(mockTeacherUserId, mockJournalGroup.id);

        expect(result.group.id).toBe(mockJournalGroup.id);
        expect(result.group.name).toBe(mockJournalGroup.name);
        expect(result.summary.totalStudents).toBe(2);
        expect(result.summary.assignmentsCount).toBe(2);
        expect(result.summary.testsCount).toBe(1);

        // Student 1 calculations:
        // graded assignments: assign-1 (80%) -> assignmentsAverage: 80%
        // completed tests: test-1 (90%) -> testsAverage: 90%
        // totalAverage: (80 + 90) / 2 = 85%
        const s1 = result.students.find((s) => s.id === 'student-prof-1');
        expect(s1).toBeDefined();
        expect(s1?.metrics.assignmentsAverage).toBe(80);
        expect(s1?.metrics.testsAverage).toBe(90);
        expect(s1?.metrics.totalAverage).toBe(85);
        expect(s1?.metrics.completedAssignmentsCount).toBe(2); // 1 graded + 1 submitted
        expect(s1?.metrics.completedTestsCount).toBe(1);

        // Student 2 calculations (no graded submissions, no completed tests):
        // averages MUST BE null, NOT 0!
        const s2 = result.students.find((s) => s.id === 'student-prof-2');
        expect(s2).toBeDefined();
        expect(s2?.metrics.assignmentsAverage).toBeNull();
        expect(s2?.metrics.testsAverage).toBeNull();
        expect(s2?.metrics.totalAverage).toBeNull();
        expect(s2?.metrics.completedAssignmentsCount).toBe(0);
        expect(s2?.metrics.completedTestsCount).toBe(0);

        // Group summary:
        // averageScore across students with scores: [85] -> 85%
        expect(result.summary.averageScore).toBe(85);
        // submissionRate: totalPossible = 2 students * (2 assign + 1 test) = 6.
        // submitted work = s1(2 + 1) + s2(0) = 3. 3/6 = 50%
        expect(result.summary.submissionRate).toBe(50);
      });
    });

    describe('Attendance Management', () => {
      const mockAttendanceGroup = {
        id: 'group-att-1',
        name: 'IS-21',
        course: 2,
        semester: 1,
        academicYear: '2026-2027',
        lessonDay: 'Дүйсенбі, Сәрсенбі',
        lessonTime: '10:00-11:30',
        classroom: '305-аудитория',
        teacherId: mockTeacherProfile.id,
        subject: mockSubject,
      };

      const mockMembers = [
        {
          studentId: 'student-prof-1',
          groupId: 'group-att-1',
          status: 'ACTIVE',
          student: {
            id: 'student-prof-1',
            avatarUrl: null,
            user: { id: 'u1', fullName: 'Айбек Серік', email: 'aibek@smartuni.kz' },
          },
        },
        {
          studentId: 'student-prof-2',
          groupId: 'group-att-1',
          status: 'ACTIVE',
          student: {
            id: 'student-prof-2',
            avatarUrl: null,
            user: { id: 'u2', fullName: 'Динара Нұрлан', email: 'dinara@smartuni.kz' },
          },
        },
      ];

      it('getGroupAttendance: should throw NotFoundException if group does not exist', async () => {
        prisma.group.findUnique.mockResolvedValue(null);

        await expect(
          service.getGroupAttendance(mockTeacherUserId, 'non-existent', '2026-10-12'),
        ).rejects.toThrow(NotFoundException);
      });

      it('getGroupAttendance: should throw ForbiddenException if group belongs to another teacher', async () => {
        prisma.group.findUnique.mockResolvedValue({
          ...mockAttendanceGroup,
          teacherId: 'other-teacher-id',
        });

        await expect(
          service.getGroupAttendance(mockTeacherUserId, mockAttendanceGroup.id, '2026-10-12'),
        ).rejects.toThrow(ForbiddenException);
      });

      it('getGroupAttendance: should return roster with correct attendance stats', async () => {
        prisma.group.findUnique.mockResolvedValue(mockAttendanceGroup);
        prisma.groupMembership.findMany.mockResolvedValue(mockMembers);
        prisma.attendanceRecord.findMany
          .mockResolvedValueOnce([
            // Date-specific records
            {
              id: 'att-rec-1',
              studentId: 'student-prof-1',
              groupId: mockAttendanceGroup.id,
              date: new Date('2026-10-12T00:00:00.000Z'),
              status: 'PRESENT',
              note: 'Сабақта белсенді',
              updatedAt: new Date(),
            },
          ])
          .mockResolvedValueOnce([
            // All group records for overall rate
            { status: 'PRESENT', date: new Date('2026-10-12T00:00:00.000Z') },
            { status: 'ABSENT', date: new Date('2026-10-10T00:00:00.000Z') },
          ]);

        const result = await service.getGroupAttendance(
          mockTeacherUserId,
          mockAttendanceGroup.id,
          '2026-10-12',
        );

        expect(result.group.id).toBe(mockAttendanceGroup.id);
        expect(result.date).toBe('2026-10-12');
        expect(result.stats.totalStudents).toBe(2);
        expect(result.stats.presentCount).toBe(1);
        expect(result.stats.unmarkedCount).toBe(1); // student-prof-2 is not yet marked
        expect(result.students).toHaveLength(2);

        const s1 = result.students.find((s) => s.id === 'student-prof-1');
        expect(s1?.status).toBe('PRESENT');
        expect(s1?.note).toBe('Сабақта белсенді');

        const s2 = result.students.find((s) => s.id === 'student-prof-2');
        expect(s2?.status).toBeNull();
      });

      it('saveGroupAttendance: should upsert attendance for active group members only', async () => {
        prisma.group.findUnique.mockResolvedValue(mockAttendanceGroup);
        prisma.groupMembership.findMany.mockResolvedValue([
          { studentId: 'student-prof-1' },
          { studentId: 'student-prof-2' },
        ]);
        prisma.attendanceRecord.upsert.mockResolvedValue({ id: 'upserted-id' });

        const dto = {
          date: '2026-10-12',
          records: [
            { studentId: 'student-prof-1', status: 'PRESENT' as any, note: 'Түсіндірме берді' },
            { studentId: 'student-prof-2', status: 'LATE' as any, note: '10 мин кешікті' },
            { studentId: 'intruder-student', status: 'PRESENT' as any }, // Not in group!
          ],
        };

        const result = await service.saveGroupAttendance(
          mockTeacherUserId,
          mockAttendanceGroup.id,
          dto,
        );

        expect(result.savedCount).toBe(2);
        expect(prisma.$transaction).toHaveBeenCalled();
      });
    });

    describe('Academic Term Grades Management (Phase 11)', () => {
      const mockGradesGroup = {
        id: 'group-grades-1',
        name: 'CS-101',
        subjectId: 'subject-101',
        teacherId: mockTeacherProfile.id,
        course: 1,
        semester: 1,
        academicYear: '2026-2027',
        lessonDay: 'Дүйсенбі',
        lessonTime: '09:00',
        classroom: '301',
        subject: {
          id: 'subject-101',
          name: 'Информатика',
          code: 'CS101',
        },
      };

      const mockGradeMembers = [
        {
          studentId: 'student-prof-1',
          groupId: mockGradesGroup.id,
          status: 'ACTIVE',
          student: {
            id: 'student-prof-1',
            avatarUrl: null,
            user: { id: 'u1', fullName: 'Айбек Серік', email: 'aibek@smartuni.kz' },
          },
        },
        {
          studentId: 'student-prof-2',
          groupId: mockGradesGroup.id,
          status: 'ACTIVE',
          student: {
            id: 'student-prof-2',
            avatarUrl: null,
            user: { id: 'u2', fullName: 'Динара Нұрлан', email: 'dinara@smartuni.kz' },
          },
        },
      ];

      it('getGroupGrades: should throw NotFoundException if group not found', async () => {
        prisma.teacherProfile.findUnique.mockResolvedValue(mockTeacherProfile);
        prisma.group.findUnique.mockResolvedValue(null);

        await expect(
          service.getGroupGrades(mockTeacherUserId, 'non-existent-group'),
        ).rejects.toThrow(NotFoundException);
      });

      it('getGroupGrades: should throw ForbiddenException if group belongs to another teacher', async () => {
        prisma.teacherProfile.findUnique.mockResolvedValue(mockTeacherProfile);
        prisma.group.findUnique.mockResolvedValue({
          ...mockGradesGroup,
          teacherId: 'other-teacher-id',
        });

        await expect(
          service.getGroupGrades(mockTeacherUserId, mockGradesGroup.id),
        ).rejects.toThrow(ForbiddenException);
      });

      it('getGroupGrades: should return group grades and correctly compute metrics without converting null to 0', async () => {
        prisma.teacherProfile.findUnique.mockResolvedValue(mockTeacherProfile);
        prisma.group.findUnique.mockResolvedValue(mockGradesGroup);
        prisma.groupMembership.findMany.mockResolvedValue(mockGradeMembers);
        prisma.termGrade.findMany.mockResolvedValue([
          {
            id: 'tg-1',
            studentId: 'student-prof-1',
            groupId: mockGradesGroup.id,
            subjectId: mockGradesGroup.subjectId,
            rk1: 80,
            rk2: 90,
            session: 85,
            note: 'Жақсы үлгерім',
            updatedAt: new Date(),
          },
          {
            id: 'tg-2',
            studentId: 'student-prof-2',
            groupId: mockGradesGroup.id,
            subjectId: mockGradesGroup.subjectId,
            rk1: 70,
            rk2: null, // Incomplete!
            session: null,
            note: null,
            updatedAt: new Date(),
          },
        ]);

        const result = await service.getGroupGrades(mockTeacherUserId, mockGradesGroup.id);

        expect(result.group.id).toBe(mockGradesGroup.id);
        expect(result.stats.totalStudents).toBe(2);
        expect(result.stats.rk1Count).toBe(2);
        expect(result.stats.rk1Average).toBe(75); // (80 + 70) / 2
        expect(result.stats.rk2Count).toBe(1);
        expect(result.stats.rk2Average).toBe(90);
        expect(result.stats.completeCount).toBe(1);

        const s1 = result.students.find((s) => s.id === 'student-prof-1');
        expect(s1?.admissionRating).toBe(85); // (80 + 90) / 2
        expect(s1?.finalScore).toBe(85); // 0.6 * 85 + 0.4 * 85 = 85
        expect(s1?.gradeLetter).toBe('B+');
        expect(s1?.status).toBe('COMPLETE');

        const s2 = result.students.find((s) => s.id === 'student-prof-2');
        expect(s2?.rk1).toBe(70);
        expect(s2?.rk2).toBeNull();
        expect(s2?.session).toBeNull();
        expect(s2?.admissionRating).toBeNull(); // Missing RK2 must be null, not 35
        expect(s2?.finalScore).toBeNull(); // Missing components must be null, not 0
        expect(s2?.gradeLetter).toBeNull();
        expect(s2?.status).toBe('INCOMPLETE');
      });

      it('saveGroupGrades: should throw ForbiddenException if group belongs to another teacher', async () => {
        prisma.teacherProfile.findUnique.mockResolvedValue(mockTeacherProfile);
        prisma.group.findUnique.mockResolvedValue({
          ...mockGradesGroup,
          teacherId: 'other-teacher-id',
        });

        await expect(
          service.saveGroupGrades(mockTeacherUserId, mockGradesGroup.id, {
            grades: [{ studentId: 'student-prof-1', rk1: 85 }],
          }),
        ).rejects.toThrow(ForbiddenException);
      });

      it('saveGroupGrades: should ignore students who are not active members of the group', async () => {
        prisma.teacherProfile.findUnique.mockResolvedValue(mockTeacherProfile);
        prisma.group.findUnique.mockResolvedValue(mockGradesGroup);
        prisma.groupMembership.findMany.mockResolvedValue([
          { studentId: 'student-prof-1' },
        ]);
        prisma.termGrade.upsert.mockResolvedValue({ id: 'tg-upserted' });

        const result = await service.saveGroupGrades(mockTeacherUserId, mockGradesGroup.id, {
          grades: [
            { studentId: 'student-prof-1', rk1: 90 },
            { studentId: 'unauthorized-student', rk1: 95 },
          ],
        });

        expect(result.savedCount).toBe(1);
        expect(prisma.termGrade.upsert).toHaveBeenCalledTimes(1);
      });

      it('saveGroupGrades: should preserve existing RK2 and Session when updating period RK1', async () => {
        prisma.teacherProfile.findUnique.mockResolvedValue(mockTeacherProfile);
        prisma.group.findUnique.mockResolvedValue(mockGradesGroup);
        prisma.groupMembership.findMany.mockResolvedValue([
          { studentId: 'student-prof-1' },
        ]);

        let capturedUpdate: any = null;
        prisma.termGrade.upsert.mockImplementation((args: any) => {
          capturedUpdate = args.update;
          return Promise.resolve({ id: 'upserted-id' });
        });

        await service.saveGroupGrades(mockTeacherUserId, mockGradesGroup.id, {
          period: AssessmentPeriod.RK1,
          grades: [{ studentId: 'student-prof-1', rk1: 88, note: 'РК1 жаңартылды' }],
        });

        expect(capturedUpdate).toBeDefined();
        expect(capturedUpdate.rk1).toBe(88);
        expect(capturedUpdate.rk2).toBeUndefined(); // Crucial: RK2 not overwritten!
        expect(capturedUpdate.session).toBeUndefined(); // Crucial: Session not overwritten!
        expect(capturedUpdate.note).toBe('РК1 жаңартылды');
      });

      it('saveGroupGrades: should preserve existing RK1 and Session when updating period RK2', async () => {
        prisma.teacherProfile.findUnique.mockResolvedValue(mockTeacherProfile);
        prisma.group.findUnique.mockResolvedValue(mockGradesGroup);
        prisma.groupMembership.findMany.mockResolvedValue([
          { studentId: 'student-prof-1' },
        ]);

        let capturedUpdate: any = null;
        prisma.termGrade.upsert.mockImplementation((args: any) => {
          capturedUpdate = args.update;
          return Promise.resolve({ id: 'upserted-id' });
        });

        await service.saveGroupGrades(mockTeacherUserId, mockGradesGroup.id, {
          period: AssessmentPeriod.RK2,
          grades: [{ studentId: 'student-prof-1', rk2: 92 }],
        });

        expect(capturedUpdate).toBeDefined();
        expect(capturedUpdate.rk2).toBe(92);
        expect(capturedUpdate.rk1).toBeUndefined(); // Crucial: RK1 not overwritten!
        expect(capturedUpdate.session).toBeUndefined(); // Crucial: Session not overwritten!
      });

      it('saveGroupGrades: should preserve existing RK1 and RK2 when updating period SESSION', async () => {
        prisma.teacherProfile.findUnique.mockResolvedValue(mockTeacherProfile);
        prisma.group.findUnique.mockResolvedValue(mockGradesGroup);
        prisma.groupMembership.findMany.mockResolvedValue([
          { studentId: 'student-prof-1' },
        ]);

        let capturedUpdate: any = null;
        prisma.termGrade.upsert.mockImplementation((args: any) => {
          capturedUpdate = args.update;
          return Promise.resolve({ id: 'upserted-id' });
        });

        await service.saveGroupGrades(mockTeacherUserId, mockGradesGroup.id, {
          period: AssessmentPeriod.SESSION,
          grades: [{ studentId: 'student-prof-1', session: 95 }],
        });

        expect(capturedUpdate).toBeDefined();
        expect(capturedUpdate.session).toBe(95);
        expect(capturedUpdate.rk1).toBeUndefined(); // Crucial: RK1 not overwritten!
        expect(capturedUpdate.rk2).toBeUndefined(); // Crucial: RK2 not overwritten!
      });
    });
  });
});


