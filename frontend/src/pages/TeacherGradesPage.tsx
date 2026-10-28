import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  CardBody,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { api } from '../utils/api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type AssessmentPeriodType = 'RK1' | 'RK2' | 'SESSION' | 'ALL';

interface TeacherGroupOption {
  id: string;
  name: string;
  course: number;
  semester: number;
  academicYear: string;
  capacity?: number;
  activeStudentsCount?: number;
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
  lessonDay?: string | null;
  lessonTime?: string | null;
  classroom?: string | null;
}

interface StudentGradeItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  rk1: number | null;
  rk2: number | null;
  session: number | null;
  admissionRating: number | null;
  finalScore: number | null;
  gradeLetter: string | null;
  status: 'COMPLETE' | 'INCOMPLETE' | 'NOT_STARTED';
  note: string | null;
  updatedAt: string | null;
}

interface GroupGradesResponse {
  message: string;
  group: {
    id: string;
    name: string;
    course: number;
    semester: number;
    academicYear: string;
    lessonDay: string | null;
    lessonTime: string | null;
    classroom: string | null;
    subject: {
      id: string;
      name: string;
      code: string | null;
    };
  };
  stats: {
    totalStudents: number;
    rk1Count: number;
    rk2Count: number;
    sessionCount: number;
    completeCount: number;
    rk1Average: number | null;
    rk2Average: number | null;
    sessionAverage: number | null;
    finalAverage: number | null;
  };
  students: StudentGradeItem[];
}

interface LocalStudentDraft {
  rk1: string;
  rk2: string;
  session: string;
  note: string;
}

interface TeacherGradesPageProps {
  defaultPeriod?: AssessmentPeriodType;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calcAdmission(rk1: number | null, rk2: number | null): number | null {
  if (rk1 === null || rk2 === null) return null;
  return Math.round(((rk1 + rk2) / 2) * 10) / 10;
}

function calcFinal(rk1: number | null, rk2: number | null, session: number | null): number | null {
  if (rk1 === null || rk2 === null || session === null) return null;
  const admission = (rk1 + rk2) / 2;
  return Math.round((0.6 * admission + 0.4 * session) * 10) / 10;
}

function getGradeLetter(finalScore: number | null, sessionScore: number | null): string {
  if (finalScore === null) return '—';
  if (sessionScore !== null && sessionScore < 50) return 'F';
  if (finalScore >= 95) return 'A';
  if (finalScore >= 90) return 'A-';
  if (finalScore >= 85) return 'B+';
  if (finalScore >= 80) return 'B';
  if (finalScore >= 75) return 'B-';
  if (finalScore >= 70) return 'C+';
  if (finalScore >= 65) return 'C';
  if (finalScore >= 60) return 'C-';
  if (finalScore >= 50) return 'D';
  return 'F';
}

function getScoreBadgeVariant(score: number | null): 'success' | 'info' | 'warning' | 'danger' | 'neutral' {
  if (score === null) return 'neutral';
  if (score >= 85) return 'success';
  if (score >= 70) return 'info';
  if (score >= 50) return 'warning';
  return 'danger';
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TeacherGradesPage: React.FC<TeacherGradesPageProps> = ({
  defaultPeriod = 'ALL',
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active assessment period tab: 'RK1' | 'RK2' | 'SESSION' | 'ALL'
  const initialPeriod = (searchParams.get('period') as AssessmentPeriodType) || defaultPeriod;
  const [activePeriod, setActivePeriod] = useState<AssessmentPeriodType>(initialPeriod);

  // Group selection state
  const [groups, setGroups] = useState<TeacherGroupOption[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    searchParams.get('groupId') || '',
  );

  // Grades server response
  const [gradesData, setGradesData] = useState<GroupGradesResponse | null>(null);
  const [loadingGrades, setLoadingGrades] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Local draft state for editable inputs: studentId -> { rk1, rk2, session, note }
  const [localGrades, setLocalGrades] = useState<Record<string, LocalStudentDraft>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter/search
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Fetch Teacher Groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoadingGroups(true);
        setError(null);
        const res = await api.get<{ groups?: TeacherGroupOption[] } | TeacherGroupOption[]>('/api/teacher/groups');
        const list = Array.isArray(res) ? res : res.groups || [];
        setGroups(list);

        const urlGroupId = searchParams.get('groupId');
        if (urlGroupId && list.some((g) => g.id === urlGroupId)) {
          setSelectedGroupId(urlGroupId);
        } else if (list.length > 0) {
          setSelectedGroupId(list[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Топтар тізімін жүктеу қатесі');
      } finally {
        setLoadingGroups(false);
      }
    };

    fetchGroups();
  }, []);

  // 2. Fetch Group Grades
  const fetchGroupGrades = async (groupId: string) => {
    if (!groupId) return;
    try {
      setLoadingGrades(true);
      setError(null);
      setSuccessToast(null);

      const res = await api.get<GroupGradesResponse>(`/api/teacher/groups/${groupId}/grades`);
      setGradesData(res);

      // Populate local editable drafts
      const draftMap: Record<string, LocalStudentDraft> = {};
      for (const st of res.students) {
        draftMap[st.id] = {
          rk1: st.rk1 !== null ? String(st.rk1) : '',
          rk2: st.rk2 !== null ? String(st.rk2) : '',
          session: st.session !== null ? String(st.session) : '',
          note: st.note || '',
        };
      }
      setLocalGrades(draftMap);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setError(err.message || 'Академиялық бағаларды жүктеу қатесі');
      setGradesData(null);
    } finally {
      setLoadingGrades(false);
    }
  };

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupGrades(selectedGroupId);
      setSearchParams({ groupId: selectedGroupId, period: activePeriod }, { replace: true });
    }
  }, [selectedGroupId]);

  // Handle period change
  const handlePeriodChange = (period: AssessmentPeriodType) => {
    setActivePeriod(period);
    setSearchParams({ groupId: selectedGroupId, period }, { replace: true });
  };

  // Warn before leaving if changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Cell change handlers
  const handleGradeCellChange = (
    studentId: string,
    field: 'rk1' | 'rk2' | 'session' | 'note',
    value: string,
  ) => {
    setLocalGrades((prev) => {
      const current = prev[studentId] || { rk1: '', rk2: '', session: '', note: '' };
      return {
        ...prev,
        [studentId]: {
          ...current,
          [field]: value,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  // Save handler
  const handleSave = async () => {
    if (!selectedGroupId || !gradesData) return;

    // Validate grades: all numbers must be 0..100
    const gradesPayload: Array<{
      studentId: string;
      rk1?: number | null;
      rk2?: number | null;
      session?: number | null;
      note?: string | null;
    }> = [];

    for (const st of gradesData.students) {
      const draft = localGrades[st.id];
      if (!draft) continue;

      const parseField = (val: string): number | null => {
        if (!val.trim()) return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      };

      const rk1Num = parseField(draft.rk1);
      const rk2Num = parseField(draft.rk2);
      const sessionNum = parseField(draft.session);

      if (rk1Num !== null && (rk1Num < 0 || rk1Num > 100)) {
        alert(`${st.fullName}: РК-1 балы 0 мен 100 аралығында болуы керек.`);
        return;
      }
      if (rk2Num !== null && (rk2Num < 0 || rk2Num > 100)) {
        alert(`${st.fullName}: РК-2 балы 0 мен 100 аралығында болуы керек.`);
        return;
      }
      if (sessionNum !== null && (sessionNum < 0 || sessionNum > 100)) {
        alert(`${st.fullName}: Сессия балы 0 мен 100 аралығында болуы керек.`);
        return;
      }

      gradesPayload.push({
        studentId: st.id,
        rk1: rk1Num,
        rk2: rk2Num,
        session: sessionNum,
        note: draft.note ? draft.note.trim() : null,
      });
    }

    try {
      setSaving(true);
      setError(null);

      await api.post(`/api/teacher/groups/${selectedGroupId}/grades`, {
        period: activePeriod,
        grades: gradesPayload,
      });

      setSuccessToast('Бағалар ведомосы сәтті сақталды!');
      setHasUnsavedChanges(false);

      // Refresh from backend
      await fetchGroupGrades(selectedGroupId);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Бағаларды сақтау кезінде қате орын алды');
    } finally {
      setSaving(false);
    }
  };

  // Reset handler
  const handleReset = () => {
    if (!gradesData) return;
    const draftMap: Record<string, LocalStudentDraft> = {};
    for (const st of gradesData.students) {
      draftMap[st.id] = {
        rk1: st.rk1 !== null ? String(st.rk1) : '',
        rk2: st.rk2 !== null ? String(st.rk2) : '',
        session: st.session !== null ? String(st.session) : '',
        note: st.note || '',
      };
    }
    setLocalGrades(draftMap);
    setHasUnsavedChanges(false);
  };

  // CSV Export handler
  const handleExportCSV = () => {
    if (!gradesData || !gradesData.students.length) return;

    const headers = [
      '"№"',
      '"Студент аты-жөні"',
      '"Email"',
      '"РК-1 (0-100)"',
      '"РК-2 (0-100)"',
      '"Рұқсат рейтингі РД"',
      '"Сессия емтиханы (0-100)"',
      '"Қорытынды балл"',
      '"Әріптік баға"',
      '"Күйі"',
      '"Ескертпе"',
    ];

    const rows = gradesData.students.map((st, idx) => {
      const draft = localGrades[st.id] || { rk1: '', rk2: '', session: '', note: '' };
      const rk1Val = draft.rk1 ? Number(draft.rk1) : null;
      const rk2Val = draft.rk2 ? Number(draft.rk2) : null;
      const sessionVal = draft.session ? Number(draft.session) : null;
      const admission = calcAdmission(rk1Val, rk2Val);
      const finalScore = calcFinal(rk1Val, rk2Val, sessionVal);
      const letter = getGradeLetter(finalScore, sessionVal);

      let statusStr = 'Басталмаған';
      if (rk1Val !== null && rk2Val !== null && sessionVal !== null) {
        statusStr = 'Аяқталды';
      } else if (rk1Val !== null || rk2Val !== null || sessionVal !== null) {
        statusStr = 'Толық емес';
      }

      return [
        idx + 1,
        `"${st.fullName}"`,
        `"${st.email}"`,
        rk1Val !== null ? rk1Val : '""',
        rk2Val !== null ? rk2Val : '""',
        admission !== null ? admission : '""',
        sessionVal !== null ? sessionVal : '""',
        finalScore !== null ? finalScore : '""',
        `"${letter}"`,
        `"${statusStr}"`,
        `"${draft.note || ''}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `SmartUni_Grades_${gradesData.group.name}_${activePeriod}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live Stats computed from localGrades
  const liveStats = useMemo(() => {
    if (!gradesData) {
      return {
        total: 0,
        rk1Count: 0,
        rk2Count: 0,
        sessionCount: 0,
        completeCount: 0,
        rk1Average: null,
        rk2Average: null,
        admissionAverage: null,
        sessionAverage: null,
        finalAverage: null,
      };
    }

    let rk1Sum = 0;
    let rk1Count = 0;
    let rk2Sum = 0;
    let rk2Count = 0;
    let admissionSum = 0;
    let admissionCount = 0;
    let sessionSum = 0;
    let sessionCount = 0;
    let finalSum = 0;
    let finalCount = 0;
    let completeCount = 0;

    for (const st of gradesData.students) {
      const draft = localGrades[st.id];
      if (!draft) continue;

      const rk1Val = draft.rk1.trim() !== '' && !isNaN(Number(draft.rk1)) ? Number(draft.rk1) : null;
      const rk2Val = draft.rk2.trim() !== '' && !isNaN(Number(draft.rk2)) ? Number(draft.rk2) : null;
      const sessionVal = draft.session.trim() !== '' && !isNaN(Number(draft.session)) ? Number(draft.session) : null;

      if (rk1Val !== null && rk1Val >= 0 && rk1Val <= 100) {
        rk1Sum += rk1Val;
        rk1Count++;
      }
      if (rk2Val !== null && rk2Val >= 0 && rk2Val <= 100) {
        rk2Sum += rk2Val;
        rk2Count++;
      }
      if (sessionVal !== null && sessionVal >= 0 && sessionVal <= 100) {
        sessionSum += sessionVal;
        sessionCount++;
      }

      const admission = calcAdmission(rk1Val, rk2Val);
      if (admission !== null) {
        admissionSum += admission;
        admissionCount++;
      }

      const finalScore = calcFinal(rk1Val, rk2Val, sessionVal);
      if (finalScore !== null) {
        finalSum += finalScore;
        finalCount++;
      }

      if (rk1Val !== null && rk2Val !== null && sessionVal !== null) {
        completeCount++;
      }
    }

    const round1 = (val: number) => Math.round(val * 10) / 10;

    return {
      total: gradesData.students.length,
      rk1Count,
      rk2Count,
      sessionCount,
      completeCount,
      rk1Average: rk1Count > 0 ? round1(rk1Sum / rk1Count) : null,
      rk2Average: rk2Count > 0 ? round1(rk2Sum / rk2Count) : null,
      admissionAverage: admissionCount > 0 ? round1(admissionSum / admissionCount) : null,
      sessionAverage: sessionCount > 0 ? round1(sessionSum / sessionCount) : null,
      finalAverage: finalCount > 0 ? round1(finalSum / finalCount) : null,
    };
  }, [gradesData, localGrades]);

  // Filtered student list by search
  const filteredStudents = useMemo(() => {
    if (!gradesData) return [];
    if (!searchQuery.trim()) return gradesData.students;
    const q = searchQuery.toLowerCase().trim();
    return gradesData.students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [gradesData, searchQuery]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  // Dynamic header titles
  const getHeaderTitles = () => {
    switch (activePeriod) {
      case 'RK1':
        return {
          title: 'Рейтингтік бақылау 1 (РК-1)',
          subtitle: '1-аралық бақылау қорытынды ведомосын толтыру және бағалау (0–100 балл)',
        };
      case 'RK2':
        return {
          title: 'Рейтингтік бақылау 2 (РК-2)',
          subtitle: '2-аралық бақылау бағаларын қою және рұқсат рейтингін (РД) автоматты шығару',
        };
      case 'SESSION':
        return {
          title: 'Сессия — Емтихан бағалары',
          subtitle: 'Қорытынды емтихан бағаларын енгізу және семестрлік қорытынды баллды шығару',
        };
      default:
        return {
          title: 'Академиялық бағалау ведомосы',
          subtitle: 'РК-1, РК-2, Рұқсат рейтингі (РД), Сессия және Қорытынды бағаларды бірыңғай басқару',
        };
    }
  };

  const headerTitles = getHeaderTitles();

  return (
    <AppShell userRole="TEACHER">
      <div className="su-content-container" style={{ padding: '24px 0', maxWidth: '1440px', margin: '0 auto' }}>
        <PageHeader
          title={headerTitles.title}
          subtitle={headerTitles.subtitle}
          breadcrumbs={[
            { label: 'Оқытушы', path: '/teacher/dashboard' },
            { label: 'Бағалау ведомосы' },
          ]}
          actions={
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {selectedGroupId && (
                <>
                  <Button
                    variant="outline"
                    icon={<Icon name="chart" size={16} />}
                    onClick={() => navigate(`/teacher/journal?groupId=${selectedGroupId}`)}
                  >
                    Журнал
                  </Button>
                  <Button
                    variant="outline"
                    icon={<Icon name="check" size={16} />}
                    onClick={() => navigate(`/teacher/attendance?groupId=${selectedGroupId}`)}
                  >
                    Қатысу
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                icon={<Icon name="download" size={16} />}
                onClick={handleExportCSV}
                disabled={!gradesData || gradesData.students.length === 0}
              >
                CSV экспорттау
              </Button>
            </div>
          }
        />

        {/* FEEDBACK BANNERS */}
        {error && (
          <div style={{ marginBottom: '20px' }}>
            <ErrorState
              title="Бағаларды жүктеу немесе сақтау қатесі"
              message={error}
              onRetry={() => selectedGroupId && fetchGroupGrades(selectedGroupId)}
            />
          </div>
        )}

        {successToast && (
          <div
            style={{
              padding: '14px 20px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              color: '#065f46',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>✅</span>
              <span style={{ fontWeight: 600 }}>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* TOP BAR: GROUP SELECTOR & ACTIVE PERIOD TABS */}
        <Card style={{ marginBottom: '20px' }}>
          <CardBody style={{ padding: '20px 24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              {/* Group Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 360px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    color: '#2563eb',
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
                    htmlFor="group-grades-select"
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
                    Оқу тобы мен пәнді таңдаңыз:
                  </label>
                  {loadingGroups ? (
                    <Skeleton height="38px" borderRadius="8px" />
                  ) : groups.length === 0 ? (
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      Сізге бекітілген оқу топтары жоқ
                    </div>
                  ) : (
                    <select
                      id="group-grades-select"
                      value={selectedGroupId}
                      onChange={(e) => {
                        if (hasUnsavedChanges) {
                          if (!window.confirm('Сақталмаған өзгерістер бар. Басқа топқа ауысуды қалайсыз ба?')) {
                            return;
                          }
                        }
                        setSelectedGroupId(e.target.value);
                      }}
                      style={{
                        width: '100%',
                        maxWidth: '440px',
                        padding: '9px 14px',
                        fontSize: '14px',
                        fontWeight: 600,
                        borderRadius: '8px',
                        border: '1px solid var(--su-input-border)',
                        backgroundColor: 'var(--su-input-bg)',
                        color: 'var(--su-text-main)',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} — {g.subject.name} ({g.course}-курс)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Group Badges */}
              {selectedGroup && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge variant="neutral">
                    <Icon name="book" size={13} style={{ marginRight: '4px' }} />
                    {selectedGroup.subject.name}
                  </Badge>
                  <Badge variant="neutral">
                    {selectedGroup.course}-курс • {selectedGroup.semester}-семестр
                  </Badge>
                  <Badge variant="neutral">
                    Оқу жылы: {selectedGroup.academicYear}
                  </Badge>
                </div>
              )}
            </div>

            {/* PERIOD TABS */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '18px',
                paddingTop: '16px',
                borderTop: '1px solid #f1f5f9',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => handlePeriodChange('ALL')}
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: activePeriod === 'ALL' ? 700 : 500,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: activePeriod === 'ALL' ? '#2563eb' : '#cbd5e1',
                  backgroundColor: activePeriod === 'ALL' ? '#2563eb' : '#ffffff',
                  color: activePeriod === 'ALL' ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>📋</span>
                <span>Барлық бағандар (Толық ведомос)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePeriodChange('RK1')}
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: activePeriod === 'RK1' ? 700 : 500,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: activePeriod === 'RK1' ? '#2563eb' : '#cbd5e1',
                  backgroundColor: activePeriod === 'RK1' ? '#2563eb' : '#ffffff',
                  color: activePeriod === 'RK1' ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🎯</span>
                <span>РК-1 (1-аралық бақылау)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePeriodChange('RK2')}
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: activePeriod === 'RK2' ? 700 : 500,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: activePeriod === 'RK2' ? '#2563eb' : '#cbd5e1',
                  backgroundColor: activePeriod === 'RK2' ? '#2563eb' : '#ffffff',
                  color: activePeriod === 'RK2' ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🎯</span>
                <span>РК-2 (2-аралық бақылау)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePeriodChange('SESSION')}
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: activePeriod === 'SESSION' ? 700 : 500,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: activePeriod === 'SESSION' ? '#2563eb' : '#cbd5e1',
                  backgroundColor: activePeriod === 'SESSION' ? '#2563eb' : '#ffffff',
                  color: activePeriod === 'SESSION' ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>🎓</span>
                <span>Сессия (Қорытынды емтихан)</span>
              </button>
            </div>
          </CardBody>
        </Card>

        {/* LOADING GRADES SKELETON */}
        {loadingGrades ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <Skeleton height="90px" borderRadius="10px" />
              <Skeleton height="90px" borderRadius="10px" />
              <Skeleton height="90px" borderRadius="10px" />
              <Skeleton height="90px" borderRadius="10px" />
            </div>
            <Skeleton height="360px" borderRadius="12px" />
          </div>
        ) : !gradesData || gradesData.students.length === 0 ? (
          <Card>
            <CardBody style={{ padding: '48px', textAlign: 'center' }}>
              <EmptyState
                icon={<Icon name="users" size={48} />}
                title="Студенттер табылмады"
                description="Бұл топта әзірге студенттер жоқ немесе топ мүшелері бекітілмеген."
              />
            </CardBody>
          </Card>
        ) : (
          <>
            {/* STATS OVERVIEW CARDS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              {/* Card 1: Total Students */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>СТУДЕНТТЕР САНЫ</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {liveStats.total}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  {liveStats.completeCount} студент толық бағаланған
                </div>
              </div>

              {/* Card 2: RK-1 Average */}
              <div
                style={{
                  background: '#eff6ff',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid #bfdbfe',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#1e40af' }}>РК-1 ОРТАША</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>
                  {liveStats.rk1Average !== null ? `${liveStats.rk1Average}` : '—'}
                </div>
                <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px' }}>
                  {liveStats.rk1Count} / {liveStats.total} баға қойылды
                </div>
              </div>

              {/* Card 3: RK-2 Average */}
              <div
                style={{
                  background: '#faf5ff',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid #e9d5ff',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#6b21a8' }}>РК-2 ОРТАША</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#7e22ce', marginTop: '4px' }}>
                  {liveStats.rk2Average !== null ? `${liveStats.rk2Average}` : '—'}
                </div>
                <div style={{ fontSize: '11px', color: '#9333ea', marginTop: '2px' }}>
                  {liveStats.rk2Count} / {liveStats.total} баға қойылды
                </div>
              </div>

              {/* Card 4: Admission Rating Average */}
              <div
                style={{
                  background: '#f0fdf4',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid #bbf7d0',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#166534' }}>РҰҚСАТ РЕЙТИНГІ (РД)</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                  {liveStats.admissionAverage !== null ? `${liveStats.admissionAverage}` : '—'}
                </div>
                <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>
                  РД = (РК-1 + РК-2) / 2
                </div>
              </div>

              {/* Card 5: Session Average */}
              <div
                style={{
                  background: '#fffbeb',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid #fde68a',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#92400e' }}>СЕССИЯ ОРТАША</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
                  {liveStats.sessionAverage !== null ? `${liveStats.sessionAverage}` : '—'}
                </div>
                <div style={{ fontSize: '11px', color: '#d97706', marginTop: '2px' }}>
                  {liveStats.sessionCount} / {liveStats.total} емтихан тапсырған
                </div>
              </div>

              {/* Card 6: Final Score Average */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>ҚОРЫТЫНДЫ БАЛЛ</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {liveStats.finalAverage !== null ? `${liveStats.finalAverage}` : '—'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  0.6 × РД + 0.4 × Сессия
                </div>
              </div>
            </div>

            {/* ACTION TOOLBAR & SEARCH */}
            <Card style={{ marginBottom: '16px' }}>
              <CardBody style={{ padding: '16px 20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  {/* Left: Search Student */}
                  <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
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

                  {/* Right: Unsaved changes banner & Save Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {hasUnsavedChanges && (
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#b45309',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#fffbeb',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #fde68a',
                        }}
                      >
                        <span>⚠️</span>
                        <span>Сақталмаған өзгерістер бар</span>
                      </div>
                    )}

                    {hasUnsavedChanges && (
                      <Button variant="ghost" size="sm" onClick={handleReset} disabled={saving}>
                        Қалпына келтіру
                      </Button>
                    )}

                    <Button
                      variant="primary"
                      icon={<Icon name="check" size={16} />}
                      onClick={handleSave}
                      loading={saving}
                    >
                      Сақтау
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* GRADES TABLE */}
            <Card padding="none" style={{ overflow: 'hidden', background: '#ffffff' }}>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'var(--su-bg-secondary)',
                        borderBottom: '2px solid var(--su-border)',
                        color: 'var(--su-text-muted)',
                        fontSize: '12px',
                        textAlign: 'left',
                      }}
                    >
                      <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}>№</th>
                      <th style={{ padding: '12px 16px', minWidth: '220px' }}>Студент аты-жөні</th>

                      {/* RK-1 Column */}
                      {(activePeriod === 'ALL' || activePeriod === 'RK1') && (
                        <th style={{ padding: '12px 12px', width: '110px', textAlign: 'center' }}>
                          <span style={{ color: '#1d4ed8', fontWeight: 700 }}>РК-1 (0-100)</span>
                        </th>
                      )}

                      {/* RK-2 Column */}
                      {(activePeriod === 'ALL' || activePeriod === 'RK2') && (
                        <th style={{ padding: '12px 12px', width: '110px', textAlign: 'center' }}>
                          <span style={{ color: '#7e22ce', fontWeight: 700 }}>РК-2 (0-100)</span>
                        </th>
                      )}

                      {/* Admission Rating Column */}
                      {(activePeriod === 'ALL' || activePeriod === 'RK2') && (
                        <th style={{ padding: '12px 12px', width: '100px', textAlign: 'center' }}>
                          <span style={{ color: '#15803d', fontWeight: 700 }}>РД (Рұқсат)</span>
                        </th>
                      )}

                      {/* Session Exam Column */}
                      {(activePeriod === 'ALL' || activePeriod === 'SESSION') && (
                        <th style={{ padding: '12px 12px', width: '120px', textAlign: 'center' }}>
                          <span style={{ color: '#b45309', fontWeight: 700 }}>Сессия (0-100)</span>
                        </th>
                      )}

                      {/* Final Score Column */}
                      {activePeriod === 'ALL' && (
                        <th style={{ padding: '12px 12px', width: '100px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 700 }}>Қорытынды</span>
                        </th>
                      )}

                      {/* Grade Letter */}
                      {activePeriod === 'ALL' && (
                        <th style={{ padding: '12px 12px', width: '80px', textAlign: 'center' }}>
                          Әріп
                        </th>
                      )}

                      {/* Status */}
                      <th style={{ padding: '12px 12px', width: '110px', textAlign: 'center' }}>
                        Күйі
                      </th>

                      {/* Note */}
                      <th style={{ padding: '12px 14px', minWidth: '180px' }}>
                        Ескертпе (Оқытушы жазбасы)
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((st, idx) => {
                      const draft = localGrades[st.id] || { rk1: '', rk2: '', session: '', note: '' };

                      const rk1Val = draft.rk1.trim() !== '' && !isNaN(Number(draft.rk1)) ? Number(draft.rk1) : null;
                      const rk2Val = draft.rk2.trim() !== '' && !isNaN(Number(draft.rk2)) ? Number(draft.rk2) : null;
                      const sessionVal = draft.session.trim() !== '' && !isNaN(Number(draft.session)) ? Number(draft.session) : null;

                      const admission = calcAdmission(rk1Val, rk2Val);
                      const finalScore = calcFinal(rk1Val, rk2Val, sessionVal);
                      const letter = getGradeLetter(finalScore, sessionVal);

                      const isComplete = rk1Val !== null && rk2Val !== null && sessionVal !== null;
                      const isIncomplete = !isComplete && (rk1Val !== null || rk2Val !== null || sessionVal !== null);

                      const isRk1Invalid = rk1Val !== null && (rk1Val < 0 || rk1Val > 100);
                      const isRk2Invalid = rk2Val !== null && (rk2Val < 0 || rk2Val > 100);
                      const isSessionInvalid = sessionVal !== null && (sessionVal < 0 || sessionVal > 100);

                      return (
                        <tr
                          key={st.id}
                          style={{
                            backgroundColor: idx % 2 === 0 ? '#ffffff' : 'var(--su-bg-subtle, #f8fafc)',
                            borderBottom: '1px solid var(--su-border)',
                          }}
                        >
                          {/* Row Number */}
                          <td style={{ padding: '10px 14px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                            {idx + 1}
                          </td>

                          {/* Student Info */}
                          <td style={{ padding: '10px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  backgroundColor: '#eff6ff',
                                  color: '#2563eb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  flexShrink: 0,
                                }}
                              >
                                {st.fullName.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--su-text-main)' }}>
                                  {st.fullName}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--su-text-muted)' }}>
                                  {st.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* RK-1 Input */}
                          {(activePeriod === 'ALL' || activePeriod === 'RK1') && (
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                placeholder="—"
                                value={draft.rk1}
                                onChange={(e) => handleGradeCellChange(st.id, 'rk1', e.target.value)}
                                style={{
                                  width: '74px',
                                  padding: '6px 8px',
                                  textAlign: 'center',
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  border: isRk1Invalid ? '2px solid #ef4444' : '1px solid #cbd5e1',
                                  backgroundColor: isRk1Invalid ? '#fef2f2' : draft.rk1 ? '#eff6ff' : '#ffffff',
                                  color: isRk1Invalid ? '#b91c1c' : draft.rk1 ? '#1d4ed8' : '#0f172a',
                                  outline: 'none',
                                }}
                              />
                            </td>
                          )}

                          {/* RK-2 Input */}
                          {(activePeriod === 'ALL' || activePeriod === 'RK2') && (
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                placeholder="—"
                                value={draft.rk2}
                                onChange={(e) => handleGradeCellChange(st.id, 'rk2', e.target.value)}
                                style={{
                                  width: '74px',
                                  padding: '6px 8px',
                                  textAlign: 'center',
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  border: isRk2Invalid ? '2px solid #ef4444' : '1px solid #cbd5e1',
                                  backgroundColor: isRk2Invalid ? '#fef2f2' : draft.rk2 ? '#faf5ff' : '#ffffff',
                                  color: isRk2Invalid ? '#b91c1c' : draft.rk2 ? '#7e22ce' : '#0f172a',
                                  outline: 'none',
                                }}
                              />
                            </td>
                          )}

                          {/* Admission Rating Computed */}
                          {(activePeriod === 'ALL' || activePeriod === 'RK2') && (
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {admission !== null ? (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    backgroundColor: admission >= 50 ? '#f0fdf4' : '#fef2f2',
                                    color: admission >= 50 ? '#15803d' : '#dc2626',
                                    border: `1px solid ${admission >= 50 ? '#bbf7d0' : '#fecaca'}`,
                                  }}
                                  title={`РД = (${rk1Val} + ${rk2Val}) / 2 = ${admission}`}
                                >
                                  {admission}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--su-text-muted)' }}>—</span>
                              )}
                            </td>
                          )}

                          {/* Session Exam Input */}
                          {(activePeriod === 'ALL' || activePeriod === 'SESSION') && (
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                placeholder="—"
                                value={draft.session}
                                onChange={(e) => handleGradeCellChange(st.id, 'session', e.target.value)}
                                style={{
                                  width: '74px',
                                  padding: '6px 8px',
                                  textAlign: 'center',
                                  fontSize: '13px',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  border: isSessionInvalid ? '2px solid #ef4444' : '1px solid #cbd5e1',
                                  backgroundColor: isSessionInvalid ? '#fef2f2' : draft.session ? '#fffbeb' : '#ffffff',
                                  color: isSessionInvalid ? '#b91c1c' : draft.session ? '#b45309' : '#0f172a',
                                  outline: 'none',
                                }}
                              />
                            </td>
                          )}

                          {/* Final Score Computed */}
                          {activePeriod === 'ALL' && (
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {finalScore !== null ? (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 800,
                                    fontSize: '13px',
                                    backgroundColor: finalScore >= 50 ? '#eff6ff' : '#fef2f2',
                                    color: finalScore >= 50 ? '#1d4ed8' : '#dc2626',
                                  }}
                                  title={`Қорытынды = 0.6 × ${admission} + 0.4 × ${sessionVal} = ${finalScore}`}
                                >
                                  {finalScore}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--su-text-muted)' }}>—</span>
                              )}
                            </td>
                          )}

                          {/* Grade Letter */}
                          {activePeriod === 'ALL' && (
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>
                              {finalScore !== null ? (
                                <Badge variant={getScoreBadgeVariant(finalScore)}>{letter}</Badge>
                              ) : (
                                <span style={{ color: 'var(--su-text-muted)' }}>—</span>
                              )}
                            </td>
                          )}

                          {/* Status */}
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            {isComplete ? (
                              <Badge variant="success">Аяқталды</Badge>
                            ) : isIncomplete ? (
                              <Badge variant="warning">Толық емес</Badge>
                            ) : (
                              <Badge variant="neutral">Басталмаған</Badge>
                            )}
                          </td>

                          {/* Note Input */}
                          <td style={{ padding: '8px 14px' }}>
                            <input
                              type="text"
                              placeholder="Ескертпе жазу..."
                              value={draft.note}
                              onChange={(e) => handleGradeCellChange(st.id, 'note', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 10px',
                                fontSize: '12px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#334155',
                                outline: 'none',
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* BOTTOM SAVE ACTIONS */}
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Барлығы: <strong>{filteredStudents.length}</strong> студент ведомоста
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {hasUnsavedChanges && (
                  <Button variant="ghost" onClick={handleReset} disabled={saving}>
                    Өзгерістерді болдырмау
                  </Button>
                )}
                <Button
                  variant="primary"
                  icon={<Icon name="check" size={16} />}
                  onClick={handleSave}
                  loading={saving}
                >
                  Ведомості сақтау
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default TeacherGradesPage;

