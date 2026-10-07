import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const ACADEMIC_WEIGHTS = {
  ASSIGNMENT: 0.4, // 40%
  TEST: 0.6,       // 60%
};

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  private async getStudentProfile(userId?: string) {
    if (!userId) {
      throw new NotFoundException('Қолданушы анықталмады');
    }
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new NotFoundException('Студент профилі табылмады');
    }
    return student;
  }

  private async getStudentActiveSubjectIds(studentId: string): Promise<string[]> {
    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        studentId,
        status: 'ACTIVE',
        group: {
          status: 'ACTIVE',
        },
      },
      select: {
        group: {
          select: {
            subjectId: true,
          },
        },
      },
    });

    return Array.from(new Set(memberships.map((m) => m.group.subjectId)));
  }

  /**
   * Helper: round floating percentage safely to 0-100 integer
   */
  private roundPercentage(val: number): number {
    if (isNaN(val) || !isFinite(val)) return 0;
    return Math.min(100, Math.max(0, Math.round(val)));
  }

  /**
   * 1. Learning Progress Calculation across all student's active subjects
   */
  async getLearningProgress(userId?: string) {
    const student = await this.getStudentProfile(userId);
    const subjectIds = await this.getStudentActiveSubjectIds(student.id);

    if (subjectIds.length === 0) {
      return {
        overall: 0,
        totalMaterials: 0,
        completedMaterials: 0,
        lectures: { total: 0, completed: 0, percentage: 0 },
        videos: { total: 0, completed: 0, percentage: 0 },
        additionalResources: { total: 0, completed: 0, percentage: 0 },
      };
    }

    // Get all materials in active subjects
    const materials = await this.prisma.material.findMany({
      where: {
        topic: {
          subjectId: { in: subjectIds },
        },
      },
      select: {
        id: true,
        type: true,
      },
    });

    const materialIds = materials.map((m) => m.id);

    // Get student's completed materials
    const completedProgresses = await this.prisma.studentMaterialProgress.findMany({
      where: {
        studentId: student.id,
        materialId: { in: materialIds },
        status: 'COMPLETED',
      },
      select: {
        materialId: true,
      },
    });

    const completedMaterialIds = new Set(completedProgresses.map((p) => p.materialId));

    const totalMaterials = materials.length;
    const completedMaterials = completedMaterialIds.size;
    const overall = totalMaterials > 0 ? this.roundPercentage((completedMaterials / totalMaterials) * 100) : 0;

    // Breakdown by type
    const lectures = materials.filter((m) => m.type === 'LECTURE');
    const videos = materials.filter((m) => m.type === 'VIDEO');
    const additional = materials.filter((m) => m.type === 'ADDITIONAL_RESOURCE');

    const completedLectures = lectures.filter((m) => completedMaterialIds.has(m.id)).length;
    const completedVideos = videos.filter((m) => completedMaterialIds.has(m.id)).length;
    const completedAdditional = additional.filter((m) => completedMaterialIds.has(m.id)).length;

    return {
      overall,
      totalMaterials,
      completedMaterials,
      lectures: {
        total: lectures.length,
        completed: completedLectures,
        percentage: lectures.length > 0 ? this.roundPercentage((completedLectures / lectures.length) * 100) : 0,
      },
      videos: {
        total: videos.length,
        completed: completedVideos,
        percentage: videos.length > 0 ? this.roundPercentage((completedVideos / videos.length) * 100) : 0,
      },
      additionalResources: {
        total: additional.length,
        completed: completedAdditional,
        percentage: additional.length > 0 ? this.roundPercentage((completedAdditional / additional.length) * 100) : 0,
      },
    };
  }

  /**
   * 2. Academic Results Calculation across all student's active subjects
   */
  async getAcademicResults(userId?: string) {
    const student = await this.getStudentProfile(userId);
    const subjectIds = await this.getStudentActiveSubjectIds(student.id);

    if (subjectIds.length === 0) {
      return {
        assignmentAverage: 0,
        testAverage: 0,
        academicScore: 0,
        assignment: { available: false, average: 0 },
        test: { available: false, average: 0 },
        rk1: { available: false, score: null },
        rk2: { available: false, score: null },
        semester: { available: false, score: null },
      };
    }

    // A) Assignments: graded submissions
    const gradedSubmissions = await this.prisma.assignmentSubmission.findMany({
      where: {
        studentId: student.id,
        status: 'GRADED',
        score: { not: null },
        assignment: {
          topic: {
            subjectId: { in: subjectIds },
          },
        },
      },
      include: {
        assignment: {
          select: { maxScore: true },
        },
      },
    });

    let assignmentAvg: number | null = null;
    if (gradedSubmissions.length > 0) {
      const percentages = gradedSubmissions.map((s) => {
        const max = s.assignment.maxScore > 0 ? s.assignment.maxScore : 100;
        return (Number(s.score) / max) * 100;
      });
      const sum = percentages.reduce((acc, p) => acc + p, 0);
      assignmentAvg = sum / percentages.length;
    }

    // B) Tests: completed attempts
    const completedAttempts = await this.prisma.testAttempt.findMany({
      where: {
        studentProfileId: student.id,
        status: { in: ['COMPLETED', 'EXPIRED'] },
        percentage: { not: null },
        test: {
          subjectId: { in: subjectIds },
          status: 'PUBLISHED',
        },
      },
      orderBy: { startedAt: 'desc' },
      select: {
        testId: true,
        percentage: true,
      },
    });

    // Use latest attempt per test
    const latestAttemptByTestId = new Map<string, number>();
    for (const att of completedAttempts) {
      if (!latestAttemptByTestId.has(att.testId) && att.percentage !== null) {
        latestAttemptByTestId.set(att.testId, Number(att.percentage));
      }
    }

    let testAvg: number | null = null;
    const testPercentages = Array.from(latestAttemptByTestId.values());
    if (testPercentages.length > 0) {
      const sum = testPercentages.reduce((acc, p) => acc + p, 0);
      testAvg = sum / testPercentages.length;
    }

    // C) Weighted Academic Score Calculation
    let academicScore = 0;
    if (assignmentAvg !== null && testAvg !== null) {
      academicScore =
        assignmentAvg * ACADEMIC_WEIGHTS.ASSIGNMENT +
        testAvg * ACADEMIC_WEIGHTS.TEST;
    } else if (assignmentAvg !== null) {
      academicScore = assignmentAvg;
    } else if (testAvg !== null) {
      academicScore = testAvg;
    } else {
      academicScore = 0;
    }

    return {
      assignmentAverage: assignmentAvg !== null ? this.roundPercentage(assignmentAvg) : 0,
      testAverage: testAvg !== null ? this.roundPercentage(testAvg) : 0,
      academicScore: this.roundPercentage(academicScore),
      assignment: {
        available: assignmentAvg !== null,
        average: assignmentAvg !== null ? this.roundPercentage(assignmentAvg) : 0,
      },
      test: {
        available: testAvg !== null,
        average: testAvg !== null ? this.roundPercentage(testAvg) : 0,
      },
      // Future module integrations:
      rk1: { available: false, score: null },
      rk2: { available: false, score: null },
      semester: { available: false, score: null },
    };
  }

  /**
   * 3. Subject-level progress for all accessible subjects
   */
  async getSubjectsProgress(userId?: string) {
    const student = await this.getStudentProfile(userId);
    const subjectIds = await this.getStudentActiveSubjectIds(student.id);

    if (subjectIds.length === 0) {
      return [];
    }

    const subjects = await this.prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      orderBy: { name: 'asc' },
    });

    const results = await Promise.all(
      subjects.map(async (subj) => {
        return this.calculateSingleSubjectProgress(student.id, subj);
      }),
    );

    return results;
  }

  /**
   * 4. Single Subject Detail Progress
   */
  async getSubjectProgress(userId?: string, subjectId?: string) {
    const student = await this.getStudentProfile(userId);

    if (!subjectId) {
      throw new NotFoundException('Пән ID көрсетілмеген');
    }

    // Access control check
    const activeSubjectIds = await this.getStudentActiveSubjectIds(student.id);
    if (!activeSubjectIds.includes(subjectId)) {
      throw new ForbiddenException('Бұл пәнге қолжетімділік жоқ');
    }

    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundException('Пән табылмады');
    }

    return this.calculateSingleSubjectProgress(student.id, subject);
  }

  private async calculateSingleSubjectProgress(studentId: string, subject: any) {
    // 1) Learning materials in subject
    const materials = await this.prisma.material.findMany({
      where: {
        topic: { subjectId: subject.id },
      },
      select: {
        id: true,
        type: true,
      },
    });

    const materialIds = materials.map((m) => m.id);

    const completedProgresses = await this.prisma.studentMaterialProgress.findMany({
      where: {
        studentId,
        materialId: { in: materialIds },
        status: 'COMPLETED',
      },
      select: { materialId: true },
    });

    const completedMaterialIds = new Set(completedProgresses.map((p) => p.materialId));
    const totalMaterials = materials.length;
    const completedMaterials = completedMaterialIds.size;
    const percentage = totalMaterials > 0 ? this.roundPercentage((completedMaterials / totalMaterials) * 100) : 0;

    const lectures = materials.filter((m) => m.type === 'LECTURE');
    const videos = materials.filter((m) => m.type === 'VIDEO');
    const additional = materials.filter((m) => m.type === 'ADDITIONAL_RESOURCE');

    // 2) Graded assignments in subject
    const gradedSubmissions = await this.prisma.assignmentSubmission.findMany({
      where: {
        studentId,
        status: 'GRADED',
        score: { not: null },
        assignment: {
          topic: { subjectId: subject.id },
        },
      },
      include: {
        assignment: { select: { maxScore: true } },
      },
    });

    let assignmentAvg: number | null = null;
    if (gradedSubmissions.length > 0) {
      const percentages = gradedSubmissions.map((s) => {
        const max = s.assignment.maxScore > 0 ? s.assignment.maxScore : 100;
        return (Number(s.score) / max) * 100;
      });
      const sum = percentages.reduce((acc, p) => acc + p, 0);
      assignmentAvg = sum / percentages.length;
    }

    // 3) Tests in subject
    const completedAttempts = await this.prisma.testAttempt.findMany({
      where: {
        studentProfileId: studentId,
        status: { in: ['COMPLETED', 'EXPIRED'] },
        percentage: { not: null },
        test: {
          subjectId: subject.id,
          status: 'PUBLISHED',
        },
      },
      orderBy: { startedAt: 'desc' },
      select: {
        testId: true,
        percentage: true,
      },
    });

    const latestAttemptByTestId = new Map<string, number>();
    for (const att of completedAttempts) {
      if (!latestAttemptByTestId.has(att.testId) && att.percentage !== null) {
        latestAttemptByTestId.set(att.testId, Number(att.percentage));
      }
    }

    let testAvg: number | null = null;
    const testPercentages = Array.from(latestAttemptByTestId.values());
    if (testPercentages.length > 0) {
      const sum = testPercentages.reduce((acc, p) => acc + p, 0);
      testAvg = sum / testPercentages.length;
    }

    // 4) Weighted academic score
    let academicScore = 0;
    if (assignmentAvg !== null && testAvg !== null) {
      academicScore =
        assignmentAvg * ACADEMIC_WEIGHTS.ASSIGNMENT +
        testAvg * ACADEMIC_WEIGHTS.TEST;
    } else if (assignmentAvg !== null) {
      academicScore = assignmentAvg;
    } else if (testAvg !== null) {
      academicScore = testAvg;
    }

    return {
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      totalMaterials,
      completedMaterials,
      percentage,
      materialsBreakdown: {
        lectures: {
          total: lectures.length,
          completed: lectures.filter((m) => completedMaterialIds.has(m.id)).length,
        },
        videos: {
          total: videos.length,
          completed: videos.filter((m) => completedMaterialIds.has(m.id)).length,
        },
        additionalResources: {
          total: additional.length,
          completed: additional.filter((m) => completedMaterialIds.has(m.id)).length,
        },
      },
      assignmentAverage: assignmentAvg !== null ? this.roundPercentage(assignmentAvg) : 0,
      testAverage: testAvg !== null ? this.roundPercentage(testAvg) : 0,
      academicScore: this.roundPercentage(academicScore),
    };
  }

  /**
   * 5. Full Progress Payload for /api/student/progress
   */
  async getFullProgress(userId?: string) {
    const [learningProgress, academicResults, subjects] = await Promise.all([
      this.getLearningProgress(userId),
      this.getAcademicResults(userId),
      this.getSubjectsProgress(userId),
    ]);

    return {
      message: 'Студенттің толық оқу үлгерімі мен академиялық нәтижелері',
      learningProgress,
      academicResults,
      subjects,
    };
  }
}

