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

type AttendanceStatusType = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

interface TeacherGroupOption {
  id: string;
  name: string;
  course: number;
  semester: number;
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
  lessonDay?: string | null;
  lessonTime?: string | null;
  classroom?: string | null;
}

interface StudentAttendanceItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status: AttendanceStatusType | null;
  note: string | null;
  markedAt: string | null;
}

interface GroupAttendanceResponse {
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
  date: string;
  isSaved: boolean;
  stats: {
    totalStudents: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    unmarkedCount: number;
    uniqueDatesCount: number;
    overallRate: number;
  };
  students: StudentAttendanceItem[];
}

const KAZAKH_MONTHS = [
  'қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
  'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан',
];

const KAZAKH_DAYS = [
  'Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі',
  'Бейсенбі', 'Жұма', 'Сенбі',
];

function formatDateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatKazakhDate(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (isNaN(dateObj.getTime())) return dateStr;
  const dayName = KAZAKH_DAYS[dateObj.getDay()] || '';
  const monthName = KAZAKH_MONTHS[m - 1] || '';
  return `${d} ${monthName} ${y} ж., ${dayName}`;
}

export const TeacherAttendancePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [groups, setGroups] = useState<TeacherGroupOption[]>([]);
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    searchParams.get('groupId') || '',
  );

  const [selectedDate, setSelectedDate] = useState<string>(
    searchParams.get('date') || formatDateToIso(new Date()),
  );

  const [attendanceData, setAttendanceData] = useState<GroupAttendanceResponse | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Local draft state for records: studentId -> { status, note }
  const [localRecords, setLocalRecords] = useState<Record<string, { status: AttendanceStatusType | null; note: string }>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Search filter
  const [searchStudent, setSearchStudent] = useState<string>('');

  // 1. Fetch Teacher Groups
  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      setError(null);
      const data = await api.get<{ message?: string; groups?: TeacherGroupOption[] } | TeacherGroupOption[]>('/api/teacher/groups');
      const groupList: TeacherGroupOption[] = Array.isArray(data)
        ? data
        : (data && Array.isArray(data.groups) ? data.groups : []);
      setGroups(groupList);

      // Pre-select group if not already set or invalid
      const urlGroupId = searchParams.get('groupId');
      if (urlGroupId && groupList.some((g) => g.id === urlGroupId)) {
        setSelectedGroupId(urlGroupId);
      } else if (groupList.length > 0) {
        setSelectedGroupId(groupList[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Топтар тізімін жүктеу қатесі');
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 2. Fetch Group Attendance when groupId or date changes
  const fetchAttendance = async (groupId: string, dateStr: string) => {
    if (!groupId) return;
    try {
      setLoadingAttendance(true);
      setError(null);
      setSuccessToast(null);

      const res = await api.get<GroupAttendanceResponse>(
        `/api/teacher/groups/${groupId}/attendance?date=${dateStr}`,
      );
      setAttendanceData(res);

      // Initialize local editable state
      const initialMap: Record<string, { status: AttendanceStatusType | null; note: string }> = {};
      for (const st of res.students) {
        initialMap[st.id] = {
          status: st.status,
          note: st.note || '',
        };
      }
      setLocalRecords(initialMap);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setError(err.message || 'Қатысу мәліметтерін жүктеу қатесі');
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (selectedGroupId && selectedDate) {
      fetchAttendance(selectedGroupId, selectedDate);
      setSearchParams({ groupId: selectedGroupId, date: selectedDate }, { replace: true });
    }
  }, [selectedGroupId, selectedDate]);

  // Date controls
  const handleDateShift = (days: number) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('Сақталмаған өзгерістер бар. Басқа күнге ауысуды қалайсыз ба?')) {
        return;
      }
    }
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    setSelectedDate(formatDateToIso(dateObj));
  };

  const handleSetToday = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('Сақталмаған өзгерістер бар. Бүгінгі күнге ауысуды қалайсыз ба?')) {
        return;
      }
    }
    setSelectedDate(formatDateToIso(new Date()));
  };

  // Modify individual status
  const handleStatusChange = (studentId: string, status: AttendanceStatusType) => {
    setLocalRecords((prev) => {
      const current = prev[studentId] || { status: null, note: '' };
      // Clicking the same status again keeps it or toggles
      const newStatus = current.status === status ? status : status;
      return {
        ...prev,
        [studentId]: {
          ...current,
          status: newStatus,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  // Modify individual note
  const handleNoteChange = (studentId: string, note: string) => {
    setLocalRecords((prev) => {
      const current = prev[studentId] || { status: null, note: '' };
      return {
        ...prev,
        [studentId]: {
          ...current,
          note,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  // Bulk actions
  const handleMarkAllPresent = () => {
    if (!attendanceData) return;
    setLocalRecords((prev) => {
      const updated = { ...prev };
      for (const st of attendanceData.students) {
        updated[st.id] = {
          status: 'PRESENT',
          note: prev[st.id]?.note || '',
        };
      }
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const handleMarkUnmarkedPresent = () => {
    if (!attendanceData) return;
    setLocalRecords((prev) => {
      const updated = { ...prev };
      for (const st of attendanceData.students) {
        if (!updated[st.id]?.status) {
          updated[st.id] = {
            status: 'PRESENT',
            note: prev[st.id]?.note || '',
          };
        }
      }
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const handleReset = () => {
    if (!attendanceData) return;
    const initialMap: Record<string, { status: AttendanceStatusType | null; note: string }> = {};
    for (const st of attendanceData.students) {
      initialMap[st.id] = {
        status: st.status,
        note: st.note || '',
      };
    }
    setLocalRecords(initialMap);
    setHasUnsavedChanges(false);
  };

  // Save changes to backend
  const handleSave = async () => {
    if (!selectedGroupId || !selectedDate || !attendanceData) return;

    // Filter only students with a selected status
    const recordsToSave = Object.entries(localRecords)
      .filter(([_, data]) => data.status !== null)
      .map(([studentId, data]) => ({
        studentId,
        status: data.status as AttendanceStatusType,
        note: data.note ? data.note.trim() : undefined,
      }));

    if (recordsToSave.length === 0) {
      alert('Сақтау үшін ең болмағанда бір студенттің қатысу мәртебесін белгілеңіз.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.post(`/api/teacher/groups/${selectedGroupId}/attendance`, {
        date: selectedDate,
        records: recordsToSave,
      });

      setSuccessToast('Сабаққа қатысу журналы сәтті сақталды!');
      setHasUnsavedChanges(false);

      // Refresh to get updated stats and timestamps
      await fetchAttendance(selectedGroupId, selectedDate);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Қатысуды сақтау кезінде қате орын алды');
    } finally {
      setSaving(false);
    }
  };

  // Calculate live stats from localRecords
  const liveStats = useMemo(() => {
    if (!attendanceData) {
      return { total: 0, present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
    }
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let unmarked = 0;

    for (const st of attendanceData.students) {
      const rec = localRecords[st.id];
      if (!rec || rec.status === null) {
        unmarked++;
      } else if (rec.status === 'PRESENT') {
        present++;
      } else if (rec.status === 'ABSENT') {
        absent++;
      } else if (rec.status === 'LATE') {
        late++;
      } else if (rec.status === 'EXCUSED') {
        excused++;
      }
    }

    return {
      total: attendanceData.students.length,
      present,
      absent,
      late,
      excused,
      unmarked,
    };
  }, [attendanceData, localRecords]);

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!attendanceData) return [];
    if (!searchStudent.trim()) return attendanceData.students;
    const q = searchStudent.toLowerCase();
    return attendanceData.students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    );
  }, [attendanceData, searchStudent]);

  const selectedGroup = Array.isArray(groups) ? groups.find((g) => g.id === selectedGroupId) : undefined;
  const isToday = selectedDate === formatDateToIso(new Date());

  return (
    <AppShell userRole="TEACHER">
      <div className="su-content-container">
        <PageHeader
          title="Сабаққа қатысу журналы"
          subtitle="Студенттердің сабаққа қатысуын белгілеу (қатысты, кешікті, себепті, қатыспады) және мониторинг"
          breadcrumbs={[
            { label: 'Оқытушы', path: '/teacher/dashboard' },
            { label: 'Сабаққа қатысу' },
          ]}
          actions={
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {selectedGroupId && (
                <Button
                  variant="outline"
                  icon={<Icon name="chart" size={16} />}
                  onClick={() => navigate(`/teacher/journal?groupId=${selectedGroupId}`)}
                >
                  Электронды журнал
                </Button>
              )}
              <Button
                variant="outline"
                icon={<Icon name="users" size={16} />}
                onClick={() => navigate('/teacher/groups')}
              >
                Топтар тізімі
              </Button>
            </div>
          }
        />

        {/* FEEDBACK BANNERS */}
        {error && (
          <div style={{ marginBottom: '20px' }}>
            <ErrorState
              message={error}
              onRetry={() => {
                fetchGroups();
                if (selectedGroupId) {
                  fetchAttendance(selectedGroupId, selectedDate);
                }
              }}
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

        {/* TOP CONTROLS: GROUP SELECTOR & DATE PICKER */}
        <Card style={{ marginBottom: '24px' }}>
          <CardBody style={{ padding: '20px 24px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                alignItems: 'center',
              }}
            >
              {/* Group Selector */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '6px',
                  }}
                >
                  Оқу тобы мен пән:
                </label>
                {loadingGroups ? (
                  <Skeleton width="100%" height="40px" />
                ) : groups.length === 0 ? (
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Сізге бекітілген белсенді топтар жоқ
                  </div>
                ) : (
                  <select
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
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    {Array.isArray(groups) &&
                      groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} — {g.subject?.name || 'Пән'} ({g.course}-курс)
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Date Navigation */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '6px',
                  }}
                >
                  Сабақ күні:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateShift(-1)}
                    title="Алдыңғы күн"
                  >
                    ◀
                  </Button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (hasUnsavedChanges) {
                        if (!window.confirm('Сақталмаған өзгерістер бар. Басқа күнге ауысуды қалайсыз ба?')) {
                          return;
                        }
                      }
                      setSelectedDate(e.target.value);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateShift(1)}
                    title="Келесі күн"
                  >
                    ▶
                  </Button>
                  <Button
                    variant={isToday ? 'primary' : 'outline'}
                    size="sm"
                    onClick={handleSetToday}
                  >
                    Бүгін
                  </Button>
                </div>
              </div>
            </div>

            {/* SELECTED DATE DETAILS & LESSON INFO */}
            {selectedGroup && (
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  fontSize: '13px',
                  color: '#64748b',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>📅</span>
                  <strong style={{ color: '#1e293b' }}>{formatKazakhDate(selectedDate)}</strong>
                  {isToday && <Badge variant="primary">Бүгін</Badge>}
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span>
                    ⏰ Кесте: <strong>{selectedGroup.lessonDay || 'Бекітілмеген'}</strong> ({selectedGroup.lessonTime || '-'})
                  </span>
                  <span>
                    📍 Дәрісхана: <strong>{selectedGroup.classroom || 'Анықталмаған'}</strong>
                  </span>
                  <span>
                    📘 Пән коды: <strong>{selectedGroup.subject?.code || '-'}</strong>
                  </span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* LOADING STATE */}
        {loadingAttendance ? (
          <Card>
            <CardBody style={{ padding: '36px' }}>
              <Skeleton width="40%" height="28px" style={{ marginBottom: '16px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <Skeleton height="70px" />
                <Skeleton height="70px" />
                <Skeleton height="70px" />
                <Skeleton height="70px" />
                <Skeleton height="70px" />
              </div>
              <Skeleton width="100%" height="150px" />
            </CardBody>
          </Card>
        ) : !attendanceData || attendanceData.students.length === 0 ? (
          <Card>
            <CardBody style={{ padding: '48px', textAlign: 'center' }}>
              <EmptyState
                icon="users"
                title="Студенттер табылмады"
                description={
                  error
                    ? error
                    : 'Бұл топта әзірге белсенді студенттер жоқ. Студенттер топқа қосылғаннан кейін қатысуды белгілей аласыз.'
                }
              />
            </CardBody>
          </Card>
        ) : (
          <>
            {/* STATS OVERVIEW CARDS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>СТУДЕНТТЕР</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {liveStats.total}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Тізімде барлығы</div>
              </div>

              <div
                style={{
                  background: '#f0fdf4',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>ҚАТЫСТЫ</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                  {liveStats.present}
                </div>
                <div style={{ fontSize: '11px', color: '#166534', marginTop: '2px' }}>
                  {liveStats.total > 0 ? Math.round((liveStats.present / liveStats.total) * 100) : 0}% қатысу
                </div>
              </div>

              <div
                style={{
                  background: '#fffbeb',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #fde68a',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e' }}>КЕШІКТІ</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
                  {liveStats.late}
                </div>
                <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>Сабаққа кешіккен</div>
              </div>

              <div
                style={{
                  background: '#eff6ff',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #bfdbfe',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>СЕБЕПТІ</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
                  {liveStats.excused}
                </div>
                <div style={{ fontSize: '11px', color: '#1e40af', marginTop: '2px' }}>Себепті қатыспады</div>
              </div>

              <div
                style={{
                  background: '#fef2f2',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #fecaca',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b' }}>ҚАТЫСПАДЫ (НБ)</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                  {liveStats.absent}
                </div>
                <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '2px' }}>Себепсіз қалды</div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>БЕЛГІЛЕНБЕГЕН</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#475569', marginTop: '4px' }}>
                  {liveStats.unmarked}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Күтуде</div>
              </div>
            </div>

            {/* ACTION TOOLBAR & SEARCH */}
            <Card style={{ marginBottom: '20px' }}>
              <CardBody style={{ padding: '16px 20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                  }}
                >
                  {/* Left: Quick Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginRight: '4px' }}>
                      Жылдам әрекеттер:
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAllPresent}
                      title="Барлық студентті 'Қатысты' ету"
                    >
                      🟢 Барлығын қатысты ету
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkUnmarkedPresent}
                      title="Тек белгіленбеген студенттерді 'Қатысты' ету"
                    >
                      Белгіленбегендерді қатысты ету
                    </Button>
                    {hasUnsavedChanges && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        title="Барлық енгізілген өзгерістерді қалпына келтіру"
                      >
                        Тазарту
                      </Button>
                    )}
                  </div>

                  {/* Right: Search & Save Button */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Студент атымен іздеу..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        minWidth: '220px',
                      }}
                    />
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      loading={saving}
                      icon={<Icon name="check" size={16} />}
                      style={{
                        fontWeight: 700,
                        backgroundColor: hasUnsavedChanges ? '#2563eb' : '#059669',
                      }}
                    >
                      {hasUnsavedChanges ? 'Өзгерістерді сақтау' : 'Сақталды ✓'}
                    </Button>
                  </div>
                </div>

                {hasUnsavedChanges && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      background: '#fffbeb',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#b45309',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>⚠️</span>
                    <span>Сізде сақталмаған қатысу өзгерістері бар. Аяқтаған соң &quot;Өзгерістерді сақтау&quot; батырмасын басыңыз.</span>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* STUDENT ROSTER LIST */}
            <Card>
              <CardBody style={{ padding: '0' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px',
                      textAlign: 'left',
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          backgroundColor: '#f8fafc',
                          borderBottom: '2px solid #e2e8f0',
                          color: '#475569',
                          fontWeight: 700,
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        <th style={{ padding: '14px 20px', width: '50px' }}>№</th>
                        <th style={{ padding: '14px 20px', minWidth: '220px' }}>Студент</th>
                        <th style={{ padding: '14px 20px', minWidth: '380px' }}>Қатысу мәртебесі</th>
                        <th style={{ padding: '14px 20px', minWidth: '220px' }}>Ескертпе / Түсініктеме</th>
                        <th style={{ padding: '14px 20px', width: '130px', textAlign: 'right' }}>Соңғы белгі</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                            Іздеуге сәйкес студент табылмады
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student, idx) => {
                          const local = localRecords[student.id] || { status: null, note: '' };
                          const currentStatus = local.status;

                          return (
                            <tr
                              key={student.id}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                backgroundColor:
                                  currentStatus === 'ABSENT'
                                    ? '#fff5f5'
                                    : currentStatus === 'LATE'
                                    ? '#fffdf5'
                                    : '#ffffff',
                                transition: 'background-color 0.15s ease',
                              }}
                            >
                              {/* Index */}
                              <td style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600 }}>
                                {idx + 1}
                              </td>

                              {/* Student Info */}
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div
                                    style={{
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '50%',
                                      backgroundColor: '#e2e8f0',
                                      color: '#1e293b',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 700,
                                      fontSize: '14px',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {student.avatarUrl ? (
                                      <img
                                        src={student.avatarUrl}
                                        alt={student.fullName}
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      student.fullName.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                      {student.fullName}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                                      {student.email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Status 4-way Toggle Buttons */}
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {/* PRESENT */}
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(student.id, 'PRESENT')}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                      border:
                                        currentStatus === 'PRESENT'
                                          ? '2px solid #16a34a'
                                          : '1px solid #e2e8f0',
                                      backgroundColor:
                                        currentStatus === 'PRESENT' ? '#dcfce7' : '#f8fafc',
                                      color:
                                        currentStatus === 'PRESENT' ? '#15803d' : '#475569',
                                    }}
                                  >
                                    🟢 Қатысты
                                  </button>

                                  {/* LATE */}
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(student.id, 'LATE')}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                      border:
                                        currentStatus === 'LATE'
                                          ? '2px solid #d97706'
                                          : '1px solid #e2e8f0',
                                      backgroundColor:
                                        currentStatus === 'LATE' ? '#fef3c7' : '#f8fafc',
                                      color:
                                        currentStatus === 'LATE' ? '#b45309' : '#475569',
                                    }}
                                  >
                                    🟡 Кешікті
                                  </button>

                                  {/* EXCUSED */}
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(student.id, 'EXCUSED')}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                      border:
                                        currentStatus === 'EXCUSED'
                                          ? '2px solid #2563eb'
                                          : '1px solid #e2e8f0',
                                      backgroundColor:
                                        currentStatus === 'EXCUSED' ? '#dbeafe' : '#f8fafc',
                                      color:
                                        currentStatus === 'EXCUSED' ? '#1d4ed8' : '#475569',
                                    }}
                                  >
                                    🔵 Себепті
                                  </button>

                                  {/* ABSENT */}
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(student.id, 'ABSENT')}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                      border:
                                        currentStatus === 'ABSENT'
                                          ? '2px solid #dc2626'
                                          : '1px solid #e2e8f0',
                                      backgroundColor:
                                        currentStatus === 'ABSENT' ? '#fee2e2' : '#f8fafc',
                                      color:
                                        currentStatus === 'ABSENT' ? '#b91c1c' : '#475569',
                                    }}
                                  >
                                    🔴 Қатыспады
                                  </button>
                                </div>
                              </td>

                              {/* Note Field */}
                              <td style={{ padding: '16px 20px' }}>
                                <input
                                  type="text"
                                  placeholder="Ескертпе (себебі, кешіккен уақыты...)"
                                  value={local.note}
                                  onChange={(e) => handleNoteChange(student.id, e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '13px',
                                    color: '#1e293b',
                                  }}
                                />
                              </td>

                              {/* Last marked status timestamp */}
                              <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '12px', color: '#94a3b8' }}>
                                {student.markedAt ? (
                                  <span>Сақталған</span>
                                ) : (
                                  <span style={{ color: '#cbd5e1' }}>—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
};
export default TeacherAttendancePage;

