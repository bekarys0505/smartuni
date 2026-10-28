import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CalendarEvent {
  id: string;
  type: 'LESSON' | 'ASSIGNMENT_DEADLINE' | 'TEST';
  title: string;
  description: string | null;
  date: string; // YYYY-MM-DD
  startTime: string | null;
  endTime: string | null;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  location?: string | null;
  teacherName?: string | null;
  groupName?: string | null;
  status: string; // SCHEDULED, PENDING, SUBMITTED, COMPLETED, PAST_DUE
  maxScore?: number | null;
  score?: number | null;
  percentage?: number | null;
  meta?: Record<string, any>;
}

const KAZAKH_DAYS = [
  'Жексенбі', // 0
  'Дүйсенбі', // 1
  'Сейсенбі', // 2
  'Сәрсенбі', // 3
  'Бейсенбі', // 4
  'Жұма',     // 5
  'Сенбі',    // 6
];

const KAZAKH_MONTHS = [
  'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
  'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан',
];

@Injectable()
export class StudentCalendarService {
  constructor(private readonly prisma: PrismaService) {}

  private parseLessonDays(lessonDayStr: string | null | undefined): number[] {
    if (!lessonDayStr) return [];
    const parts = lessonDayStr.split(/[,;/]+/);
    const dayIndices: number[] = [];

    for (const rawPart of parts) {
      const p = rawPart.trim().toLowerCase();
      if (!p) continue;
      if (p.includes('дүйсенбі') || p.includes('monday') || p === '1') dayIndices.push(1);
      else if (p.includes('сейсенбі') || p.includes('tuesday') || p === '2') dayIndices.push(2);
      else if (p.includes('сәрсенбі') || p.includes('wednesday') || p === '3') dayIndices.push(3);
      else if (p.includes('бейсенбі') || p.includes('thursday') || p === '4') dayIndices.push(4);
      else if (p.includes('жұма') || p.includes('friday') || p === '5') dayIndices.push(5);
      else if (p.includes('сенбі') || p.includes('saturday') || p === '6') dayIndices.push(6);
      else if (p.includes('жексенбі') || p.includes('sunday') || p === '0' || p === '7') dayIndices.push(0);
    }

    return Array.from(new Set(dayIndices));
  }

  private parseTimeRange(lessonTime: string | null | undefined): { startTime: string; endTime: string } {
    if (!lessonTime) {
      return { startTime: '09:00', endTime: '10:30' };
    }
    const clean = lessonTime.trim();
    if (clean.includes('-')) {
      const [start, end] = clean.split('-').map((s) => s.trim());
      return { startTime: start, endTime: end };
    }

    // Single time e.g. 14:00 -> add 90 minutes
    const match = clean.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const startMinutes = h * 60 + m;
      const endMinutes = startMinutes + 90;
      const endH = Math.floor(endMinutes / 60) % 24;
      const endM = endMinutes % 60;
      const startStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      return { startTime: startStr, endTime: endStr };
    }

    return { startTime: clean, endTime: '10:30' };
  }

  private formatDateString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDateString(str: string): Date {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  private formatKazakhDate(d: Date): string {
    const day = d.getDate();
    const month = KAZAKH_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  async getCalendarEvents(userId?: string, fromStr?: string, toStr?: string) {
    if (!userId) {
      throw new NotFoundException('Қолданушы анықталмады');
    }

    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Студент профилі табылмады');
    }

    // Determine default range (e.g. current month extended by +/- 7 days)
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    if (fromStr && /^\d{4}-\d{2}-\d{2}$/.test(fromStr)) {
      startDate = this.parseDateString(fromStr);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0);
      startDate.setDate(startDate.getDate() - 7); // Include previous week for month grid
    }

    if (toStr && /^\d{4}-\d{2}-\d{2}$/.test(toStr)) {
      endDate = this.parseDateString(toStr);
    } else {
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 12, 0, 0);
      endDate.setDate(endDate.getDate() + 7); // Include next week for month grid
    }

    const fromDateString = this.formatDateString(startDate);
    const toDateString = this.formatDateString(endDate);

    // Active group memberships
    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
      },
      include: {
        group: {
          include: {
            subject: true,
            teacher: {
              include: { user: true },
            },
          },
        },
      },
    });

    const subjectIds = memberships.map((m) => m.group.subjectId);
    const events: CalendarEvent[] = [];

    // 1. RECURRING LESSONS GENERATION
    for (const membership of memberships) {
      const g = membership.group;
      const dayIndices = this.parseLessonDays(g.lessonDay);
      if (dayIndices.length === 0) continue;

      const { startTime, endTime } = this.parseTimeRange(g.lessonTime);

      const curr = new Date(startDate.getTime());
      while (curr <= endDate) {
        if (dayIndices.includes(curr.getDay())) {
          const dateStr = this.formatDateString(curr);
          events.push({
            id: `lesson-${g.id}-${dateStr}`,
            type: 'LESSON',
            title: `${g.subject.name} (Сабақ)`,
            description: `Топ: ${g.name}, Дәрісхана: ${g.classroom || 'Көрсетілмеген'}`,
            date: dateStr,
            startTime,
            endTime,
            subjectId: g.subjectId,
            subjectName: g.subject.name,
            subjectCode: g.subject.code,
            location: g.classroom || null,
            teacherName: g.teacher?.user?.fullName || null,
            groupName: g.name,
            status: 'SCHEDULED',
            meta: {
              groupId: g.id,
              course: g.course,
              semester: g.semester,
            },
          });
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    // 2. ASSIGNMENT DEADLINES
    if (subjectIds.length > 0) {
      const assignments = await this.prisma.assignment.findMany({
        where: {
          topic: {
            subjectId: { in: subjectIds },
          },
          deadline: {
            not: null,
          },
        },
        include: {
          topic: {
            include: {
              subject: true,
            },
          },
          submissions: {
            where: {
              studentId: student.id,
            },
          },
        },
      });

      const now = new Date();

      for (const a of assignments) {
        if (!a.deadline) continue;
        const deadlineDateStr = this.formatDateString(a.deadline);
        // Only include if in calendar range
        if (deadlineDateStr < fromDateString || deadlineDateStr > toDateString) {
          continue;
        }

        const sub = a.submissions[0];
        const isPastDue = !sub && a.deadline < now;
        const timeHours = String(a.deadline.getHours()).padStart(2, '0');
        const timeMins = String(a.deadline.getMinutes()).padStart(2, '0');
        const deadlineTime = `${timeHours}:${timeMins}`;

        let status = 'PENDING';
        if (sub) {
          status = sub.status === 'GRADED' ? 'COMPLETED' : 'SUBMITTED';
        } else if (isPastDue) {
          status = 'PAST_DUE';
        }

        events.push({
          id: `assignment-${a.id}`,
          type: 'ASSIGNMENT_DEADLINE',
          title: `${a.title} (Тапсырма)`,
          description: a.description || null,
          date: deadlineDateStr,
          startTime: deadlineTime === '00:00' ? '23:59' : deadlineTime,
          endTime: null,
          subjectId: a.topic.subjectId,
          subjectName: a.topic.subject.name,
          subjectCode: a.topic.subject.code,
          status,
          maxScore: a.maxScore,
          score: sub?.score ?? null,
          meta: {
            assignmentId: a.id,
            topicId: a.topicId,
            topicTitle: a.topic.title,
            submissionStatus: sub ? sub.status : (isPastDue ? 'PAST_DUE' : 'NOT_SUBMITTED'),
            allowLate: a.allowLate,
          },
        });
      }
    }

    // 3. SCHEDULED TESTS
    if (subjectIds.length > 0) {
      const tests = await this.prisma.test.findMany({
        where: {
          subjectId: { in: subjectIds },
          status: 'PUBLISHED',
          scheduledAt: {
            not: null,
          },
        },
        include: {
          subject: true,
          attempts: {
            where: {
              studentProfileId: student.id,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      for (const t of tests) {
        if (!t.scheduledAt) continue;
        const testDateStr = this.formatDateString(t.scheduledAt);
        if (testDateStr < fromDateString || testDateStr > toDateString) {
          continue;
        }

        const latestAttempt = t.attempts[0];
        const h = t.scheduledAt.getHours();
        const m = t.scheduledAt.getMinutes();
        const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        // End time is start + durationMinutes
        const startMinutes = h * 60 + m;
        const endMinutes = startMinutes + t.durationMinutes;
        const endH = Math.floor(endMinutes / 60) % 24;
        const endM = endMinutes % 60;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        let status = 'PENDING';
        if (latestAttempt) {
          status = latestAttempt.status === 'COMPLETED' ? 'COMPLETED' : latestAttempt.status;
        }

        events.push({
          id: `test-${t.id}`,
          type: 'TEST',
          title: `${t.title} (Тест)`,
          description: t.description || null,
          date: testDateStr,
          startTime,
          endTime,
          subjectId: t.subjectId,
          subjectName: t.subject.name,
          subjectCode: t.subject.code,
          status,
          maxScore: t.maxScore,
          score: latestAttempt?.score ?? null,
          percentage: latestAttempt?.percentage ?? null,
          meta: {
            testId: t.id,
            durationMinutes: t.durationMinutes,
            attemptStatus: latestAttempt ? latestAttempt.status : 'NOT_STARTED',
            attemptId: latestAttempt?.id || null,
          },
        });
      }
    }

    // Sort chronologically by date and startTime
    events.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    return {
      message: 'Күнтізбе оқиғалары',
      from: fromDateString,
      to: toDateString,
      events,
    };
  }

  async getDiaryForDate(userId?: string, dateStr?: string) {
    if (!userId) {
      throw new NotFoundException('Қолданушы анықталмады');
    }

    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Студент профилі табылмады');
    }

    const targetDate = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? this.parseDateString(dateStr)
      : new Date();

    const selectedDateStr = this.formatDateString(targetDate);
    const dayOfWeekIndex = targetDate.getDay();
    const dayOfWeekName = KAZAKH_DAYS[dayOfWeekIndex];
    const formattedDate = this.formatKazakhDate(targetDate);

    // Active group memberships
    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
      },
      include: {
        group: {
          include: {
            subject: true,
            teacher: {
              include: { user: true },
            },
          },
        },
      },
    });

    const subjectIds = memberships.map((m) => m.group.subjectId);

    // 1. LESSONS FOR THIS DAY
    const startOfDay = new Date(`${selectedDateStr}T00:00:00.000Z`);
    const dayAttendanceRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId: student.id,
        date: startOfDay,
      },
    });
    const dayAttendanceMap = new Map<string, { id: string; status: any; note: string | null; updatedAt: Date }>();
    for (const rec of dayAttendanceRecords) {
      dayAttendanceMap.set(rec.groupId, {
        id: rec.id,
        status: rec.status,
        note: rec.note,
        updatedAt: rec.updatedAt,
      });
    }

    const lessons: any[] = [];
    for (const membership of memberships) {
      const g = membership.group;
      const dayIndices = this.parseLessonDays(g.lessonDay);

      if (dayIndices.includes(dayOfWeekIndex)) {
        const { startTime, endTime } = this.parseTimeRange(g.lessonTime);
        const dayAtt = dayAttendanceMap.get(g.id);
        lessons.push({
          id: `lesson-${g.id}-${selectedDateStr}`,
          groupId: g.id,
          groupName: g.name,
          subjectId: g.subjectId,
          subjectName: g.subject.name,
          subjectCode: g.subject.code,
          classroom: g.classroom || 'Анықталмаған дәрісхана',
          teacherName: g.teacher?.user?.fullName || 'Оқытушы',
          startTime,
          endTime,
          course: g.course,
          semester: g.semester,
          attendance: dayAtt
            ? {
                id: dayAtt.id,
                status: dayAtt.status,
                note: dayAtt.note,
                markedAt: dayAtt.updatedAt.toISOString(),
              }
            : null,
        });
      }
    }

    // Sort lessons by startTime
    lessons.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // 2. ASSIGNMENTS DUE ON THIS DAY
    const tasks: any[] = [];
    if (subjectIds.length > 0) {
      const allSubjectAssignments = await this.prisma.assignment.findMany({
        where: {
          topic: {
            subjectId: { in: subjectIds },
          },
          deadline: {
            not: null,
          },
        },
        include: {
          topic: {
            include: {
              subject: true,
            },
          },
          submissions: {
            where: {
              studentId: student.id,
            },
          },
        },
      });

      const now = new Date();

      for (const a of allSubjectAssignments) {
        if (!a.deadline) continue;
        const aDateStr = this.formatDateString(a.deadline);
        if (aDateStr === selectedDateStr) {
          const sub = a.submissions[0];
          const isPastDue = !sub && a.deadline < now;
          const timeHours = String(a.deadline.getHours()).padStart(2, '0');
          const timeMins = String(a.deadline.getMinutes()).padStart(2, '0');
          const deadlineTime = `${timeHours}:${timeMins}`;

          let submissionStatus = 'NOT_SUBMITTED';
          if (sub) {
            submissionStatus = sub.status;
          } else if (isPastDue) {
            submissionStatus = 'PAST_DUE';
          }

          tasks.push({
            id: a.id,
            title: a.title,
            description: a.description,
            subjectId: a.topic.subjectId,
            subjectName: a.topic.subject.name,
            subjectCode: a.topic.subject.code,
            topicId: a.topicId,
            topicTitle: a.topic.title,
            deadline: a.deadline,
            deadlineTime: deadlineTime === '00:00' ? '23:59' : deadlineTime,
            maxScore: a.maxScore,
            allowLate: a.allowLate,
            submissionStatus,
            score: sub?.score ?? null,
            gradedAt: sub?.gradedAt ?? null,
            teacherComment: sub?.teacherComment ?? null,
          });
        }
      }
    }

    // 3. TESTS SCHEDULED ON THIS DAY
    const tests: any[] = [];
    if (subjectIds.length > 0) {
      const allSubjectTests = await this.prisma.test.findMany({
        where: {
          subjectId: { in: subjectIds },
          status: 'PUBLISHED',
          scheduledAt: {
            not: null,
          },
        },
        include: {
          subject: true,
          attempts: {
            where: {
              studentProfileId: student.id,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      for (const t of allSubjectTests) {
        if (!t.scheduledAt) continue;
        const tDateStr = this.formatDateString(t.scheduledAt);
        if (tDateStr === selectedDateStr) {
          const latestAttempt = t.attempts[0];
          const h = t.scheduledAt.getHours();
          const m = t.scheduledAt.getMinutes();
          const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

          tests.push({
            id: t.id,
            title: t.title,
            description: t.description,
            subjectId: t.subjectId,
            subjectName: t.subject.name,
            subjectCode: t.subject.code,
            scheduledAt: t.scheduledAt,
            startTime,
            durationMinutes: t.durationMinutes,
            maxScore: t.maxScore,
            attemptStatus: latestAttempt ? latestAttempt.status : 'NOT_STARTED',
            score: latestAttempt?.score ?? null,
            percentage: latestAttempt?.percentage ?? null,
            attemptId: latestAttempt?.id || null,
          });
        }
      }
    }

    const completedTasksCount = tasks.filter(
      (t) => t.submissionStatus === 'GRADED' || t.submissionStatus === 'SUBMITTED',
    ).length;
    const completedTestsCount = tests.filter((t) => t.attemptStatus === 'COMPLETED').length;

    // Attendance stats for student
    const allStudentAttendance = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId: student.id,
      },
    });

    const totalMarked = allStudentAttendance.length;
    const presentCount = allStudentAttendance.filter((r) => r.status === 'PRESENT').length;
    const absentCount = allStudentAttendance.filter((r) => r.status === 'ABSENT').length;
    const lateCount = allStudentAttendance.filter((r) => r.status === 'LATE').length;
    const excusedCount = allStudentAttendance.filter((r) => r.status === 'EXCUSED').length;

    const attendanceRate = totalMarked > 0
      ? Math.round(((presentCount + lateCount) / totalMarked) * 100)
      : 100;

    return {
      message: 'Күнделік мәліметтері',
      date: selectedDateStr,
      dayOfWeekName,
      formattedDate,
      summary: {
        lessonCount: lessons.length,
        taskCount: tasks.length,
        testCount: tests.length,
        totalCount: lessons.length + tasks.length + tests.length,
        completedTasksCount,
        completedTestsCount,
        attendance: {
          totalMarked,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
          attendanceRate,
        },
      },
      lessons,
      tasks,
      tests,
    };
  }

  async getStudentAttendanceHistory(userId?: string) {
    if (!userId) {
      throw new NotFoundException('Қолданушы анықталмады');
    }

    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Студент профилі табылмады');
    }

    const memberships = await this.prisma.groupMembership.findMany({
      where: {
        studentId: student.id,
        status: 'ACTIVE',
      },
      include: {
        group: {
          include: {
            subject: true,
            teacher: {
              include: { user: true },
            },
          },
        },
      },
    });

    const allRecords = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        group: {
          include: {
            subject: true,
            teacher: {
              include: { user: true },
            },
          },
        },
        markedBy: {
          include: { user: true },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const totalMarked = allRecords.length;
    const presentCount = allRecords.filter((r) => r.status === 'PRESENT').length;
    const absentCount = allRecords.filter((r) => r.status === 'ABSENT').length;
    const lateCount = allRecords.filter((r) => r.status === 'LATE').length;
    const excusedCount = allRecords.filter((r) => r.status === 'EXCUSED').length;

    const attendanceRate = totalMarked > 0
      ? Math.round(((presentCount + lateCount) / totalMarked) * 100)
      : 100;

    // Subject breakdown
    const subjectBreakdown = memberships.map((m) => {
      const g = m.group;
      const groupRecords = allRecords.filter((r) => r.groupId === g.id);
      const grpTotal = groupRecords.length;
      const grpPresent = groupRecords.filter((r) => r.status === 'PRESENT').length;
      const grpAbsent = groupRecords.filter((r) => r.status === 'ABSENT').length;
      const grpLate = groupRecords.filter((r) => r.status === 'LATE').length;
      const grpExcused = groupRecords.filter((r) => r.status === 'EXCUSED').length;
      const grpRate = grpTotal > 0
        ? Math.round(((grpPresent + grpLate) / grpTotal) * 100)
        : 100;

      return {
        groupId: g.id,
        groupName: g.name,
        subjectId: g.subjectId,
        subjectName: g.subject.name,
        subjectCode: g.subject.code,
        teacherName: g.teacher?.user?.fullName || 'Оқытушы',
        course: g.course,
        semester: g.semester,
        totalMarked: grpTotal,
        presentCount: grpPresent,
        absentCount: grpAbsent,
        lateCount: grpLate,
        excusedCount: grpExcused,
        attendanceRate: grpRate,
      };
    });

    const formattedRecords = allRecords.map((r) => ({
      id: r.id,
      date: this.formatDateString(r.date),
      status: r.status,
      note: r.note,
      groupId: r.groupId,
      groupName: r.group.name,
      subjectId: r.group.subjectId,
      subjectName: r.group.subject.name,
      subjectCode: r.group.subject.code,
      teacherName: r.markedBy?.user?.fullName || r.group.teacher?.user?.fullName || 'Оқытушы',
      updatedAt: r.updatedAt.toISOString(),
    }));

    return {
      message: 'Студенттің қатысу статистикасы',
      summary: {
        totalMarked,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate,
      },
      subjectBreakdown,
      records: formattedRecords,
    };
  }
}

