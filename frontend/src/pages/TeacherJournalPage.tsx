import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  CardBody,
  Badge,
  Button,
  Modal,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { api } from '../utils/api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface TeacherGroupOption {
  id: string;
  name: string;
  course: number;
  semester: number;
  academicYear: string;
  capacity: number;
  activeStudentsCount: number;
  status: string;
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
}

interface JournalAssignment {
  id: string;
  title: string;
  topicId: string;
  topicTitle: string;
  maxScore: number;
  deadline: string | null;
  responseType: string;
}

interface JournalTest {
  id: string;
  title: string;
  topicId: string | null;
  topicTitle: string | null;
  maxScore: number;
  durationMinutes: number;
  status: string;
}

interface StudentAssignmentCell {
  assignmentId: string;
  submissionId: string | null;
  title: string;
  maxScore: number;
  status: 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED' | 'LATE';
  score: number | null;
  percentage: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
  teacherComment: string | null;
}

interface StudentTestCell {
  testId: string;
  attemptId: string | null;
  title: string;
  maxScore: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  score: number | null;
  percentage: number | null;
  submittedAt: string | null;
}

interface StudentMetrics {
  assignmentsAverage: number | null;
  testsAverage: number | null;
  totalAverage: number | null;
  completedAssignmentsCount: number;
  totalAssignmentsCount: number;
  completedTestsCount: number;
  totalTestsCount: number;
}

interface JournalStudent {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  assignments: StudentAssignmentCell[];
  tests: StudentTestCell[];
  metrics: StudentMetrics;
}

interface JournalSummary {
  totalStudents: number;
  assignmentsCount: number;
  testsCount: number;
  averageScore: number | null;
  submissionRate: number;
}

interface JournalResponse {
  message: string;
  group: {
    id: string;
    name: string;
    subject: {
      id: string;
      name: string;
      code: string | null;
    };
    course: number;
    semester: number;
    academicYear: string;
  };
  summary: JournalSummary;
  assignments: JournalAssignment[];
  tests: JournalTest[];
  students: JournalStudent[];
}

type ColumnFilterType = 'ALL' | 'ASSIGNMENTS_ONLY' | 'TESTS_ONLY';
type PerformanceFilterType = 'ALL' | 'EXCELLENT' | 'GOOD' | 'AT_RISK';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getGradeLetter = (percentage: number | null): string => {
  if (percentage === null) return '—';
  if (percentage >= 95) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 85) return 'B+';
  if (percentage >= 80) return 'B';
  if (percentage >= 75) return 'B-';
  if (percentage >= 70) return 'C+';
  if (percentage >= 65) return 'C';
  if (percentage >= 60) return 'C-';
  if (percentage >= 50) return 'D';
  return 'F';
};

const getScoreColor = (percentage: number | null): { bg: string; text: string; border: string } => {
  if (percentage === null) {
    return { bg: 'var(--su-bg-secondary)', text: 'var(--su-text-muted)', border: 'transparent' };
  }
  if (percentage >= 85) {
    return { bg: 'rgba(16, 185, 129, 0.12)', text: '#059669', border: 'rgba(16, 185, 129, 0.25)' };
  }
  if (percentage >= 70) {
    return { bg: 'rgba(59, 130, 246, 0.12)', text: '#2563eb', border: 'rgba(59, 130, 246, 0.25)' };
  }
  if (percentage >= 50) {
    return { bg: 'rgba(245, 158, 11, 0.12)', text: '#d97706', border: 'rgba(245, 158, 11, 0.25)' };
  }
  return { bg: 'rgba(239, 68, 68, 0.12)', text: '#dc2626', border: 'rgba(239, 68, 68, 0.25)' };
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('kk-KZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TeacherJournalPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State: Groups
  const [groups, setGroups] = useState<TeacherGroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loadingGroups, setLoadingGroups] = useState(true);

  // State: Journal Data
  const [journalData, setJournalData] = useState<JournalResponse | null>(null);
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State: Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilter, setColumnFilter] = useState<ColumnFilterType>('ALL');
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceFilterType>('ALL');

  // State: Student Detail Modal
  const [selectedStudent, setSelectedStudent] = useState<JournalStudent | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // 1. Fetch available teacher groups
  const fetchGroups = async () => {
    setLoadingGroups(true);
    setError(null);
    try {
      const res = await api.get<{ groups: TeacherGroupOption[] }>('/api/teacher/groups');
      const loadedGroups = res.groups || [];
      setGroups(loadedGroups);

      // Determine initial selected group
      const queryGroupId = searchParams.get('groupId');
      if (queryGroupId && loadedGroups.some((g) => g.id === queryGroupId)) {
        setSelectedGroupId(queryGroupId);
      } else if (loadedGroups.length > 0) {
        setSelectedGroupId(loadedGroups[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Топтар тізімін жүктеу сәтсіз аяқталды');
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 2. Fetch journal data for selected group
  const fetchJournal = async (groupId: string) => {
    if (!groupId) return;
    setLoadingJournal(true);
    setError(null);
    try {
      const data = await api.get<JournalResponse>(`/api/teacher/groups/${groupId}/journal`);
      setJournalData(data);
    } catch (err: any) {
      setError(err.message || 'Электронды журнал мәліметтерін жүктеу сәтсіз аяқталды');
      setJournalData(null);
    } finally {
      setLoadingJournal(false);
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      setSearchParams({ groupId: selectedGroupId });
      fetchJournal(selectedGroupId);
    }
  }, [selectedGroupId]);

  // 3. Filtered students list
  const filteredStudents = useMemo(() => {
    if (!journalData) return [];
    let list = journalData.students;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.phone && s.phone.includes(q)),
      );
    }

    // Performance filter
    if (performanceFilter === 'EXCELLENT') {
      list = list.filter((s) => s.metrics.totalAverage !== null && s.metrics.totalAverage >= 85);
    } else if (performanceFilter === 'GOOD') {
      list = list.filter(
        (s) =>
          s.metrics.totalAverage !== null &&
          s.metrics.totalAverage >= 70 &&
          s.metrics.totalAverage < 85,
      );
    } else if (performanceFilter === 'AT_RISK') {
      list = list.filter(
        (s) =>
          s.metrics.totalAverage === null ||
          s.metrics.totalAverage < 50 ||
          s.metrics.completedAssignmentsCount === 0,
      );
    }

    return list;
  }, [journalData, searchQuery, performanceFilter]);

  // Selected group object
  const currentGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  // 4. CSV Export function
  const handleExportCSV = () => {
    if (!journalData || !journalData.students.length) return;

    const assignmentsHeaders =
      columnFilter !== 'TESTS_ONLY' ? journalData.assignments.map((a) => `"${a.title} (макс: ${a.maxScore})"`) : [];
    const testsHeaders =
      columnFilter !== 'ASSIGNMENTS_ONLY' ? journalData.tests.map((t) => `"${t.title} (макс: ${t.maxScore})"`) : [];

    const headers = [
      '"№"',
      '"Студент аты-жөні"',
      '"Email"',
      ...assignmentsHeaders,
      ...testsHeaders,
      '"Тапсырмалар орташа (%)"',
      '"Тесттер орташа (%)"',
      '"Жалпы орташа (%)"',
      '"Баға әрпі"',
    ];

    const rows = journalData.students.map((student, idx) => {
      const assignmentCols =
        columnFilter !== 'TESTS_ONLY'
          ? student.assignments.map((a) => (a.score !== null ? `${a.score}` : a.status === 'SUBMITTED' ? '"Тексерілмеген"' : '""'))
          : [];
      const testCols =
        columnFilter !== 'ASSIGNMENTS_ONLY'
          ? student.tests.map((t) => (t.score !== null ? `${t.score}` : '""'))
          : [];

      return [
        idx + 1,
        `"${student.fullName}"`,
        `"${student.email}"`,
        ...assignmentCols,
        ...testCols,
        student.metrics.assignmentsAverage !== null ? student.metrics.assignmentsAverage : '""',
        student.metrics.testsAverage !== null ? student.metrics.testsAverage : '""',
        student.metrics.totalAverage !== null ? student.metrics.totalAverage : '""',
        `"${getGradeLetter(student.metrics.totalAverage)}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `SmartUni_Journal_${journalData.group.name}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open detail modal for a student
  const handleOpenStudentDetail = (student: JournalStudent) => {
    setSelectedStudent(student);
    setIsStudentModalOpen(true);
  };

  return (
    <AppShell userRole="TEACHER">
      <div
        className="su-content-container"
        style={{ padding: '24px 0', maxWidth: '1440px', margin: '0 auto' }}
      >
        {/* Page Header */}
        <PageHeader
          title="Электронды журнал және ведомос"
          subtitle="Студенттердің тапсырмалары мен тест нәтижелерін бірыңғай академиялық журналда бақылау"
          breadcrumbs={[
            { label: 'Басты бет', path: '/teacher/dashboard' },
            { label: 'Электронды журнал' },
          ]}
          actions={
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outline"
                icon={<Icon name="award" size={16} />}
                onClick={() =>
                  navigate(
                    selectedGroupId
                      ? `/teacher/grades?groupId=${selectedGroupId}`
                      : '/teacher/grades',
                  )
                }
              >
                Бағалау ведомосы (РК/Сессия)
              </Button>
              <Button
                variant="outline"
                icon={<Icon name="check" size={16} />}
                onClick={() =>
                  navigate(
                    selectedGroupId
                      ? `/teacher/attendance?groupId=${selectedGroupId}`
                      : '/teacher/attendance',
                  )
                }
              >
                Сабаққа қатысу
              </Button>
              <Button
                variant="outline"
                icon={<Icon name="file-text" size={16} />}
                onClick={() => navigate('/teacher/assignments')}
              >
                Тапсырмалар
              </Button>
              <Button
                variant="outline"
                icon={<Icon name="check-circle" size={16} />}
                onClick={() => navigate('/teacher/tests')}
              >
                Тесттер
              </Button>
              <Button
                variant="primary"
                icon={<Icon name="download" size={16} />}
                onClick={handleExportCSV}
                disabled={!journalData || journalData.students.length === 0}
              >
                CSV жүктеу
              </Button>
            </div>
          }
        />

        {/* Global Error Banner */}
        {error && (
          <div style={{ marginBottom: '24px' }}>
            <ErrorState
              title="Журналды жүктеу қатесі"
              message={error}
              onRetry={() => {
                if (selectedGroupId) fetchJournal(selectedGroupId);
                else fetchGroups();
              }}
            />
          </div>
        )}

        {/* Loading Groups Skeleton */}
        {loadingGroups && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <Skeleton height={56} borderRadius="12px" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <Skeleton height={96} borderRadius="12px" />
              <Skeleton height={96} borderRadius="12px" />
              <Skeleton height={96} borderRadius="12px" />
              <Skeleton height={96} borderRadius="12px" />
            </div>
            <Skeleton height={320} borderRadius="12px" />
          </div>
        )}

        {/* No Groups State */}
        {!loadingGroups && groups.length === 0 && !error && (
          <Card padding="lg" style={{ textAlign: 'center', marginTop: '24px' }}>
            <EmptyState
              icon={<Icon name="users" size={48} />}
              title="Оқу топтары табылмады"
              description="Сізге әлі бекітілген оқу топтары жоқ. Алдымен жаңа оқу тобын құрыңыз."
              action={
                <Button variant="primary" onClick={() => navigate('/teacher/groups')}>
                  Топтар бөліміне өту
                </Button>
              }
            />
          </Card>
        )}

        {/* Main Content when groups exist */}
        {!loadingGroups && groups.length > 0 && (
          <>
            {/* Group Selector Bar */}
            <Card
              padding="md"
              style={{
                marginBottom: '20px',
                background: 'var(--su-bg-surface)',
                border: '1px solid var(--su-border)',
              }}
            >
              <CardBody style={{ padding: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 360px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--su-radius-md)',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: 'var(--su-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="users" size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label
                        htmlFor="group-select"
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--su-text-muted)',
                          display: 'block',
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Оқу тобын таңдаңыз:
                      </label>
                      <select
                        id="group-select"
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        style={{
                          width: '100%',
                          maxWidth: '420px',
                          padding: '8px 14px',
                          fontSize: '14px',
                          fontWeight: 600,
                          borderRadius: 'var(--su-radius-md)',
                          border: '1px solid var(--su-input-border)',
                          backgroundColor: 'var(--su-input-bg)',
                          color: 'var(--su-text-main)',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} — {g.subject.name} ({g.course}-курс, {g.activeStudentsCount} студент)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {currentGroup && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Badge variant="neutral">
                        <Icon name="book" size={13} style={{ marginRight: '4px' }} />
                        {currentGroup.subject.name}
                      </Badge>
                      <Badge variant="neutral">
                        {currentGroup.course}-курс • {currentGroup.semester}-семестр
                      </Badge>
                      <Badge variant="neutral">
                        Оқу жылы: {currentGroup.academicYear}
                      </Badge>
                      <Badge variant={currentGroup.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {currentGroup.status === 'ACTIVE' ? 'Белсенді' : currentGroup.status}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Loading Journal Data Skeleton */}
            {loadingJournal && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <Skeleton height={88} borderRadius="12px" />
                  <Skeleton height={88} borderRadius="12px" />
                  <Skeleton height={88} borderRadius="12px" />
                  <Skeleton height={88} borderRadius="12px" />
                </div>
                <Skeleton height={380} borderRadius="12px" />
              </div>
            )}

            {/* Loaded Journal Content */}
            {!loadingJournal && journalData && (
              <>
                {/* Metric Summary Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px',
                  }}
                >
                  {/* Card 1: Students */}
                  <Card padding="md" style={{ background: 'var(--su-bg-surface)' }}>
                    <CardBody style={{ padding: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: 'var(--su-radius-md)',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon name="users" size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--su-text-muted)', fontWeight: 600 }}>
                            БЕЛСЕНДІ СТУДЕНТТЕР
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--su-text-main)' }}>
                            {journalData.summary.totalStudents}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Card 2: Assignments & Tests */}
                  <Card padding="md" style={{ background: 'var(--su-bg-surface)' }}>
                    <CardBody style={{ padding: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: 'var(--su-radius-md)',
                            background: 'rgba(139, 92, 246, 0.1)',
                            color: '#7c3aed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon name="file-text" size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--su-text-muted)', fontWeight: 600 }}>
                            ТАПСЫРМАЛАР МЕН ТЕСТТЕР
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--su-text-main)' }}>
                            {journalData.summary.assignmentsCount} тапсырма / {journalData.summary.testsCount} тест
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Card 3: Group Average Score */}
                  <Card padding="md" style={{ background: 'var(--su-bg-surface)' }}>
                    <CardBody style={{ padding: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: 'var(--su-radius-md)',
                            background:
                              journalData.summary.averageScore !== null && journalData.summary.averageScore >= 70
                                ? 'rgba(16, 185, 129, 0.1)'
                                : 'rgba(245, 158, 11, 0.1)',
                            color:
                              journalData.summary.averageScore !== null && journalData.summary.averageScore >= 70
                                ? '#059669'
                                : '#d97706',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon name="chart" size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--su-text-muted)', fontWeight: 600 }}>
                            ТОПТЫҢ ОРТАША БАЛЫ
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--su-text-main)' }}>
                            {journalData.summary.averageScore !== null ? (
                              <>
                                {journalData.summary.averageScore}%{' '}
                                <span
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: 'var(--su-text-muted)',
                                    marginLeft: '4px',
                                  }}
                                >
                                  ({getGradeLetter(journalData.summary.averageScore)})
                                </span>
                              </>
                            ) : (
                              'Бағаланбаған'
                            )}
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {/* Card 4: Submission Rate */}
                  <Card padding="md" style={{ background: 'var(--su-bg-surface)' }}>
                    <CardBody style={{ padding: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: 'var(--su-radius-md)',
                            background: 'rgba(14, 165, 233, 0.1)',
                            color: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon name="check-circle" size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: 'var(--su-text-muted)', fontWeight: 600 }}>
                            ОРЫНДАЛУ ДЕҢГЕЙІ
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--su-text-main)' }}>
                            {journalData.summary.submissionRate}%
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: '4px',
                              backgroundColor: 'var(--su-border)',
                              borderRadius: '2px',
                              marginTop: '4px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${journalData.summary.submissionRate}%`,
                                height: '100%',
                                backgroundColor: '#0284c7',
                                borderRadius: '2px',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Filter and Search Bar */}
                <Card padding="md" style={{ marginBottom: '16px', background: 'var(--su-bg-surface)' }}>
                  <CardBody style={{ padding: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      {/* Search Student Input */}
                      <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '360px' }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--su-text-muted)',
                            pointerEvents: 'none',
                          }}
                        >
                          <Icon name="search" size={16} />
                        </div>
                        <input
                          type="text"
                          placeholder="Студентті аты немесе email бойынша іздеу..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px 8px 36px',
                            fontSize: '13px',
                            borderRadius: 'var(--su-radius-md)',
                            border: '1px solid var(--su-input-border)',
                            backgroundColor: 'var(--su-input-bg)',
                            color: 'var(--su-text-main)',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* Filter by Columns */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--su-text-muted)', fontWeight: 500 }}>
                          Бағандар:
                        </span>
                        <div
                          style={{
                            display: 'inline-flex',
                            borderRadius: 'var(--su-radius-md)',
                            background: 'var(--su-bg-secondary)',
                            padding: '2px',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setColumnFilter('ALL')}
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              fontWeight: columnFilter === 'ALL' ? 600 : 500,
                              borderRadius: 'var(--su-radius-sm)',
                              border: 'none',
                              backgroundColor: columnFilter === 'ALL' ? 'var(--su-bg-surface)' : 'transparent',
                              color: columnFilter === 'ALL' ? 'var(--su-primary)' : 'var(--su-text-muted)',
                              cursor: 'pointer',
                              boxShadow: columnFilter === 'ALL' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                            }}
                          >
                            Барлығы ({journalData.assignments.length + journalData.tests.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setColumnFilter('ASSIGNMENTS_ONLY')}
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              fontWeight: columnFilter === 'ASSIGNMENTS_ONLY' ? 600 : 500,
                              borderRadius: 'var(--su-radius-sm)',
                              border: 'none',
                              backgroundColor:
                                columnFilter === 'ASSIGNMENTS_ONLY' ? 'var(--su-bg-surface)' : 'transparent',
                              color:
                                columnFilter === 'ASSIGNMENTS_ONLY' ? 'var(--su-primary)' : 'var(--su-text-muted)',
                              cursor: 'pointer',
                              boxShadow: columnFilter === 'ASSIGNMENTS_ONLY' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                            }}
                          >
                            Тапсырмалар ({journalData.assignments.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setColumnFilter('TESTS_ONLY')}
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              fontWeight: columnFilter === 'TESTS_ONLY' ? 600 : 500,
                              borderRadius: 'var(--su-radius-sm)',
                              border: 'none',
                              backgroundColor:
                                columnFilter === 'TESTS_ONLY' ? 'var(--su-bg-surface)' : 'transparent',
                              color: columnFilter === 'TESTS_ONLY' ? 'var(--su-primary)' : 'var(--su-text-muted)',
                              cursor: 'pointer',
                              boxShadow: columnFilter === 'TESTS_ONLY' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                            }}
                          >
                            Тесттер ({journalData.tests.length})
                          </button>
                        </div>
                      </div>

                      {/* Performance Filter Select */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--su-text-muted)', fontWeight: 500 }}>
                          Үлгерім:
                        </span>
                        <select
                          value={performanceFilter}
                          onChange={(e) => setPerformanceFilter(e.target.value as PerformanceFilterType)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            borderRadius: 'var(--su-radius-md)',
                            border: '1px solid var(--su-input-border)',
                            backgroundColor: 'var(--su-input-bg)',
                            color: 'var(--su-text-main)',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="ALL">Барлық студенттер</option>
                          <option value="EXCELLENT">Үздіктер (≥ 85%)</option>
                          <option value="GOOD">Жақсы (70 - 84%)</option>
                          <option value="AT_RISK">Назар аударуды қажет ететіндер (&lt; 50%)</option>
                        </select>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Journal Matrix Table Container */}
                <Card padding="none" style={{ background: 'var(--su-bg-surface)', overflow: 'hidden' }}>
                  {filteredStudents.length === 0 ? (
                    <div style={{ padding: '48px 16px', textAlign: 'center' }}>
                      <EmptyState
                        icon={<Icon name="search" size={40} />}
                        title="Студенттер табылмады"
                        description={
                          searchQuery
                            ? `"${searchQuery}" сұрауы бойынша студенттер жоқ`
                            : 'Бұл топқа әлі белсенді студенттер тіркелмеген немесе таңдалған фильтр бойынша сәйкестік табылмады.'
                        }
                        action={
                          searchQuery || performanceFilter !== 'ALL' ? (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSearchQuery('');
                                setPerformanceFilter('ALL');
                              }}
                            >
                              Фильтрлерді тазалау
                            </Button>
                          ) : undefined
                        }
                      />
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', width: '100%', position: 'relative' }}>
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '13px',
                          textAlign: 'left',
                          minWidth: '1000px',
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              backgroundColor: 'var(--su-bg-secondary)',
                              borderBottom: '2px solid var(--su-border)',
                              color: 'var(--su-text-muted)',
                              fontSize: '12px',
                            }}
                          >
                            {/* Sticky Left: Student Info Header */}
                            <th
                              style={{
                                padding: '14px 16px',
                                position: 'sticky',
                                left: 0,
                                zIndex: 10,
                                backgroundColor: 'var(--su-bg-secondary)',
                                minWidth: '240px',
                                maxWidth: '280px',
                                borderRight: '2px solid var(--su-border)',
                              }}
                            >
                              Студент аты-жөні
                            </th>

                            {/* Assignment Columns */}
                            {columnFilter !== 'TESTS_ONLY' &&
                              journalData.assignments.map((assignment) => (
                                <th
                                  key={assignment.id}
                                  style={{
                                    padding: '12px 14px',
                                    minWidth: '140px',
                                    maxWidth: '180px',
                                    borderRight: '1px solid var(--su-border)',
                                    verticalAlign: 'top',
                                  }}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: 'var(--su-primary)',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                      }}
                                    >
                                      <Icon name="file-text" size={12} />
                                      <span>Тапсырма</span>
                                    </div>
                                    <div
                                      title={assignment.title}
                                      style={{
                                        fontWeight: 600,
                                        color: 'var(--su-text-main)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {assignment.title}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: '11px',
                                        color: 'var(--su-text-muted)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                      }}
                                    >
                                      <span>Макс: {assignment.maxScore}</span>
                                      {assignment.deadline && <span>{formatDate(assignment.deadline)}</span>}
                                    </div>
                                  </div>
                                </th>
                              ))}

                            {/* Test Columns */}
                            {columnFilter !== 'ASSIGNMENTS_ONLY' &&
                              journalData.tests.map((test) => (
                                <th
                                  key={test.id}
                                  style={{
                                    padding: '12px 14px',
                                    minWidth: '140px',
                                    maxWidth: '180px',
                                    borderRight: '1px solid var(--su-border)',
                                    verticalAlign: 'top',
                                  }}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: '#7c3aed',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                      }}
                                    >
                                      <Icon name="check-circle" size={12} />
                                      <span>Тест</span>
                                    </div>
                                    <div
                                      title={test.title}
                                      style={{
                                        fontWeight: 600,
                                        color: 'var(--su-text-main)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                    >
                                      {test.title}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: '11px',
                                        color: 'var(--su-text-muted)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                      }}
                                    >
                                      <span>Макс: {test.maxScore}</span>
                                      <span>{test.durationMinutes} мин</span>
                                    </div>
                                  </div>
                                </th>
                              ))}

                            {/* Aggregated Columns */}
                            <th
                              style={{
                                padding: '12px 14px',
                                minWidth: '110px',
                                borderRight: '1px solid var(--su-border)',
                                textAlign: 'center',
                                verticalAlign: 'middle',
                              }}
                            >
                              Тапсырмалар орташа
                            </th>
                            <th
                              style={{
                                padding: '12px 14px',
                                minWidth: '100px',
                                borderRight: '1px solid var(--su-border)',
                                textAlign: 'center',
                                verticalAlign: 'middle',
                              }}
                            >
                              Тесттер орташа
                            </th>
                            <th
                              style={{
                                padding: '12px 16px',
                                minWidth: '120px',
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                backgroundColor: 'var(--su-bg-secondary)',
                              }}
                            >
                              Қорытынды баға
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredStudents.map((student, sIdx) => {
                            const isEven = sIdx % 2 === 0;
                            const rowBg = isEven ? 'var(--su-bg-surface)' : 'var(--su-bg-subtle, rgba(0,0,0,0.015))';
                            const totalScoreStyle = getScoreColor(student.metrics.totalAverage);

                            return (
                              <tr
                                key={student.id}
                                style={{
                                  backgroundColor: rowBg,
                                  borderBottom: '1px solid var(--su-border)',
                                  transition: 'background-color 0.15s ease',
                                }}
                              >
                                {/* Sticky Left: Student Profile */}
                                <td
                                  style={{
                                    padding: '12px 16px',
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 5,
                                    backgroundColor: rowBg,
                                    borderRight: '2px solid var(--su-border)',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => handleOpenStudentDetail(student)}
                                  title="Студенттің толық ведомосін көру"
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--su-primary)',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {student.fullName.charAt(0)}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <div
                                        style={{
                                          fontWeight: 600,
                                          color: 'var(--su-text-main)',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {student.fullName}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: '11px',
                                          color: 'var(--su-text-muted)',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {student.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Assignment Cells */}
                                {columnFilter !== 'TESTS_ONLY' &&
                                  student.assignments.map((cell) => {
                                    const scoreStyle = getScoreColor(cell.percentage);

                                    return (
                                      <td
                                        key={cell.assignmentId}
                                        style={{
                                          padding: '10px 14px',
                                          borderRight: '1px solid var(--su-border)',
                                          verticalAlign: 'middle',
                                          textAlign: 'center',
                                        }}
                                      >
                                        {cell.status === 'GRADED' && cell.score !== null ? (
                                          <div
                                            title={
                                              cell.teacherComment
                                                ? `Баға: ${cell.score}/${cell.maxScore} (${cell.percentage}%)\nПікір: ${cell.teacherComment}`
                                                : `Баға: ${cell.score}/${cell.maxScore} (${cell.percentage}%)`
                                            }
                                            style={{
                                              display: 'inline-flex',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              padding: '4px 8px',
                                              borderRadius: 'var(--su-radius-sm)',
                                              backgroundColor: scoreStyle.bg,
                                              border: `1px solid ${scoreStyle.border}`,
                                            }}
                                          >
                                            <span style={{ fontWeight: 700, color: scoreStyle.text, fontSize: '12px' }}>
                                              {cell.score} / {cell.maxScore}
                                            </span>
                                            <span style={{ fontSize: '10px', color: scoreStyle.text, opacity: 0.85 }}>
                                              {cell.percentage}%
                                            </span>
                                          </div>
                                        ) : cell.status === 'SUBMITTED' ? (
                                          <button
                                            type="button"
                                            onClick={() => navigate('/teacher/assignments')}
                                            title="Жұмыс тапсырылған, бірақ әлі бағаланбаған. Бағалау үшін басыңыз."
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              padding: '4px 8px',
                                              borderRadius: 'var(--su-radius-sm)',
                                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                              border: '1px solid rgba(245, 158, 11, 0.3)',
                                              color: '#d97706',
                                              fontSize: '11px',
                                              fontWeight: 600,
                                              cursor: 'pointer',
                                            }}
                                          >
                                            <Icon name="clock" size={12} />
                                            <span>Тексеру</span>
                                          </button>
                                        ) : cell.status === 'LATE' ? (
                                          <span
                                            style={{
                                              display: 'inline-block',
                                              padding: '3px 8px',
                                              borderRadius: 'var(--su-radius-sm)',
                                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                              color: '#dc2626',
                                              fontSize: '11px',
                                              fontWeight: 600,
                                            }}
                                          >
                                            Кешіктірілді
                                          </span>
                                        ) : (
                                          <span style={{ color: 'var(--su-text-muted)', fontSize: '14px' }}>—</span>
                                        )}
                                      </td>
                                    );
                                  })}

                                {/* Test Cells */}
                                {columnFilter !== 'ASSIGNMENTS_ONLY' &&
                                  student.tests.map((cell) => {
                                    const scoreStyle = getScoreColor(cell.percentage);

                                    return (
                                      <td
                                        key={cell.testId}
                                        style={{
                                          padding: '10px 14px',
                                          borderRight: '1px solid var(--su-border)',
                                          verticalAlign: 'middle',
                                          textAlign: 'center',
                                        }}
                                      >
                                        {cell.status === 'COMPLETED' || cell.status === 'EXPIRED' ? (
                                          cell.score !== null ? (
                                            <div
                                              title={`Тест нәтижесі: ${cell.score}/${cell.maxScore} (${cell.percentage}%)`}
                                              style={{
                                                display: 'inline-flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                padding: '4px 8px',
                                                borderRadius: 'var(--su-radius-sm)',
                                                backgroundColor: scoreStyle.bg,
                                                border: `1px solid ${scoreStyle.border}`,
                                              }}
                                            >
                                              <span style={{ fontWeight: 700, color: scoreStyle.text, fontSize: '12px' }}>
                                                {cell.score} / {cell.maxScore}
                                              </span>
                                              <span style={{ fontSize: '10px', color: scoreStyle.text, opacity: 0.85 }}>
                                                {cell.percentage}%
                                              </span>
                                            </div>
                                          ) : (
                                            <span
                                              style={{
                                                padding: '3px 8px',
                                                borderRadius: 'var(--su-radius-sm)',
                                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                                color: '#d97706',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                              }}
                                            >
                                              Мерзімі өтті
                                            </span>
                                          )
                                        ) : cell.status === 'IN_PROGRESS' ? (
                                          <span
                                            style={{
                                              padding: '3px 8px',
                                              borderRadius: 'var(--su-radius-sm)',
                                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                              color: '#2563eb',
                                              fontSize: '11px',
                                              fontWeight: 600,
                                            }}
                                          >
                                            Өтуде
                                          </span>
                                        ) : (
                                          <span style={{ color: 'var(--su-text-muted)', fontSize: '14px' }}>—</span>
                                        )}
                                      </td>
                                    );
                                  })}

                                {/* Aggregated: Assignments Average */}
                                <td
                                  style={{
                                    padding: '10px 14px',
                                    borderRight: '1px solid var(--su-border)',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                    fontWeight: 600,
                                  }}
                                >
                                  {student.metrics.assignmentsAverage !== null ? (
                                    <div>
                                      <span style={{ fontSize: '13px', color: 'var(--su-text-main)' }}>
                                        {student.metrics.assignmentsAverage}%
                                      </span>
                                      <div style={{ fontSize: '10px', color: 'var(--su-text-muted)' }}>
                                        {student.metrics.completedAssignmentsCount} /{' '}
                                        {student.metrics.totalAssignmentsCount}
                                      </div>
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--su-text-muted)' }}>—</span>
                                  )}
                                </td>

                                {/* Aggregated: Tests Average */}
                                <td
                                  style={{
                                    padding: '10px 14px',
                                    borderRight: '1px solid var(--su-border)',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                    fontWeight: 600,
                                  }}
                                >
                                  {student.metrics.testsAverage !== null ? (
                                    <div>
                                      <span style={{ fontSize: '13px', color: 'var(--su-text-main)' }}>
                                        {student.metrics.testsAverage}%
                                      </span>
                                      <div style={{ fontSize: '10px', color: 'var(--su-text-muted)' }}>
                                        {student.metrics.completedTestsCount} / {student.metrics.totalTestsCount}
                                      </div>
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--su-text-muted)' }}>—</span>
                                  )}
                                </td>

                                {/* Aggregated: Total Average & Grade Letter */}
                                <td
                                  style={{
                                    padding: '10px 16px',
                                    textAlign: 'center',
                                    verticalAlign: 'middle',
                                  }}
                                >
                                  {student.metrics.totalAverage !== null ? (
                                    <div
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '5px 10px',
                                        borderRadius: 'var(--su-radius-md)',
                                        backgroundColor: totalScoreStyle.bg,
                                        border: `1px solid ${totalScoreStyle.border}`,
                                        color: totalScoreStyle.text,
                                        fontWeight: 700,
                                        fontSize: '13px',
                                      }}
                                    >
                                      <span>{student.metrics.totalAverage}%</span>
                                      <span style={{ fontSize: '12px', opacity: 0.85 }}>
                                        • {getGradeLetter(student.metrics.totalAverage)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--su-text-muted)', fontSize: '13px' }}>—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </>
            )}
          </>
        )}

        {/* Student Detailed Breakdown Modal */}
        {selectedStudent && (
          <Modal
            isOpen={isStudentModalOpen}
            onClose={() => setIsStudentModalOpen(false)}
            title={`Студент ведомосі: ${selectedStudent.fullName}`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Profile summary header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: 'var(--su-radius-md)',
                  backgroundColor: 'var(--su-bg-secondary)',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--su-primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                  }}
                >
                  {selectedStudent.fullName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--su-text-main)' }}>
                    {selectedStudent.fullName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>
                    {selectedStudent.email} {selectedStudent.phone && `• ${selectedStudent.phone}`}
                  </div>
                </div>
              </div>

              {/* Metrics grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--su-radius-sm)',
                    backgroundColor: 'var(--su-bg-surface)',
                    border: '1px solid var(--su-border)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--su-text-muted)', fontWeight: 600 }}>
                    ТАПСЫРМАЛАР ОРТАША
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--su-text-main)', marginTop: '4px' }}>
                    {selectedStudent.metrics.assignmentsAverage !== null
                      ? `${selectedStudent.metrics.assignmentsAverage}%`
                      : '—'}
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--su-radius-sm)',
                    backgroundColor: 'var(--su-bg-surface)',
                    border: '1px solid var(--su-border)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--su-text-muted)', fontWeight: 600 }}>
                    ТЕСТТЕР ОРТАША
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--su-text-main)', marginTop: '4px' }}>
                    {selectedStudent.metrics.testsAverage !== null
                      ? `${selectedStudent.metrics.testsAverage}%`
                      : '—'}
                  </div>
                </div>

                <div
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--su-radius-sm)',
                    backgroundColor: 'var(--su-bg-surface)',
                    border: '1px solid var(--su-border)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--su-text-muted)', fontWeight: 600 }}>
                    ҚОРЫТЫНДЫ БАҒА
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--su-primary)', marginTop: '4px' }}>
                    {selectedStudent.metrics.totalAverage !== null
                      ? `${selectedStudent.metrics.totalAverage}% (${getGradeLetter(selectedStudent.metrics.totalAverage)})`
                      : '—'}
                  </div>
                </div>
              </div>

              {/* Assignments Breakdown List */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--su-text-main)' }}>
                  Тапсырмалар нәтижелері ({selectedStudent.assignments.length})
                </h4>
                {selectedStudent.assignments.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>Тапсырмалар жоқ</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedStudent.assignments.map((a) => (
                      <div
                        key={a.assignmentId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 'var(--su-radius-sm)',
                          backgroundColor: 'var(--su-bg-surface)',
                          border: '1px solid var(--su-border)',
                          fontSize: '12px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--su-text-main)' }}>{a.title}</div>
                          {a.teacherComment && (
                            <div style={{ fontSize: '11px', color: 'var(--su-text-muted)', fontStyle: 'italic' }}>
                              Пікір: {a.teacherComment}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {a.status === 'GRADED' && a.score !== null ? (
                            <span style={{ fontWeight: 700, color: '#059669' }}>
                              {a.score} / {a.maxScore} ({a.percentage}%)
                            </span>
                          ) : a.status === 'SUBMITTED' ? (
                            <span style={{ color: '#d97706', fontWeight: 600 }}>Тексерілмеген</span>
                          ) : (
                            <span style={{ color: 'var(--su-text-muted)' }}>Тапсырылмаған</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tests Breakdown List */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--su-text-main)' }}>
                  Тесттер нәтижелері ({selectedStudent.tests.length})
                </h4>
                {selectedStudent.tests.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>Тесттер жоқ</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedStudent.tests.map((t) => (
                      <div
                        key={t.testId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 'var(--su-radius-sm)',
                          backgroundColor: 'var(--su-bg-surface)',
                          border: '1px solid var(--su-border)',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--su-text-main)' }}>{t.title}</div>
                        <div style={{ textAlign: 'right' }}>
                          {t.status === 'COMPLETED' && t.score !== null ? (
                            <span style={{ fontWeight: 700, color: '#059669' }}>
                              {t.score} / {t.maxScore} ({t.percentage}%)
                            </span>
                          ) : t.status === 'IN_PROGRESS' ? (
                            <span style={{ color: '#2563eb', fontWeight: 600 }}>Өтуде</span>
                          ) : t.status === 'EXPIRED' ? (
                            <span style={{ color: '#dc2626', fontWeight: 600 }}>Мерзімі өтті</span>
                          ) : (
                            <span style={{ color: 'var(--su-text-muted)' }}>Басталмаған</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <Button variant="outline" onClick={() => setIsStudentModalOpen(false)}>
                  Жабу
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
};

