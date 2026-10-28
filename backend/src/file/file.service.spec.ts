import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { FileService } from './file.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FileService - Secure File Access and Authorization', () => {
  let service: FileService;
  let prisma: any;

  const uploadDir = path.resolve(process.cwd(), 'uploads');
  const testFile1 = 'test_student_work.pdf';
  const testFile2 = 'test_solution.pdf';

  beforeAll(() => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadDir, testFile1), 'dummy content 1');
    fs.writeFileSync(path.join(uploadDir, testFile2), 'dummy content 2');
  });

  afterAll(() => {
    try {
      if (fs.existsSync(path.join(uploadDir, testFile1))) {
        fs.unlinkSync(path.join(uploadDir, testFile1));
      }
      if (fs.existsSync(path.join(uploadDir, testFile2))) {
        fs.unlinkSync(path.join(uploadDir, testFile2));
      }
    } catch {}
  });

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      assignmentSubmission: {
        findFirst: jest.fn(),
      },
      assignment: {
        findFirst: jest.fn(),
      },
      material: {
        findFirst: jest.fn(),
      },
      group: {
        findFirst: jest.fn(),
      },
      groupMembership: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FileService>(FileService);
  });

  describe('Path traversal and filename validation', () => {
    it('should reject path traversal with ..', () => {
      expect(() => service.getFilePath('../secret.pdf')).toThrow(BadRequestException);
    });

    it('should reject path traversal with forward slash', () => {
      expect(() => service.getFilePath('uploads/secret.pdf')).toThrow(BadRequestException);
    });

    it('should reject path traversal with backward slash', () => {
      expect(() => service.getFilePath('uploads\\secret.pdf')).toThrow(BadRequestException);
    });

    it('should reject unpermitted file extensions (.exe)', () => {
      expect(() => service.getFilePath('malicious.exe')).toThrow(BadRequestException);
    });
  });

  describe('authorizeAndGetFilePath', () => {
    it('should throw UnauthorizedException if userId is undefined', async () => {
      await expect(service.authorizeAndGetFilePath(undefined, testFile1)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should allow ADMIN to access any existing valid file', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-id',
        role: 'ADMIN',
        status: 'ACTIVE',
      });

      const filePath = await service.authorizeAndGetFilePath('admin-id', testFile1);
      expect(filePath).toContain(testFile1);
    });

    it('should allow submitting student to access their own submission file', async () => {
      const studentUserId = 'student-user-1';

      prisma.user.findUnique.mockResolvedValue({
        id: studentUserId,
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      prisma.assignmentSubmission.findFirst.mockResolvedValue({
        id: 'sub-1',
        student: { userId: studentUserId },
        assignment: {
          topic: { subjectId: 'subject-1' },
        },
      });

      const filePath = await service.authorizeAndGetFilePath(studentUserId, testFile2);
      expect(filePath).toContain(testFile2);
    });

    it('should forbid other students from accessing a submission file', async () => {
      const requestingUserId = 'student-attacker-2';
      const ownerUserId = 'student-owner-1';

      prisma.user.findUnique.mockResolvedValue({
        id: requestingUserId,
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      prisma.assignmentSubmission.findFirst.mockResolvedValue({
        id: 'sub-1',
        student: { userId: ownerUserId },
        assignment: {
          topic: { subjectId: 'subject-1' },
        },
      });

      prisma.group.findFirst.mockResolvedValue(null);

      await expect(
        service.authorizeAndGetFilePath(requestingUserId, testFile2),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

