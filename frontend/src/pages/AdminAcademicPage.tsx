import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
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
import '../styles/AdminPage.css';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AcademicOverviewStats {
  totalStudents: number;
  activeGroupsCount: number;
  totalSubjects: number;
  totalAssignments: number;
  totalSubmissions: number;
  gradedSubmissionsCount: number;
  totalTests: number;
  completedAttemptsCount: number;
  averageAssignmentScore: number | null;
  averageTestScore: number | null;
  overallAcademicAverage: number | null;
  submissionRate: number;
}

interface OverviewGroupItem {
  id: string;
  name: string;
  course: number;
  semester: number;
  academicYear: string;
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
  teacherName: string;
  activeStudentsCount: number;
}

interface OverviewSubjectItem {
  id: string;
  name: string;
  code: string | null;
  activeGroupsCount: number;
  topicsCount: number;
  testsCount: number;
}

interface AcademicOverviewResponse {
  message: string;
  stats: AcademicOverviewStats;
  groupsList: OverviewGroupItem[];
  subjectsList: OverviewSubjectItem[];
}

interface AcademicStudentItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  course: number;
  avatarUrl: string | null;
  faculty: string | null;
  major: string | null;
  groups: Array<{
    id: string;
    name: string;
    course: number;
    subject: {
      id: string;
      name: string;
      code: string | null;
    };
    teacherName: string;
  }>;
  assignmentsStats: {
    totalAssigned: number;
    submittedCount: number;
    gradedCount: number;
    averageScore: number | null;
  };
  testsStats: {
    totalTests: number;
    attemptedCount: number;
    completedCount: number;
    averageScore: number | null;
  };
  metrics: {
    totalAverage: number | null;
    gradeLetter: string;
    completionRate: number;
  };
}

interface AcademicStudentsResponse {
  message: string;
  students: AcademicStudentItem[];
  pagination: {
    page: number;
    limit: number;
    totalStudents: number;
    totalPages: number;
  };
}

interface StudentDetailAssignment {
  id: string;
  title: string;
  subjectName: string;
  subjectCode: string | null;
  topicTitle: string;
  maxScore: number;
  deadline: string | null;
  status: string;
  score: number | null;
  percentage: number | null;
  submittedAt: string | null;
  gradedAt: string | null;
  teacherComment: string | null;
}

interface StudentDetailTest {
  id: string;
  title: string;
  subjectName: string;
  subjectCode: string | null;
  topicTitle: string | null;
  maxScore: number;
  durationMinutes: number;
  status: string;
  score: number | null;
  percentage: number | null;
  submittedAt: string | null;
}

interface StudentDetailTermGrade {
  groupId: string;
  groupName: string;
  subjectName: string;
  subjectCode: string | null;
  course: number;
  rk1: number | null;
  rk2: number | null;
  admissionRating: number | null;
  session: number | null;
  finalScore: number | null;
  gradeLetter: string | null;
  status: string;
  note: string | null;
  updatedAt: string | null;
}

interface StudentDetailResponse {
  message: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    course: number;
    university: string | null;
    faculty: string | null;
    major: string | null;
  };
  groups: Array<{
    id: string;
    name: string;
    course: number;
    subject: {
      name: string;
      code: string | null;
    };
    teacher: {
      fullName: string;
      email: string | null;
    };
  }>;
  assignments: StudentDetailAssignment[];
  tests: StudentDetailTest[];
  termGrades?: StudentDetailTermGrade[];
  metrics: {
    assignmentsAverage: number | null;
    testsAverage: number | null;
    totalAverage: number | null;
    gradeLetter: string;
    completionRate: number;
    submittedAssignmentsCount: number;
    totalAssignmentsCount: number;
    completedTestsCount: number;
    totalTestsCount: number;
  };
}

type TabType = 'STUDENTS' | 'GROUPS' | 'SUBJECTS';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

export const AdminAcademicPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('STUDENTS');

  // Overview Data
  const [overview, setOverview] = useState<AcademicOverviewResponse | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Students Data
  const [studentsData, setStudentsData] = useState<AcademicStudentsResponse | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(searchParams.get('groupId') || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(searchParams.get('subjectId') || '');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedPerformance, setSelectedPerformance] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);

  // Student Detail Modal
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // 1. Load Academic Overview
  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setOverviewError(null);
    try {
      const data = await api.get<AcademicOverviewResponse>('/api/admin/academic/overview');
      setOverview(data);
    } catch (err: any) {
      setOverviewError(err.message || 'Академиялық шолуды жүктеу сәтсіз аяқталды');
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  // 2. Load Students List
  const loadStudents = useCallback(async () => {
    setLoadingStudents(true);
    setStudentsError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedGroupId) params.set('groupId', selectedGroupId);
      if (selectedSubjectId) params.set('subjectId', selectedSubjectId);
      if (selectedCourse) params.set('course', selectedCourse);
      if (selectedPerformance !== 'ALL') params.set('performance', selectedPerformance);
      params.set('page', String(page));
      params.set('limit', '25');

      const data = await api.get<AcademicStudentsResponse>(
        `/api/admin/academic/students?${params.toString()}`,
      );
      setStudentsData(data);
    } catch (err: any) {
      setStudentsError(err.message || 'Студенттер тізімін жүктеу сәтсіз аяқталды');
    } finally {
      setLoadingStudents(false);
    }
  }, [searchQuery, selectedGroupId, selectedSubjectId, selectedCourse, selectedPerformance, page]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Update query params when group/subject changes
  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (selectedGroupId) nextParams.set('groupId', selectedGroupId);
    if (selectedSubjectId) nextParams.set('subjectId', selectedSubjectId);
    setSearchParams(nextParams);
  }, [selectedGroupId, selectedSubjectId, setSearchParams]);

  // Open Student Detail
  const handleOpenStudentDetail = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const res = await api.get<StudentDetailResponse>(
        `/api/admin/academic/students/${studentId}`,
      );
      setStudentDetail(res);
    } catch (err: any) {
      setDetailError(err.message || 'Студент ведомосін жүктеу мүмкін болмады');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetailModal = () => {
    setSelectedStudentId(null);
    setStudentDetail(null);
    setDetailError(null);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedGroupId('');
    setSelectedSubjectId('');
    setSelectedCourse('');
    setSelectedPerformance('ALL');
    setPage(1);
  };

  // CSV Export for Students Academic Performance
  const handleExportCSV = () => {
    if (!studentsData || !studentsData.students.length) return;

    const headers = [
      '"№"',
      '"Студент аты-жөні"',
      '"Email"',
      '"Курс"',
      '"Топтары"',
      '"Тапсырмалар орташа (%)"',
      '"Тесттер орташа (%)"',
      '"Орындалу үлесі (%)"',
      '"Қорытынды балл (%)"',
      '"Баға әрпі"',
    ];

    const rows = studentsData.students.map((s, idx) => {
      const groupNames = s.groups.map((g) => g.name).join('; ');
      return [
        idx + 1,
        `"${s.fullName}"`,
        `"${s.email}"`,
        s.course,
        `"${groupNames}"`,
        s.assignmentsStats.averageScore !== null ? s.assignmentsStats.averageScore : '""',
        s.testsStats.averageScore !== null ? s.testsStats.averageScore : '""',
        `${s.metrics.completionRate}%`,
        s.metrics.totalAverage !== null ? s.metrics.totalAverage : '""',
        `"${s.metrics.gradeLetter}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `SmartUni_Academic_Report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell userRole="ADMIN">
      <div className="su-admin-page">
        {/* Header */}
        <div className="su-admin-header">
          <div>
            <h1 className="su-admin-title">Академиялық Мониторинг</h1>
            <p className="su-admin-subtitle">
              Университет бойынша студенттердің үлгерімін, тапсырмалар мен тесттердің нәтижелерін орталықтандырылған бақылау
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Button
              variant="outline"
              icon={<Icon name="clock" size={16} />}
              onClick={() => {
                loadOverview();
                loadStudents();
              }}
              loading={loadingOverview || loadingStudents}
            >
              Жаңарту
            </Button>
            <Button
              variant="primary"
              icon={<Icon name="download" size={16} />}
              onClick={handleExportCSV}
              disabled={!studentsData || studentsData.students.length === 0}
            >
              CSV экспорттау
            </Button>
          </div>
        </div>

        {/* Global Error Banner */}
        {overviewError && (
          <div style={{ marginBottom: '24px' }}>
            <ErrorState
              title="Шолу мәліметтерін жүктеу қатесі"
              message={overviewError}
              onRetry={loadOverview}
            />
          </div>
        )}

        {/* Top Summary Stat Cards */}
        {loadingOverview ? (
          <div className="su-admin-stats-grid">
            <Skeleton height={96} borderRadius="12px" />
            <Skeleton height={96} borderRadius="12px" />
            <Skeleton height={96} borderRadius="12px" />
            <Skeleton height={96} borderRadius="12px" />
          </div>
        ) : overview ? (
          <div className="su-admin-stats-grid">
            {/* Card 1: Students & Groups */}
            <div className="su-admin-stat-card">
              <div className="su-admin-stat-icon su-stat-icon--primary">
                <Icon name="users" size={24} />
              </div>
              <div className="su-admin-stat-meta">
                <span className="su-admin-stat-label">СТУДЕНТТЕР МЕН ТОПТАР</span>
                <span className="su-admin-stat-value">
                  {overview.stats.totalStudents}{' '}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--su-text-muted)' }}>
                    / {overview.stats.activeGroupsCount} топ
                  </span>
                </span>
                <span className="su-admin-stat-desc">
                  Барлығы {overview.stats.totalSubjects} бекітілген пән
                </span>
              </div>
            </div>

            {/* Card 2: Graded Assignments */}
            <div className="su-admin-stat-card">
              <div className="su-admin-stat-icon su-stat-icon--info">
                <Icon name="file-text" size={24} />
              </div>
              <div className="su-admin-stat-meta">
                <span className="su-admin-stat-label">ТАПСЫРМАЛАР ОРТАША</span>
                <span className="su-admin-stat-value">
                  {overview.stats.averageAssignmentScore !== null
                    ? `${overview.stats.averageAssignmentScore}%`
                    : '—'}
                </span>
                <span className="su-admin-stat-desc">
                  {overview.stats.gradedSubmissionsCount} бағаланған жұмыс ({overview.stats.totalAssignments} тапсырма)
                </span>
              </div>
            </div>

            {/* Card 3: Test Results */}
            <div className="su-admin-stat-card">
              <div className="su-admin-stat-icon su-stat-icon--warning">
                <Icon name="check-circle" size={24} />
              </div>
              <div className="su-admin-stat-meta">
                <span className="su-admin-stat-label">ТЕСТТЕР ОРТАША</span>
                <span className="su-admin-stat-value">
                  {overview.stats.averageTestScore !== null
                    ? `${overview.stats.averageTestScore}%`
                    : '—'}
                </span>
                <span className="su-admin-stat-desc">
                  {overview.stats.completedAttemptsCount} өтілген әрекет ({overview.stats.totalTests} тест)
                </span>
              </div>
            </div>

            {/* Card 4: Overall Academic Average */}
            <div className="su-admin-stat-card">
              <div className="su-admin-stat-icon su-stat-icon--success">
                <Icon name="chart" size={24} />
              </div>
              <div className="su-admin-stat-meta">
                <span className="su-admin-stat-label">ЖАЛПЫ ҮЛГЕРІМ</span>
                <span className="su-admin-stat-value">
                  {overview.stats.overallAcademicAverage !== null
                    ? `${overview.stats.overallAcademicAverage}%`
                    : '—'}
                </span>
                <span className="su-admin-stat-desc">
                  Тапсыру үлесі: {overview.stats.submissionRate}%
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            borderBottom: '1px solid var(--su-border)',
            paddingBottom: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('STUDENTS')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: activeTab === 'STUDENTS' ? 700 : 500,
              borderRadius: 'var(--su-radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'STUDENTS' ? 'var(--su-primary)' : 'transparent',
              color: activeTab === 'STUDENTS' ? '#ffffff' : 'var(--su-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Icon name="users" size={16} />
            <span>Студенттер үлгерімі</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GROUPS')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: activeTab === 'GROUPS' ? 700 : 500,
              borderRadius: 'var(--su-radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'GROUPS' ? 'var(--su-primary)' : 'transparent',
              color: activeTab === 'GROUPS' ? '#ffffff' : 'var(--su-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Icon name="layers" size={16} />
            <span>Топтар бойынша ({overview?.groupsList.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SUBJECTS')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: activeTab === 'SUBJECTS' ? 700 : 500,
              borderRadius: 'var(--su-radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'SUBJECTS' ? 'var(--su-primary)' : 'transparent',
              color: activeTab === 'SUBJECTS' ? '#ffffff' : 'var(--su-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Icon name="book" size={16} />
            <span>Пәндер бойынша ({overview?.subjectsList.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: STUDENTS MONITORING */}
        {activeTab === 'STUDENTS' && (
          <>
            {/* Filter Controls Bar */}
            <Card padding="md" style={{ marginBottom: '16px', background: 'var(--su-bg-surface)' }}>
              <CardBody style={{ padding: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '12px',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Search Input */}
                  <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '320px' }}>
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
                      placeholder="Аты-жөні немесе email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
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

                  {/* Dropdown Filters */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    {/* Group Filter */}
                    <select
                      value={selectedGroupId}
                      onChange={(e) => {
                        setSelectedGroupId(e.target.value);
                        setPage(1);
                      }}
                      style={{
                        padding: '7px 12px',
                        fontSize: '13px',
                        borderRadius: 'var(--su-radius-md)',
                        border: '1px solid var(--su-input-border)',
                        backgroundColor: 'var(--su-input-bg)',
                        color: 'var(--su-text-main)',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Барлық топтар</option>
                      {overview?.groupsList.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.subject.name})
                        </option>
                      ))}
                    </select>

                    {/* Subject Filter */}
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => {
                        setSelectedSubjectId(e.target.value);
                        setPage(1);
                      }}
                      style={{
                        padding: '7px 12px',
                        fontSize: '13px',
                        borderRadius: 'var(--su-radius-md)',
                        border: '1px solid var(--su-input-border)',
                        backgroundColor: 'var(--su-input-bg)',
                        color: 'var(--su-text-main)',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Барлық пәндер</option>
                      {overview?.subjectsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.code ? `(${s.code})` : ''}
                        </option>
                      ))}
                    </select>

                    {/* Course Filter */}
                    <select
                      value={selectedCourse}
                      onChange={(e) => {
                        setSelectedCourse(e.target.value);
                        setPage(1);
                      }}
                      style={{
                        padding: '7px 12px',
                        fontSize: '13px',
                        borderRadius: 'var(--su-radius-md)',
                        border: '1px solid var(--su-input-border)',
                        backgroundColor: 'var(--su-input-bg)',
                        color: 'var(--su-text-main)',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Барлық курстар</option>
                      <option value="1">1-курс</option>
                      <option value="2">2-курс</option>
                      <option value="3">3-курс</option>
                      <option value="4">4-курс</option>
                    </select>

                    {/* Performance Filter */}
                    <select
                      value={selectedPerformance}
                      onChange={(e) => {
                        setSelectedPerformance(e.target.value);
                        setPage(1);
                      }}
                      style={{
                        padding: '7px 12px',
                        fontSize: '13px',
                        borderRadius: 'var(--su-radius-md)',
                        border: '1px solid var(--su-input-border)',
                        backgroundColor: 'var(--su-input-bg)',
                        color: 'var(--su-text-main)',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="ALL">Барлық үлгерім</option>
                      <option value="EXCELLENT">Үздіктер (≥ 85%)</option>
                      <option value="GOOD">Жақсы (70–84%)</option>
                      <option value="SATISFACTORY">Қанағаттанарлық (50–69%)</option>
                      <option value="AT_RISK">Назар аударатындар (&lt; 50%)</option>
                    </select>

                    {/* Clear Button */}
                    {(searchQuery || selectedGroupId || selectedSubjectId || selectedCourse || selectedPerformance !== 'ALL') && (
                      <Button variant="outline" onClick={handleClearFilters}>
                        Тазалау
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Students Table */}
            {studentsError && (
              <div style={{ marginBottom: '16px' }}>
                <ErrorState
                  title="Студенттерді жүктеу қатесі"
                  message={studentsError}
                  onRetry={loadStudents}
                />
              </div>
            )}

            {loadingStudents ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Skeleton height={52} borderRadius="8px" />
                <Skeleton height={52} borderRadius="8px" />
                <Skeleton height={52} borderRadius="8px" />
                <Skeleton height={52} borderRadius="8px" />
              </div>
            ) : !studentsData || studentsData.students.length === 0 ? (
              <Card padding="lg" style={{ textAlign: 'center' }}>
                <EmptyState
                  icon={<Icon name="search" size={40} />}
                  title="Студенттер табылмады"
                  description="Сүзгі критерийлері бойынша ешбір студент табылмады. Сүзгілерді тазалап көріңіз."
                  action={
                    <Button variant="outline" onClick={handleClearFilters}>
                      Сүзгілерді қалпына келтіру
                    </Button>
                  }
                />
              </Card>
            ) : (
              <Card padding="none" style={{ background: 'var(--su-bg-surface)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px',
                      textAlign: 'left',
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
                        <th style={{ padding: '12px 16px', minWidth: '220px' }}>Студент аты-жөні</th>
                        <th style={{ padding: '12px 14px', minWidth: '160px' }}>Топтары</th>
                        <th style={{ padding: '12px 14px', minWidth: '130px', textAlign: 'center' }}>
                          Тапсырмалар орташа
                        </th>
                        <th style={{ padding: '12px 14px', minWidth: '130px', textAlign: 'center' }}>
                          Тесттер орташа
                        </th>
                        <th style={{ padding: '12px 14px', minWidth: '130px', textAlign: 'center' }}>
                          Орындалу үлесі
                        </th>
                        <th style={{ padding: '12px 16px', minWidth: '140px', textAlign: 'center' }}>
                          Қорытынды балл
                        </th>
                        <th style={{ padding: '12px 16px', width: '100px', textAlign: 'right' }}>Әрекет</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsData.students.map((student, idx) => {
                        const totalScoreStyle = getScoreColor(student.metrics.totalAverage);
                        const isEven = idx % 2 === 0;

                        return (
                          <tr
                            key={student.id}
                            style={{
                              backgroundColor: isEven ? 'var(--su-bg-surface)' : 'var(--su-bg-subtle, rgba(0,0,0,0.015))',
                              borderBottom: '1px solid var(--su-border)',
                            }}
                          >
                            {/* Student Profile Info */}
                            <td style={{ padding: '12px 16px' }}>
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
                                  <div style={{ fontWeight: 600, color: 'var(--su-text-main)' }}>
                                    {student.fullName}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--su-text-muted)' }}>
                                    {student.email} • {student.course}-курс
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Enrolled Groups */}
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {student.groups.length > 0 ? (
                                  student.groups.map((g) => (
                                    <Badge key={g.id} variant="neutral">
                                      {g.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span style={{ color: 'var(--su-text-muted)', fontSize: '12px' }}>
                                    Топсыз
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Assignments Stats */}
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              {student.assignmentsStats.averageScore !== null ? (
                                <div>
                                  <span style={{ fontWeight: 700, color: 'var(--su-text-main)' }}>
                                    {student.assignmentsStats.averageScore}%
                                  </span>
                                  <div style={{ fontSize: '10px', color: 'var(--su-text-muted)' }}>
                                    {student.assignmentsStats.gradedCount} / {student.assignmentsStats.totalAssigned}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--su-text-muted)' }}>—</span>
                              )}
                            </td>

                            {/* Tests Stats */}
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              {student.testsStats.averageScore !== null ? (
                                <div>
                                  <span style={{ fontWeight: 700, color: 'var(--su-text-main)' }}>
                                    {student.testsStats.averageScore}%
                                  </span>
                                  <div style={{ fontSize: '10px', color: 'var(--su-text-muted)' }}>
                                    {student.testsStats.completedCount} / {student.testsStats.totalTests}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--su-text-muted)' }}>—</span>
                              )}
                            </td>

                            {/* Completion Rate */}
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <div>
                                <span style={{ fontWeight: 600, fontSize: '12px' }}>
                                  {student.metrics.completionRate}%
                                </span>
                                <div
                                  style={{
                                    width: '60px',
                                    height: '4px',
                                    backgroundColor: 'var(--su-border)',
                                    borderRadius: '2px',
                                    margin: '3px auto 0',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${student.metrics.completionRate}%`,
                                      height: '100%',
                                      backgroundColor: '#2563eb',
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Total Average */}
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              {student.metrics.totalAverage !== null ? (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 8px',
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
                                    • {student.metrics.gradeLetter}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--su-text-muted)' }}>—</span>
                              )}
                            </td>

                            {/* Action: Open Detail */}
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <Button
                                variant="outline"
                                onClick={() => handleOpenStudentDetail(student.id)}
                              >
                                Ведомос
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                {studentsData.pagination.totalPages > 1 && (
                  <div
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--su-border)',
                      backgroundColor: 'var(--su-bg-surface)',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>
                      Барлығы: {studentsData.pagination.totalStudents} студент (Бет {page} / {studentsData.pagination.totalPages})
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        Алдыңғы
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.min(studentsData.pagination.totalPages, p + 1))}
                        disabled={page >= studentsData.pagination.totalPages}
                      >
                        Келесі
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </>
        )}

        {/* TAB 2: GROUPS MONITORING */}
        {activeTab === 'GROUPS' && (
          <Card padding="none" style={{ background: 'var(--su-bg-surface)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'var(--su-bg-secondary)',
                      borderBottom: '2px solid var(--su-border)',
                      color: 'var(--su-text-muted)',
                      fontSize: '12px',
                    }}
                  >
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Топ атауы</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Бекітілген пән</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Оқытушы</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Курс / Семестр</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Белсенді студенттер</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Студенттерін көру</th>
                  </tr>
                </thead>
                <tbody>
                  {overview?.groupsList.map((group, idx) => (
                    <tr
                      key={group.id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? 'var(--su-bg-surface)' : 'var(--su-bg-subtle, rgba(0,0,0,0.015))',
                        borderBottom: '1px solid var(--su-border)',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--su-text-main)' }}>
                        {group.name}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {group.subject.name} {group.subject.code ? `(${group.subject.code})` : ''}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--su-text-muted)' }}>
                        {group.teacherName}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {group.course}-курс • {group.semester}-сем
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>
                        {group.activeStudentsCount} студент
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedGroupId(group.id);
                            setActiveTab('STUDENTS');
                          }}
                        >
                          Сүзу
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 3: SUBJECTS MONITORING */}
        {activeTab === 'SUBJECTS' && (
          <Card padding="none" style={{ background: 'var(--su-bg-surface)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'var(--su-bg-secondary)',
                      borderBottom: '2px solid var(--su-border)',
                      color: 'var(--su-text-muted)',
                      fontSize: '12px',
                    }}
                  >
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Пән атауы</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left' }}>Коды</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Белсенді топтар</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Тақырыптар саны</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>Тесттер саны</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Сүзу</th>
                  </tr>
                </thead>
                <tbody>
                  {overview?.subjectsList.map((subject, idx) => (
                    <tr
                      key={subject.id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? 'var(--su-bg-surface)' : 'var(--su-bg-subtle, rgba(0,0,0,0.015))',
                        borderBottom: '1px solid var(--su-border)',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--su-text-main)' }}>
                        {subject.name}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--su-text-muted)' }}>
                        {subject.code || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>
                        {subject.activeGroupsCount} топ
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {subject.topicsCount}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {subject.testsCount}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedSubjectId(subject.id);
                            setActiveTab('STUDENTS');
                          }}
                        >
                          Студенттерін көру
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* STUDENT ACADEMIC DETAIL MODAL */}
        {selectedStudentId && (
          <Modal
            isOpen={Boolean(selectedStudentId)}
            onClose={handleCloseDetailModal}
            title={studentDetail ? `Студент ведомосі: ${studentDetail.student.fullName}` : 'Студент ведомосі'}
          >
            {loadingDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 0' }}>
                <Skeleton height={56} borderRadius="8px" />
                <Skeleton height={72} borderRadius="8px" />
                <Skeleton height={140} borderRadius="8px" />
              </div>
            ) : detailError ? (
              <ErrorState title="Қате" message={detailError} onRetry={() => handleOpenStudentDetail(selectedStudentId)} />
            ) : studentDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Profile Banner */}
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
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--su-primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 700,
                    }}
                  >
                    {studentDetail.student.fullName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--su-text-main)' }}>
                      {studentDetail.student.fullName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>
                      {studentDetail.student.email} • {studentDetail.student.course}-курс • {studentDetail.student.major || 'Мамандығы көрсетілмеген'}
                    </div>
                  </div>
                </div>

                {/* Metrics Summary Row */}
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
                      {studentDetail.metrics.assignmentsAverage !== null
                        ? `${studentDetail.metrics.assignmentsAverage}%`
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
                      {studentDetail.metrics.testsAverage !== null
                        ? `${studentDetail.metrics.testsAverage}%`
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
                      {studentDetail.metrics.totalAverage !== null
                        ? `${studentDetail.metrics.totalAverage}% (${studentDetail.metrics.gradeLetter})`
                        : '—'}
                    </div>
                  </div>
                </div>

                {/* Term Grades & Ratings (РК-1, РК-2, Сессия) */}
                {studentDetail.termGrades && studentDetail.termGrades.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--su-text-main)' }}>
                      Рейтингтік және сессиялық бағалар ({studentDetail.termGrades.length})
                    </h4>
                    <div style={{ overflowX: 'auto', border: '1px solid var(--su-border)', borderRadius: 'var(--su-radius-sm)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--su-bg-secondary)', borderBottom: '1px solid var(--su-border)', color: 'var(--su-text-muted)' }}>
                            <th style={{ padding: '8px 12px' }}>Пән / Топ</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>РК-1</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>РК-2</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>РД</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>Сессия</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>Қорытынды</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>Әріп</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentDetail.termGrades.map((g) => (
                            <tr key={g.groupId} style={{ borderBottom: '1px solid var(--su-border)' }}>
                              <td style={{ padding: '8px 12px' }}>
                                <div style={{ fontWeight: 600, color: 'var(--su-text-main)' }}>{g.subjectName}</div>
                                <div style={{ fontSize: '11px', color: 'var(--su-text-muted)' }}>{g.groupName}</div>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 600 }}>
                                {g.rk1 !== null ? g.rk1 : '—'}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 600 }}>
                                {g.rk2 !== null ? g.rk2 : '—'}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: (g.admissionRating ?? 0) >= 50 ? '#059669' : '#dc2626' }}>
                                {g.admissionRating !== null ? g.admissionRating : '—'}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 600 }}>
                                {g.session !== null ? g.session : '—'}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 800, color: (g.finalScore ?? 0) >= 50 ? '#059669' : '#dc2626' }}>
                                {g.finalScore !== null ? g.finalScore : '—'}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>
                                {g.gradeLetter || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Assignments List */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--su-text-main)' }}>
                    Тапсырмалар ведомосі ({studentDetail.assignments.length})
                  </h4>
                  {studentDetail.assignments.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>Тапсырмалар жоқ</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                      {studentDetail.assignments.map((a) => (
                        <div
                          key={a.id}
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
                            <div style={{ fontWeight: 600, color: 'var(--su-text-main)' }}>
                              {a.title} ({a.subjectName})
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--su-text-muted)' }}>
                              Тақырып: {a.topicTitle} {a.deadline && `• Мерзімі: ${formatDate(a.deadline)}`}
                            </div>
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

                {/* Tests List */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--su-text-main)' }}>
                    Тесттер нәтижелері ({studentDetail.tests.length})
                  </h4>
                  {studentDetail.tests.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>Тесттер жоқ</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                      {studentDetail.tests.map((t) => (
                        <div
                          key={t.id}
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
                            <div style={{ fontWeight: 600, color: 'var(--su-text-main)' }}>
                              {t.title} ({t.subjectName})
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--su-text-muted)' }}>
                              Ұзақтығы: {t.durationMinutes} мин
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {t.status === 'COMPLETED' && t.score !== null ? (
                              <span style={{ fontWeight: 700, color: '#059669' }}>
                                {t.score} / {t.maxScore} ({t.percentage}%)
                              </span>
                            ) : t.status === 'IN_PROGRESS' ? (
                              <span style={{ color: '#2563eb', fontWeight: 600 }}>Өтуде</span>
                            ) : (
                              <span style={{ color: 'var(--su-text-muted)' }}>Өтілмеген</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <Button variant="outline" onClick={handleCloseDetailModal}>
                    Жабу
                  </Button>
                </div>
              </div>
            ) : null}
          </Modal>
        )}
      </div>
    </AppShell>
  );
};

export default AdminAcademicPage;
