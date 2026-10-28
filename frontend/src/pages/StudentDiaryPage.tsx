import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  CardBody,
  Badge,
  Button,
  ErrorState,
  Skeleton,
  EmptyState,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { api } from '../utils/api';

type AttendanceStatusType = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

interface AttendanceInfo {
  id: string;
  status: AttendanceStatusType;
  note: string | null;
  markedAt: string;
}

interface LessonItem {
  id: string;
  groupId: string;
  groupName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  classroom: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  course: number;
  semester: number;
  attendance: AttendanceInfo | null;
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  topicId: string;
  topicTitle: string;
  deadline: string;
  deadlineTime: string;
  maxScore: number;
  allowLate: boolean;
  submissionStatus: 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED' | 'PAST_DUE';
  score: number | null;
  gradedAt: string | null;
  teacherComment: string | null;
}

interface TestItem {
  id: string;
  title: string;
  description: string | null;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  scheduledAt: string;
  startTime: string;
  durationMinutes: number;
  maxScore: number;
  attemptStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  score: number | null;
  percentage: number | null;
  attemptId: string | null;
}

interface AttendanceStatsSummary {
  totalMarked: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

interface DiaryResponse {
  message: string;
  date: string;
  dayOfWeekName: string;
  formattedDate: string;
  summary: {
    lessonCount: number;
    taskCount: number;
    testCount: number;
    totalCount: number;
    completedTasksCount: number;
    completedTestsCount: number;
    attendance?: AttendanceStatsSummary;
  };
  lessons: LessonItem[];
  tasks: TaskItem[];
  tests: TestItem[];
}

interface StudentSubjectAttendanceBreakdown {
  groupId: string;
  groupName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  teacherName: string;
  course: number;
  semester: number;
  totalMarked: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

interface StudentAttendanceRecordItem {
  id: string;
  date: string;
  status: AttendanceStatusType;
  note: string | null;
  groupId: string;
  groupName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  teacherName: string;
  updatedAt: string;
}

interface StudentFullAttendanceResponse {
  message: string;
  summary: {
    totalMarked: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    excusedCount: number;
    attendanceRate: number;
  };
  subjectBreakdown: StudentSubjectAttendanceBreakdown[];
  records: StudentAttendanceRecordItem[];
}

interface StudentSubjectGrade {
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
  status: 'COMPLETE' | 'INCOMPLETE' | 'EMPTY';
  note: string | null;
  updatedAt: string | null;
}

interface StudentGradesResponse {
  message: string;
  summary: {
    totalSubjects: number;
    completedSubjects: number;
    incompleteSubjects: number;
    averageRk1: number | null;
    averageRk2: number | null;
    averageAdmissionRating: number | null;
    averageSession: number | null;
    averageFinalScore: number | null;
    gpa: number | null;
  };
  subjects: StudentSubjectGrade[];
}

function formatDateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const StudentDiaryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active view tab: 'DIARY' | 'ATTENDANCE' | 'GRADES'
  const [activeTab, setActiveTab] = useState<'DIARY' | 'ATTENDANCE' | 'GRADES'>(
    (searchParams.get('tab') as 'DIARY' | 'ATTENDANCE' | 'GRADES') || 'DIARY',
  );

  const initialDate = searchParams.get('date') || formatDateToIso(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [diary, setDiary] = useState<DiaryResponse | null>(null);
  const [loadingDiary, setLoadingDiary] = useState<boolean>(true);
  const [errorDiary, setErrorDiary] = useState<string | null>(null);

  // Full attendance state
  const [attendanceHistory, setAttendanceHistory] = useState<StudentFullAttendanceResponse | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);
  const [errorAttendance, setErrorAttendance] = useState<string | null>(null);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('ALL');

  // Term grades state
  const [gradesData, setGradesData] = useState<StudentGradesResponse | null>(null);
  const [loadingGrades, setLoadingGrades] = useState<boolean>(false);
  const [errorGrades, setErrorGrades] = useState<string | null>(null);

  const fetchDiary = async (dateStr: string) => {
    try {
      setLoadingDiary(true);
      setErrorDiary(null);
      const data = await api.get<DiaryResponse>(`/api/student/diary?date=${dateStr}`);
      setDiary(data);
    } catch (err: any) {
      setErrorDiary(err.message || 'Сервермен байланыс қатесі');
    } finally {
      setLoadingDiary(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      setLoadingAttendance(true);
      setErrorAttendance(null);
      const data = await api.get<StudentFullAttendanceResponse>('/api/student/attendance');
      setAttendanceHistory(data);
    } catch (err: any) {
      setErrorAttendance(err.message || 'Қатысу статистикасын жүктеу қатесі');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchGrades = async () => {
    try {
      setLoadingGrades(true);
      setErrorGrades(null);
      const data = await api.get<StudentGradesResponse>('/api/student/grades');
      setGradesData(data);
    } catch (err: any) {
      setErrorGrades(err.message || 'Академиялық бағаларды жүктеу қатесі');
    } finally {
      setLoadingGrades(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'DIARY') {
      fetchDiary(selectedDate);
      setSearchParams({ tab: 'DIARY', date: selectedDate }, { replace: true });
    } else if (activeTab === 'ATTENDANCE') {
      fetchAttendanceHistory();
      setSearchParams({ tab: 'ATTENDANCE' }, { replace: true });
    } else if (activeTab === 'GRADES') {
      fetchGrades();
      setSearchParams({ tab: 'GRADES' }, { replace: true });
    }
  }, [selectedDate, activeTab]);

  const changeDateByDays = (delta: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 12, 0, 0);
    dateObj.setDate(dateObj.getDate() + delta);
    setSelectedDate(formatDateToIso(dateObj));
  };

  const setToday = () => {
    setSelectedDate(formatDateToIso(new Date()));
  };

  const isToday = selectedDate === formatDateToIso(new Date());

  // Filtered attendance records in Attendance tab
  const filteredRecords = (attendanceHistory?.records || []).filter((r) => {
    if (filterSubjectId === 'ALL') return true;
    return r.subjectId === filterSubjectId;
  });

  return (
    <AppShell userRole="STUDENT">
      <div className="su-content-container">
        <PageHeader
          title="Электронды күнделік және қатысу"
          subtitle="Күнделікті сабақ кестесі, қатысу тарихы, тапсырмалар мен тесттер"
          breadcrumbs={[
            { label: 'Студент', path: '/student/dashboard' },
            { label: 'Күнделік' },
          ]}
          actions={
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button
                variant="outline"
                size="sm"
                icon={<Icon name="calendar" size={16} />}
                onClick={() => navigate('/student/calendar')}
              >
                Күнтізбені ашу
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Icon name="clock" size={16} />}
                onClick={() => {
                  if (activeTab === 'DIARY') fetchDiary(selectedDate);
                  else if (activeTab === 'ATTENDANCE') fetchAttendanceHistory();
                  else if (activeTab === 'GRADES') fetchGrades();
                }}
              >
                Жаңарту
              </Button>
            </div>
          }
        />

        {/* TAB SWITCHER */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '2px',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('DIARY')}
            style={{
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'DIARY' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'DIARY' ? '3px solid #2563eb' : '3px solid transparent',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            📅 Күнделік кестесі
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ATTENDANCE')}
            style={{
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'ATTENDANCE' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'ATTENDANCE' ? '3px solid #2563eb' : '3px solid transparent',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            📊 Қатысу журналы мен статистикасы
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('GRADES')}
            style={{
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'GRADES' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'GRADES' ? '3px solid #2563eb' : '3px solid transparent',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            🎯 Академиялық бағалар (РК-1, РК-2, Сессия)
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: DIARY SCHEDULE */}
        {/* ============================================================== */}
        {activeTab === 'DIARY' && (
          <>
            {/* Date Navigation Bar */}
            <Card style={{ marginBottom: '24px' }}>
              <CardBody style={{ padding: '16px 20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeDateByDays(-1)}
                      title="Алдыңғы күн"
                    >
                      ← Алдыңғы
                    </Button>
                    <Button
                      variant={isToday ? 'primary' : 'outline'}
                      size="sm"
                      onClick={setToday}
                    >
                      Бүгін
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeDateByDays(1)}
                      title="Келесі күн"
                    >
                      Келесі →
                    </Button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                        {diary?.formattedDate || selectedDate}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                        {diary?.dayOfWeekName || ''}
                      </div>
                    </div>

                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        if (e.target.value) setSelectedDate(e.target.value);
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        color: '#334155',
                        cursor: 'pointer',
                        outline: 'none',
                        background: '#ffffff',
                      }}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            {errorDiary && (
              <ErrorState
                title="Күнделік деректерін жүктеу мүмкін болмады"
                message={errorDiary}
                onRetry={() => fetchDiary(selectedDate)}
              />
            )}

            {loadingDiary && !diary && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Skeleton height="80px" />
                <Skeleton height="160px" />
                <Skeleton height="160px" />
              </div>
            )}

            {diary && (
              <>
                {/* SUMMARY STATS BAR */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '14px',
                    marginBottom: '28px',
                  }}
                >
                  {/* Lessons */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                      }}
                    >
                      🎓
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>САБАҚТАР</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                        {diary.summary.lessonCount} сабақ
                      </div>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: '#fffbeb',
                        color: '#b45309',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                      }}
                    >
                      📝
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>ТАПСЫРМАЛАР</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                        {diary.summary.taskCount} дедлайн
                      </div>
                    </div>
                  </div>

                  {/* Tests */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: '#faf5ff',
                        color: '#7e22ce',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                      }}
                    >
                      ⏱️
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>ТЕСТТЕР</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                        {diary.summary.testCount} тест
                      </div>
                    </div>
                  </div>

                  {/* Completed */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: '#f0fdf4',
                        color: '#15803d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                      }}
                    >
                      ✅
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>ОРЫНДАЛҒАНЫ</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                        {diary.summary.completedTasksCount + diary.summary.completedTestsCount} жұмыс
                      </div>
                    </div>
                  </div>

                  {/* Attendance Rate */}
                  {diary.summary.attendance && (
                    <div
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        cursor: 'pointer',
                      }}
                      onClick={() => setActiveTab('ATTENDANCE')}
                      title="Қатысу статистикасын толық көру"
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: '#ecfdf5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                        }}
                      >
                        🎯
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>ҚАТЫСУ ДЕҢГЕЙІ</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#047857' }}>
                          {diary.summary.attendance.attendanceRate}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 1: LESSONS */}
                <div style={{ marginBottom: '32px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                    }}
                  >
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                      📚 Бүгінгі сабақтар кестесі
                    </h2>
                    <Badge variant="secondary">{diary.lessons.length} сабақ</Badge>
                  </div>

                  {diary.lessons.length === 0 ? (
                    <Card>
                      <CardBody style={{ padding: '36px', textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>☕</div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                          Бұл күні сабақ жоқ
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                          Сабақ кестесі бойынша аудиториялық дәрістер мен семинарлар жоспарланбаған.
                        </div>
                      </CardBody>
                    </Card>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {diary.lessons.map((lesson) => (
                        <Card key={lesson.id} hoverable>
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                                <div
                                  style={{
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    textAlign: 'center',
                                    minWidth: '100px',
                                  }}
                                >
                                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1d4ed8' }}>
                                    {lesson.startTime}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                                    {lesson.endTime} дейін
                                  </div>
                                </div>

                                <div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      marginBottom: '4px',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                      {lesson.subjectName}
                                    </h3>
                                    {lesson.subjectCode && (
                                      <Badge variant="neutral">{lesson.subjectCode}</Badge>
                                    )}

                                    {/* ATTENDANCE STATUS BADGE */}
                                    {lesson.attendance ? (
                                      lesson.attendance.status === 'PRESENT' ? (
                                        <Badge variant="success">🟢 Қатысты</Badge>
                                      ) : lesson.attendance.status === 'LATE' ? (
                                        <Badge variant="warning">🟡 Кешікті</Badge>
                                      ) : lesson.attendance.status === 'EXCUSED' ? (
                                        <Badge variant="secondary">🔵 Себепті</Badge>
                                      ) : (
                                        <Badge variant="danger">🔴 Қатыспады (НБ)</Badge>
                                      )
                                    ) : (
                                      <Badge variant="neutral">⚪ Белгіленбеген</Badge>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
                                    <span>👥 Топ: <strong>{lesson.groupName}</strong></span>
                                    <span>📍 Дәрісхана: <strong>{lesson.classroom}</strong></span>
                                    <span>👨‍🏫 Оқытушы: <strong>{lesson.teacherName}</strong></span>
                                  </div>

                                  {lesson.attendance?.note && (
                                    <div
                                      style={{
                                        marginTop: '6px',
                                        fontSize: '12px',
                                        color: '#92400e',
                                        background: '#fef3c7',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                      }}
                                    >
                                      <span>💬</span>
                                      <span>Оқытушы ескертпесі: <strong>{lesson.attendance.note}</strong></span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/student/subjects/${lesson.subjectId}`)}
                                >
                                  Пән материалдары →
                                </Button>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION 2: ASSIGNMENT DEADLINES */}
                <div style={{ marginBottom: '32px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                    }}
                  >
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                      📝 Тапсырмалар мерзімі (Дедлайн)
                    </h2>
                    <Badge variant="warning">{diary.tasks.length} тапсырма</Badge>
                  </div>

                  {diary.tasks.length === 0 ? (
                    <Card>
                      <CardBody style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>
                          Бүгінге белгіленген тапсырма дедлайндары жоқ
                        </div>
                      </CardBody>
                    </Card>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {diary.tasks.map((task) => {
                        const isSubmitted = task.submissionStatus === 'SUBMITTED' || task.submissionStatus === 'GRADED';
                        const isGraded = task.submissionStatus === 'GRADED';

                        return (
                          <Card key={task.id} hoverable>
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <div
                                    style={{
                                      width: '44px',
                                      height: '44px',
                                      borderRadius: '10px',
                                      background: isGraded ? '#ecfdf5' : isSubmitted ? '#eff6ff' : '#fffbeb',
                                      color: isGraded ? '#059669' : isSubmitted ? '#2563eb' : '#d97706',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '20px',
                                    }}
                                  >
                                    {isGraded ? '⭐' : isSubmitted ? '📤' : '⚠️'}
                                  </div>

                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                        {task.title}
                                      </h3>
                                      <Badge variant="neutral">{task.subjectName}</Badge>
                                    </div>

                                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                                      Тақырып: <strong>{task.topicTitle}</strong> | Дедлайн уақыты: <strong>{task.deadlineTime}</strong> | Макс. балл: <strong>{task.maxScore}</strong>
                                    </div>

                                    {task.teacherComment && (
                                      <div
                                        style={{
                                          marginTop: '6px',
                                          fontSize: '12px',
                                          color: '#15803d',
                                          background: '#f0fdf4',
                                          padding: '4px 8px',
                                          borderRadius: '4px',
                                        }}
                                      >
                                        💬 Мұғалім пікірі: {task.teacherComment}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {isGraded ? (
                                    <Badge variant="success">Бағаланды: {task.score} / {task.maxScore}</Badge>
                                  ) : isSubmitted ? (
                                    <Badge variant="secondary">Тексерілуде</Badge>
                                  ) : task.submissionStatus === 'PAST_DUE' ? (
                                    <Badge variant="danger">Мерзімі өтті</Badge>
                                  ) : (
                                    <Badge variant="warning">Тапсырылмаған</Badge>
                                  )}

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/student/assignments/${task.id}`)}
                                  >
                                    Тапсырманы көру
                                  </Button>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SECTION 3: TESTS */}
                <div style={{ marginBottom: '32px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                    }}
                  >
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                      ⏱️ Бүгінгі тест емтихандары
                    </h2>
                    <Badge variant="secondary">{diary.tests.length} тест</Badge>
                  </div>

                  {diary.tests.length === 0 ? (
                    <Card>
                      <CardBody style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>✨</div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>
                          Бүгінге жоспарланған тесттер жоқ
                        </div>
                      </CardBody>
                    </Card>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {diary.tests.map((test) => {
                        const isCompleted = test.attemptStatus === 'COMPLETED';
                        const isInProgress = test.attemptStatus === 'IN_PROGRESS';

                        return (
                          <Card key={test.id} hoverable>
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <div
                                    style={{
                                      width: '44px',
                                      height: '44px',
                                      borderRadius: '10px',
                                      background: isCompleted ? '#ecfdf5' : '#faf5ff',
                                      color: isCompleted ? '#059669' : '#7e22ce',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '20px',
                                    }}
                                  >
                                    {isCompleted ? '🏆' : '⏱️'}
                                  </div>

                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                        {test.title}
                                      </h3>
                                      <Badge variant="neutral">{test.subjectName}</Badge>
                                    </div>

                                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                                      Ұзақтығы: <strong>{test.durationMinutes} минут</strong> | Максималды ұпай: <strong>{test.maxScore}</strong>
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {isCompleted ? (
                                    <Badge variant="success">
                                      Аяқталды: {test.percentage}% ({test.score} ұпай)
                                    </Badge>
                                  ) : isInProgress ? (
                                    <Badge variant="warning">Жалғасуда</Badge>
                                  ) : (
                                    <Badge variant="secondary">Өтуге дайын</Badge>
                                  )}

                                  {isCompleted && test.attemptId ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(`/student/tests/${test.id}/result/${test.attemptId}`)}
                                    >
                                      Нәтижені көру
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => navigate('/student/tests')}
                                    >
                                      Тесттер бөліміне өту
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ============================================================== */}
        {/* TAB 2: FULL ATTENDANCE JOURNAL & STATS */}
        {/* ============================================================== */}
        {activeTab === 'ATTENDANCE' && (
          <div>
            {errorAttendance && (
              <div style={{ marginBottom: '20px' }}>
                <ErrorState
                  title="Қатысу статистикасын жүктеу мүмкін болмады"
                  message={errorAttendance}
                  onRetry={fetchAttendanceHistory}
                />
              </div>
            )}

            {loadingAttendance && !attendanceHistory ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Skeleton height="100px" />
                <Skeleton height="200px" />
                <Skeleton height="300px" />
              </div>
            ) : attendanceHistory ? (
              <>
                {/* ATTENDANCE OVERVIEW STATS */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: '16px',
                    marginBottom: '28px',
                  }}
                >
                  {/* Gauge / Rate */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                      borderRadius: '12px',
                      padding: '20px',
                      color: '#ffffff',
                      boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, opacity: 0.85 }}>ҚАТЫСУ КӨРСЕТКІШІ</div>
                    <div style={{ fontSize: '32px', fontWeight: 900, marginTop: '4px' }}>
                      {attendanceHistory.summary.attendanceRate}%
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '4px' }}>
                      Барлық белгіленген сабақтар бойынша
                    </div>
                  </div>

                  {/* Total Marked */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>БЕЛГІЛЕНГЕН САБАҚТАР</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                      {attendanceHistory.summary.totalMarked}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      Жалпы аудиториялық сабақ
                    </div>
                  </div>

                  {/* Present */}
                  <div
                    style={{
                      background: '#f0fdf4',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>ҚАТЫСТЫ</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                      {attendanceHistory.summary.presentCount}
                    </div>
                    <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>
                      Сабаққа толық қатысқан
                    </div>
                  </div>

                  {/* Late */}
                  <div
                    style={{
                      background: '#fffbeb',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #fde68a',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400e' }}>КЕШІКТІ</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
                      {attendanceHistory.summary.lateCount}
                    </div>
                    <div style={{ fontSize: '11px', color: '#92400e', marginTop: '4px' }}>
                      Кешігіп келгендер
                    </div>
                  </div>

                  {/* Excused */}
                  <div
                    style={{
                      background: '#eff6ff',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>СЕБЕПТІ</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
                      {attendanceHistory.summary.excusedCount}
                    </div>
                    <div style={{ fontSize: '11px', color: '#1e40af', marginTop: '4px' }}>
                      Анықтамамен босатылған
                    </div>
                  </div>

                  {/* Absent */}
                  <div
                    style={{
                      background: '#fef2f2',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '1px solid #fecaca',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b' }}>ҚАТЫСПАДЫ (НБ)</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                      {attendanceHistory.summary.absentCount}
                    </div>
                    <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '4px' }}>
                      Себепсіз қатыспаған
                    </div>
                  </div>
                </div>

                {/* SUBJECT-BY-SUBJECT BREAKDOWN */}
                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
                    📖 Пәндер бойынша сабаққа қатысу
                  </h2>

                  {attendanceHistory.subjectBreakdown.length === 0 ? (
                    <Card>
                      <CardBody style={{ padding: '36px', textAlign: 'center' }}>
                        <EmptyState
                          icon="book"
                          title="Пәндер тізімі бос"
                          description="Сіз әлі ешқандай оқу тобына қабылданбағансыз немесе сабақтар белгіленбеген."
                        />
                      </CardBody>
                    </Card>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '16px',
                      }}
                    >
                      {attendanceHistory.subjectBreakdown.map((sb) => (
                        <Card key={sb.groupId} hoverable>
                          <CardBody style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                  {sb.subjectName}
                                </h3>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                  👥 Топ: {sb.groupName} | 👨‍🏫 {sb.teacherName}
                                </div>
                              </div>
                              <Badge
                                variant={
                                  sb.attendanceRate >= 80
                                    ? 'success'
                                    : sb.attendanceRate >= 50
                                    ? 'warning'
                                    : 'danger'
                                }
                              >
                                {sb.attendanceRate}%
                              </Badge>
                            </div>

                            {/* Progress bar */}
                            <div
                              style={{
                                width: '100%',
                                height: '8px',
                                backgroundColor: '#e2e8f0',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                marginBottom: '14px',
                              }}
                            >
                              <div
                                style={{
                                  width: `${sb.attendanceRate}%`,
                                  height: '100%',
                                  backgroundColor:
                                    sb.attendanceRate >= 80
                                    ? '#16a34a'
                                    : sb.attendanceRate >= 50
                                    ? '#d97706'
                                    : '#dc2626',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '6px',
                                textAlign: 'center',
                                fontSize: '12px',
                                paddingTop: '10px',
                                borderTop: '1px solid #f1f5f9',
                              }}
                            >
                              <div>
                                <div style={{ color: '#16a34a', fontWeight: 800 }}>{sb.presentCount}</div>
                                <div style={{ color: '#64748b', fontSize: '10px' }}>Қатысты</div>
                              </div>
                              <div>
                                <div style={{ color: '#d97706', fontWeight: 800 }}>{sb.lateCount}</div>
                                <div style={{ color: '#64748b', fontSize: '10px' }}>Кешікті</div>
                              </div>
                              <div>
                                <div style={{ color: '#2563eb', fontWeight: 800 }}>{sb.excusedCount}</div>
                                <div style={{ color: '#64748b', fontSize: '10px' }}>Себепті</div>
                              </div>
                              <div>
                                <div style={{ color: '#dc2626', fontWeight: 800 }}>{sb.absentCount}</div>
                                <div style={{ color: '#64748b', fontSize: '10px' }}>Қатыспады</div>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* DETAILED ATTENDANCE LOG */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                      📋 Сабаққа қатысу тарихы
                    </h2>

                    {attendanceHistory.subjectBreakdown.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Пән бойынша:</span>
                        <select
                          value={filterSubjectId}
                          onChange={(e) => setFilterSubjectId(e.target.value)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            color: '#1e293b',
                            background: '#ffffff',
                          }}
                        >
                          <option value="ALL">Барлық пәндер</option>
                          {attendanceHistory.subjectBreakdown.map((sb) => (
                            <option key={sb.subjectId} value={sb.subjectId}>
                              {sb.subjectName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <Card>
                    <CardBody style={{ padding: 0 }}>
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
                              <th style={{ padding: '14px 20px', width: '130px' }}>Күн</th>
                              <th style={{ padding: '14px 20px', minWidth: '180px' }}>Пән</th>
                              <th style={{ padding: '14px 20px', width: '140px' }}>Оқу тобы</th>
                              <th style={{ padding: '14px 20px', width: '160px' }}>Қатысу мәртебесі</th>
                              <th style={{ padding: '14px 20px', minWidth: '200px' }}>Оқытушы ескертпесі</th>
                              <th style={{ padding: '14px 20px', minWidth: '160px' }}>Белгілеген оқытушы</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRecords.length === 0 ? (
                              <tr>
                                <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                                  Әзірге қатысу жазбалары жоқ
                                </td>
                              </tr>
                            ) : (
                              filteredRecords.map((r) => (
                                <tr
                                  key={r.id}
                                  style={{
                                    borderBottom: '1px solid #f1f5f9',
                                    backgroundColor:
                                      r.status === 'ABSENT'
                                        ? '#fff5f5'
                                        : r.status === 'LATE'
                                        ? '#fffdf5'
                                        : '#ffffff',
                                  }}
                                >
                                  <td style={{ padding: '14px 20px', fontWeight: 700, color: '#1e293b' }}>
                                    {r.date}
                                  </td>
                                  <td style={{ padding: '14px 20px', fontWeight: 600, color: '#0f172a' }}>
                                    {r.subjectName}
                                  </td>
                                  <td style={{ padding: '14px 20px', color: '#64748b' }}>
                                    {r.groupName}
                                  </td>
                                  <td style={{ padding: '14px 20px' }}>
                                    {r.status === 'PRESENT' && <Badge variant="success">🟢 Қатысты</Badge>}
                                    {r.status === 'LATE' && <Badge variant="warning">🟡 Кешікті</Badge>}
                                    {r.status === 'EXCUSED' && <Badge variant="secondary">🔵 Себепті</Badge>}
                                    {r.status === 'ABSENT' && <Badge variant="danger">🔴 Қатыспады (НБ)</Badge>}
                                  </td>
                                  <td style={{ padding: '14px 20px', color: '#475569' }}>
                                    {r.note ? (
                                      <span style={{ fontStyle: 'italic' }}>&quot;{r.note}&quot;</span>
                                    ) : (
                                      <span style={{ color: '#cbd5e1' }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '13px' }}>
                                    {r.teacherName}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: GRADES & RATINGS (РК-1, РК-2, СЕССИЯ) */}
        {/* ============================================================== */}
        {activeTab === 'GRADES' && (
          <div>
            {loadingGrades && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <Skeleton height={90} borderRadius="12px" />
                  <Skeleton height={90} borderRadius="12px" />
                  <Skeleton height={90} borderRadius="12px" />
                  <Skeleton height={90} borderRadius="12px" />
                </div>
                <Skeleton height={400} borderRadius="12px" />
              </div>
            )}

            {errorGrades && (
              <ErrorState
                title="Академиялық бағаларды жүктеу қатесі"
                message={errorGrades}
                onRetry={fetchGrades}
              />
            )}

            {!loadingGrades && !errorGrades && gradesData && (
              <>
                {/* Stats Summary Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px',
                  }}
                >
                  <Card>
                    <CardBody style={{ padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Барлық пәндер</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                        {gradesData.summary.totalSubjects}
                      </div>
                      <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                        Аяқталғаны: {gradesData.summary.completedSubjects} / {gradesData.summary.totalSubjects}
                      </div>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody style={{ padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Орташа GPA</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
                        {gradesData.summary.gpa !== null ? gradesData.summary.gpa.toFixed(2) : '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        4.0 шкаласы бойынша
                      </div>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody style={{ padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Орташа рұқсат рейтингі (РД)</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                        {gradesData.summary.averageAdmissionRating !== null ? gradesData.summary.averageAdmissionRating : '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        РК-1 және РК-2 орташасы
                      </div>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody style={{ padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Орташа қорытынды балл</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                        {gradesData.summary.averageFinalScore !== null ? gradesData.summary.averageFinalScore : '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        Сессияны қосқанда
                      </div>
                    </CardBody>
                  </Card>
                </div>

                {/* Grading Rules Info Banner */}
                <div
                  style={{
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '14px 20px',
                    marginBottom: '24px',
                    fontSize: '13px',
                    color: '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Icon name="info" size={20} />
                  <div>
                    <strong>Академиялық бағалау ережесі:</strong> Рұқсат рейтингі: <code>РД = (РК-1 + РК-2) / 2</code> (емтиханға кіру үшін РД ≥ 50). Қорытынды балл: <code>0.6 × РД + 0.4 × Сессия</code> (өтпелі балл ≥ 50). GPA бағаланған пәндердің арифметикалық орташасы ретінде есептеледі. Баға толық емес болған жағдайда қорытынды есептелмейді.
                  </div>
                </div>

                {/* Subjects Table */}
                <Card>
                  <CardBody style={{ padding: 0 }}>
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
                            <th style={{ padding: '14px 20px', minWidth: '220px' }}>Пән / Оқу тобы</th>
                            <th style={{ padding: '14px 16px', minWidth: '160px' }}>Оқытушы</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', width: '90px' }}>РК-1</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', width: '90px' }}>РК-2</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', width: '120px' }}>РД (Рұқсат)</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', width: '90px' }}>Сессия</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', width: '120px' }}>Қорытынды</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', width: '90px' }}>Әріп</th>
                            <th style={{ padding: '14px 20px', minWidth: '180px' }}>Мәртебесі / Ескертпе</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gradesData.subjects.length === 0 ? (
                            <tr>
                              <td colSpan={9} style={{ padding: '48px', textAlign: 'center' }}>
                                <EmptyState
                                  title="Академиялық пәндер жоқ"
                                  description="Сіз белсенді оқу топтарына тіркелмегенсіз"
                                />
                              </td>
                            </tr>
                          ) : (
                            gradesData.subjects.map((sub) => {
                              const isComplete = sub.status === 'COMPLETE';
                              const rkPass = sub.admissionRating !== null && sub.admissionRating >= 50;
                              const finalPass = sub.finalScore !== null && sub.finalScore >= 50 && (sub.session ?? 0) >= 50;

                              return (
                                <tr
                                  key={sub.groupId}
                                  style={{
                                    borderBottom: '1px solid #f1f5f9',
                                    transition: 'background-color 0.15s ease',
                                  }}
                                >
                                  <td style={{ padding: '14px 20px' }}>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{sub.subjectName}</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                      {sub.groupName} • {sub.course}-курс • {sub.semester}-семестр
                                    </div>
                                  </td>
                                  <td style={{ padding: '14px 16px', color: '#475569', fontSize: '13px' }}>
                                    {sub.teacher.fullName}
                                  </td>
                                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    {sub.rk1 !== null ? (
                                      <span style={{ fontWeight: 700, color: sub.rk1 >= 50 ? '#0f172a' : '#ef4444' }}>
                                        {sub.rk1}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#cbd5e1', fontSize: '13px' }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    {sub.rk2 !== null ? (
                                      <span style={{ fontWeight: 700, color: sub.rk2 >= 50 ? '#0f172a' : '#ef4444' }}>
                                        {sub.rk2}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#cbd5e1', fontSize: '13px' }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    {sub.admissionRating !== null ? (
                                      <span
                                        style={{
                                          display: 'inline-block',
                                          padding: '2px 8px',
                                          borderRadius: '6px',
                                          fontWeight: 700,
                                          backgroundColor: rkPass ? '#f0fdf4' : '#fef2f2',
                                          color: rkPass ? '#16a34a' : '#dc2626',
                                          border: `1px solid ${rkPass ? '#bbf7d0' : '#fecaca'}`,
                                        }}
                                      >
                                        {sub.admissionRating}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>Толық емес</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    {sub.session !== null ? (
                                      <span style={{ fontWeight: 700, color: sub.session >= 50 ? '#0f172a' : '#ef4444' }}>
                                        {sub.session}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#cbd5e1', fontSize: '13px' }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    {sub.finalScore !== null ? (
                                      <span
                                        style={{
                                          display: 'inline-block',
                                          padding: '3px 10px',
                                          borderRadius: '6px',
                                          fontWeight: 800,
                                          backgroundColor: finalPass ? '#ecfdf5' : '#fff1f2',
                                          color: finalPass ? '#059669' : '#e11d48',
                                          border: `1px solid ${finalPass ? '#a7f3d0' : '#fecdd3'}`,
                                        }}
                                      >
                                        {sub.finalScore}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontSize: '12px' }}>Толық емес</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    {sub.gradeLetter ? (
                                      <span
                                        style={{
                                          fontWeight: 800,
                                          fontSize: '15px',
                                          color:
                                            sub.gradeLetter.startsWith('A')
                                              ? '#16a34a'
                                              : sub.gradeLetter.startsWith('B')
                                              ? '#2563eb'
                                              : sub.gradeLetter.startsWith('C')
                                              ? '#d97706'
                                              : '#dc2626',
                                        }}
                                      >
                                        {sub.gradeLetter}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#cbd5e1' }}>—</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '14px 20px' }}>
                                    <div>
                                      {isComplete ? (
                                        <Badge variant="success">Аяқталды</Badge>
                                      ) : sub.status === 'EMPTY' ? (
                                        <Badge variant="secondary">Баға жоқ</Badge>
                                      ) : (
                                        <Badge variant="warning">Жүріп жатыр</Badge>
                                      )}
                                    </div>
                                    {sub.note && (
                                      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>
                                        &quot;{sub.note}&quot;
                                      </div>
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
        )}
      </div>
    </AppShell>
  );
};

export default StudentDiaryPage;
