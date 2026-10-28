import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FileService {
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(userId: string | undefined, fileName: string, fileBase64: string, fileSize?: number) {
    if (!fileName || !fileBase64) {
      throw new BadRequestException('Файл атауы мен контенті міндетті');
    }

    const ext = path.extname(fileName).toLowerCase();
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const dangerous = ['.exe', '.bat', '.cmd', '.sh', '.js', '.vbs', '.php', '.msi', '.ps1', '.py', '.scr'];

    if (dangerous.includes(ext) || !allowed.includes(ext)) {
      throw new BadRequestException(
        'Қабылданбайтын файл түрі. Тек PDF, DOC, DOCX, JPG, PNG рұқсат етілген.',
      );
    }

    // Strip data URL scheme if present
    const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('Файл көлемі 10 МБ-тан аспауы керек.');
    }

    const safeBaseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_\-\u0400-\u04FF]/g, '_');
    const userTag = userId ? `u_${userId}_` : '';
    const safeUniqueName = `${Date.now()}_${userTag}${Math.random().toString(36).substring(2, 8)}_${safeBaseName}${ext}`;
    const targetPath = path.join(this.uploadDir, safeUniqueName);

    await fs.promises.writeFile(targetPath, buffer);

    return {
      message: 'Файл сәтті жүктелді',
      url: `/api/files/${safeUniqueName}`,
      fileName,
      fileSize: buffer.length,
    };
  }

  getFilePath(filename: string): string {
    if (
      !filename ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\') ||
      filename.includes('\0') ||
      !/^[a-zA-Z0-9_\-\.\u0400-\u04FF]+$/.test(filename)
    ) {
      throw new BadRequestException('Жарамсыз файл атауы');
    }

    const ext = path.extname(filename).toLowerCase();
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    if (!allowed.includes(ext)) {
      throw new BadRequestException('Қабылданбайтын файл түрі.');
    }

    const fullPath = path.join(this.uploadDir, filename);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Файл табылмады');
    }

    return fullPath;
  }

  async authorizeAndGetFilePath(userId: string | undefined, filename: string): Promise<string> {
    if (!userId) {
      throw new UnauthorizedException('Қолданушы анықталмады. Токен қажет');
    }

    const fullPath = this.getFilePath(filename);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status === 'BLOCKED') {
      throw new UnauthorizedException('Қолданушы анықталмады немесе бұғатталған');
    }

    // 1. ADMIN has global auditing access
    if (user.role === 'ADMIN') {
      return fullPath;
    }

    // 2. Check if file is part of an AssignmentSubmission
    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: {
        fileUrl: { contains: filename },
      },
      include: {
        student: true,
        assignment: {
          include: {
            topic: true,
          },
        },
      },
    });

    if (submission) {
      // Submitting student can access their own submission
      if (submission.student.userId === userId) {
        return fullPath;
      }

      // Teacher teaching the course can access student submissions
      const isTeacherOfSubject = await this.prisma.group.findFirst({
        where: {
          subjectId: submission.assignment.topic.subjectId,
          teacher: { userId },
          status: 'ACTIVE',
        },
      });

      if (isTeacherOfSubject) {
        return fullPath;
      }

      throw new ForbiddenException('Бұл тапсырма файлын көруге рұқсатыңыз жоқ');
    }

    // 3. Check if file is an Assignment attachment
    const assignment = await this.prisma.assignment.findFirst({
      where: {
        attachmentUrl: { contains: filename },
      },
      include: {
        topic: true,
      },
    });

    if (assignment) {
      const subjectId = assignment.topic.subjectId;

      const isTeacher = await this.prisma.group.findFirst({
        where: { subjectId, teacher: { userId }, status: 'ACTIVE' },
      });
      if (isTeacher) return fullPath;

      const isEnrolledStudent = await this.prisma.groupMembership.findFirst({
        where: {
          student: { userId },
          status: 'ACTIVE',
          group: { subjectId, status: 'ACTIVE' },
        },
      });
      if (isEnrolledStudent) return fullPath;

      throw new ForbiddenException('Бұл тапсырма құжатын көруге рұқсатыңыз жоқ');
    }

    // 4. Check if file is a Material content file
    const material = await this.prisma.material.findFirst({
      where: {
        contentUrl: { contains: filename },
      },
      include: {
        topic: true,
      },
    });

    if (material) {
      const subjectId = material.topic.subjectId;

      const isTeacher = await this.prisma.group.findFirst({
        where: { subjectId, teacher: { userId }, status: 'ACTIVE' },
      });
      if (isTeacher) return fullPath;

      const isEnrolledStudent = await this.prisma.groupMembership.findFirst({
        where: {
          student: { userId },
          status: 'ACTIVE',
          group: { subjectId, status: 'ACTIVE' },
        },
      });
      if (isEnrolledStudent) return fullPath;

      throw new ForbiddenException('Бұл оқу материалын көруге рұқсатыңыз жоқ');
    }

    // 5. File not yet submitted to DB (newly uploaded draft)
    if (filename.includes(`_u_${userId}_`)) {
      return fullPath;
    }

    // Teachers can view unlinked draft attachments
    if (user.role === 'TEACHER') {
      return fullPath;
    }

    throw new ForbiddenException('Бұл файлға қолжетімділік рұқсат етілмеген');
  }
}

