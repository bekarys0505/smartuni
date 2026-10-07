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
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { getToken } from '../utils/auth';

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
  };
  lessons: LessonItem[];
  tasks: TaskItem[];
  tests: TestItem[];
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

  const initialDate = searchParams.get('date') || formatDateToIso(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [diary, setDiary] = useState<DiaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiary = async (dateStr: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const res = await fetch(`/api/student/diary?date=${dateStr}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Күнделік деректерін жүктеу кезінде қате орын алды');
      }

      const data: DiaryResponse = await res.json();
      setDiary(data);
    } catch (err: any) {
      setError(err.message || 'Сервермен байланыс қатесі');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiary(selectedDate);
    setSearchParams({ date: selectedDate }, { replace: true });
  }, [selectedDate]);

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

  return (
    <AppShell userRole="STUDENT">
      <div className="su-content-container">
        <PageHeader
          title="Электронды күнделік"
          subtitle="Күнделікті сабақ кестесі, тапсырмалар және жоспарланған тесттер"
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
                onClick={() => fetchDiary(selectedDate)}
              >
                Жаңарту
              </Button>
            </div>
          }
        />

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

        {error && (
          <ErrorState
            title="Күнделік деректерін жүктеу мүмкін болмады"
            message={error}
            onRetry={() => fetchDiary(selectedDate)}
          />
        )}

        {loading && !diary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card>
              <CardBody style={{ padding: '24px' }}>
                <Skeleton width="30%" height="24px" style={{ marginBottom: '16px' }} />
                <Skeleton width="100%" height="60px" style={{ marginBottom: '12px' }} />
                <Skeleton width="100%" height="60px" />
              </CardBody>
            </Card>
          </div>
        )}

        {diary && (
          <>
            {/* Daily Summary Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
              }}
            >
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
                    color: '#16a34a',
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                  {lesson.subjectName}
                                </h3>
                                {lesson.subjectCode && (
                                  <Badge variant="neutral">{lesson.subjectCode}</Badge>
                                )}
                              </div>

                              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: '#64748b' }}>
                                <span>👥 Топ: <strong>{lesson.groupName}</strong></span>
                                <span>📍 Дәрісхана: <strong>{lesson.classroom}</strong></span>
                                <span>👨‍🏫 Оқытушы: <strong>{lesson.teacherName}</strong></span>
                              </div>
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
                  <CardBody style={{ padding: '36px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎉</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Бұл күні тапсыру мерзімі жоқ
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      Бүгінгі күнге белгіленген үй тапсырмалары мен практикалық жұмыстар жоқ.
                    </div>
                  </CardBody>
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {diary.tasks.map((task) => {
                    const isGraded = task.submissionStatus === 'GRADED';
                    const isSubmitted = task.submissionStatus === 'SUBMITTED';
                    const isPastDue = task.submissionStatus === 'PAST_DUE';

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
                                  background: '#fffbeb',
                                  border: '1px solid #fde68a',
                                  borderRadius: '10px',
                                  padding: '10px 14px',
                                  textAlign: 'center',
                                  minWidth: '100px',
                                }}
                              >
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#b45309' }}>
                                  {task.deadlineTime}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Дедлайн
                                </div>
                              </div>

                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                                    {task.title}
                                  </h3>
                                  <Badge variant="neutral">{task.subjectName}</Badge>
                                </div>

                                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>
                                  Тақырып: <strong>{task.topicTitle}</strong> | Максималды балл: <strong>{task.maxScore}</strong>
                                </div>

                                {task.teacherComment && (
                                  <div
                                    style={{
                                      fontSize: '12px',
                                      color: '#1e293b',
                                      background: '#f8fafc',
                                      padding: '6px 10px',
                                      borderRadius: '6px',
                                      borderLeft: '3px solid #2563eb',
                                    }}
                                  >
                                    💬 <strong>Оқытушы пікірі:</strong> {task.teacherComment}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {isGraded ? (
                                <Badge variant="success">
                                  Бағаланды: {task.score} / {task.maxScore}
                                </Badge>
                              ) : isSubmitted ? (
                                <Badge variant="primary">Жіберілді (Тексерілуде)</Badge>
                              ) : isPastDue ? (
                                <Badge variant="danger">Мерзімі өткен</Badge>
                              ) : (
                                <Badge variant="warning">Орындалмаған</Badge>
                              )}

                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate('/student/assignments')}
                              >
                                {isGraded ? 'Жауапты қарау' : 'Тапсырманы ашу'}
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
                  ⏱️ Жоспарланған тесттер
                </h2>
                <Badge variant="secondary">{diary.tests.length} тест</Badge>
              </div>

              {diary.tests.length === 0 ? (
                <Card>
                  <CardBody style={{ padding: '36px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      Бұл күні тесттер жоспарланбаған
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      Күн тәртібі бойынша аралық немесе қорытынды тестілеу белгіленбеген.
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
                                  background: '#faf5ff',
                                  border: '1px solid #e9d5ff',
                                  borderRadius: '10px',
                                  padding: '10px 14px',
                                  textAlign: 'center',
                                  minWidth: '100px',
                                }}
                              >
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#7e22ce' }}>
                                  {test.startTime}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  {test.durationMinutes} мин
                                </div>
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
      </div>
    </AppShell>
  );
};
