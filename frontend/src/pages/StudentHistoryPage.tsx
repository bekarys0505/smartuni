import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  StatCard,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { api } from '../utils/api';

interface StudentGradeSubject {
  groupId: string;
  groupName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  course: number;
  semester: number;
  academicYear: string;
  teacher: {
    fullName: string;
    email: string | null;
  };
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

interface StudentGradesSummary {
  totalSubjects: number;
  completedSubjects: number;
  incompleteSubjects: number;
  averageRk1: number | null;
  averageRk2: number | null;
  averageAdmissionRating: number | null;
  averageSession: number | null;
  averageFinalScore: number | null;
  gpa: number | null;
}

export const StudentHistoryPage: React.FC = () => {
  const [subjects, setSubjects] = useState<StudentGradeSubject[]>([]);
  const [summary, setSummary] = useState<StudentGradesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');

  const fetchGrades = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{
        summary: StudentGradesSummary;
        subjects?: StudentGradeSubject[];
        grades?: StudentGradeSubject[];
      }>('/api/student/grades');

      const items = data.subjects || data.grades || [];
      setSubjects(items);
      setSummary(data.summary || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Оқу тарихын жүктеу мүмкін болмады';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const getLetterBadgeColor = (letter: string | null): string => {
    if (!letter || letter === '—') return '#64748b';
    if (letter.startsWith('A')) return '#059669';
    if (letter.startsWith('B')) return '#2563eb';
    if (letter.startsWith('C')) return '#d97706';
    if (letter.startsWith('D')) return '#ea580c';
    return '#dc2626';
  };

  const years = Array.from(new Set(subjects.map((g) => g.academicYear)));
  const semesters = Array.from(new Set(subjects.map((g) => String(g.semester))));

  const filteredSubjects = subjects.filter((g) => {
    if (selectedYear !== 'ALL' && g.academicYear !== selectedYear) return false;
    if (selectedSemester !== 'ALL' && String(g.semester) !== selectedSemester) return false;
    return true;
  });

  const totalCredits = filteredSubjects.length * 5; // standard 5 ECTS per discipline
  const displayGpa = summary?.gpa !== null && summary?.gpa !== undefined
    ? Number(summary.gpa).toFixed(2)
    : '—';
  const displayAvg = summary?.averageFinalScore !== null && summary?.averageFinalScore !== undefined
    ? `${summary.averageFinalScore} / 100`
    : '—';

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell userRole="STUDENT">
      <div className="su-page-container">
        <PageHeader
          title="Оқу тарихы және транскрипт"
          subtitle="Өткен семестрлердегі академиялық үлгерім, қорытынды бағалар, GPA және кредиттер"
          breadcrumbs={[{ label: 'Студент', path: '/student/dashboard' }, { label: 'Оқу тарихы' }]}
          actions={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="outline" size="sm" onClick={fetchGrades} loading={loading}>
                <Icon name="refresh" size={16} /> Жаңарту
              </Button>
              <Button variant="primary" size="sm" onClick={handlePrint}>
                <Icon name="file-text" size={16} /> Транскриптті басып шығару (PDF)
              </Button>
            </div>
          }
        />

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard
            label="Жалпы GPA"
            value={displayGpa}
            hint="4.00 шкаласы бойынша (базадан)"
            icon={<Icon name="award" size={20} />}
          />
          <StatCard
            label="Орташа қорытынды балл"
            value={displayAvg}
            hint="Академиялық орташа көрсеткіш"
            icon={<Icon name="chart" size={20} />}
          />
          <StatCard
            label="Жиналған кредиттер"
            value={`${totalCredits} ECTS`}
            hint="Меңгерілген пәндер көлемі"
            icon={<Icon name="book" size={20} />}
          />
          <StatCard
            label="Барлық пәндер саны"
            value={filteredSubjects.length}
            hint="Тіркелген курстар"
            icon={<Icon name="layers" size={20} />}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>
              Оқу жылы
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                background: '#fff',
              }}
            >
              <option value="ALL">Барлық оқу жылдары</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y} оқу жылы
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>
              Семестр
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                background: '#fff',
              }}
            >
              <option value="ALL">Барлық семестрлер</option>
              {semesters.map((s) => (
                <option key={s} value={s}>
                  {s}-семестр
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <Card padding="md">
            <Skeleton height={32} width="100%" />
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Skeleton height={24} />
              <Skeleton height={24} />
              <Skeleton height={24} />
            </div>
          </Card>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchGrades} />
        ) : filteredSubjects.length === 0 ? (
          <EmptyState
            title="Оқу тарихы табылмады"
            description="Бұл кезеңге тіркелген бағалар мен академиялық жазбалар жоқ."
            icon="clock"
          />
        ) : (
          <Card padding="none">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Пән атауы</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Топ</th>
                    <th style={{ padding: '0.85rem 1rem' }}>РК-1</th>
                    <th style={{ padding: '0.85rem 1rem' }}>РК-2</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Рейтинг</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Сессия</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Қорытынды</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Әріптік баға</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Кредит</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((g) => {
                    const badgeColor = getLetterBadgeColor(g.gradeLetter);
                    return (
                      <tr key={g.groupId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <strong style={{ color: '#0f172a', display: 'block' }}>{g.subjectName}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {g.subjectCode || 'Пән коды'} | {g.teacher?.fullName || 'Оқытушы'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>{g.groupName}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{g.rk1 !== null ? g.rk1 : '—'}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{g.rk2 !== null ? g.rk2 : '—'}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                          {g.admissionRating !== null ? g.admissionRating : '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{g.session !== null ? g.session : '—'}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                          {g.finalScore !== null ? g.finalScore : '—'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              color: '#fff',
                              background: badgeColor,
                            }}
                          >
                            {g.gradeLetter || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>5 ECTS</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
};

export default StudentHistoryPage;
