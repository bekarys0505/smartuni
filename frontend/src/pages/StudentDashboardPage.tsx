import { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';

type StudentData = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;

  university: {
    id: string;
    name: string;
    shortName: string | null;
  };

  faculty: {
    id: string;
    name: string;
  };

  major: {
    id: string;
    name: string;
  };

  course: number;
  premium: boolean;
};

type SubjectData = {
  membershipId: string;

  group: {
    id: string;
    name: string;
    course: number;
    semester: number;
    academicYear: string;
    lessonDay: string | null;
    lessonTime: string | null;
    classroom: string | null;
  };

  subject: {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
  };

  teacher: {
    id: string;
    fullName: string;
  };

  joinedAt: string;
};

type GroupStatus =
  | 'AVAILABLE'
  | 'PENDING'
  | 'MEMBER'
  | 'REJECTED';

type AvailableGroup = {
  id: string;
  name: string;

  subject: {
    id: string;
    name: string;
    code: string | null;
  };

  teacher: {
    id: string;
    fullName: string;
  };

  course: number;
  semester: number;
  academicYear: string;

  schedule: {
    day: string | null;
    time: string | null;
    classroom: string | null;
  };

  capacity: number;
  currentStudents: number;
  availablePlaces: number;

  status: GroupStatus;
};

type DashboardProgress = {
  learning: number;
  academic: number;
  totalMaterials: number;
  completedMaterials: number;
  assignmentAverage: number;
  testAverage: number;
};

type DashboardResponse = {
  message: string;
  student: StudentData;
  progress?: DashboardProgress;
};

type SubjectsResponse = {
  message: string;
  subjects: SubjectData[];
};

type GroupsResponse = {
  message: string;
  groups: AvailableGroup[];
};

export default function StudentDashboardPage() {
  const [student, setStudent] =
    useState<StudentData | null>(null);

  const [progress, setProgress] =
    useState<DashboardProgress | null>(null);

  const [subjects, setSubjects] =
    useState<SubjectData[]>([]);

  const [groups, setGroups] =
    useState<AvailableGroup[]>([]);

  const [loading, setLoading] = useState(true);
  const [joiningGroupId, setJoiningGroupId] =
    useState<string | null>(null);

  const [error, setError] = useState('');
  const [groupError, setGroupError] = useState('');

  useEffect(() => {
    const token =
      localStorage.getItem('accessToken');

    if (!token) {
      setError(
        'Авторизация қажет. Алдымен жүйеге кіріңіз.',
      );

      setLoading(false);

      return;
    }

    async function loadDashboard() {
      try {
        const [
          dashboardResponse,
          subjectsResponse,
          groupsResponse,
        ] = await Promise.all([
          fetch(
            `${import.meta.env.VITE_API_URL}/api/student/dashboard`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          ),

          fetch(
            `${import.meta.env.VITE_API_URL}/api/student/subjects`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          ),

          fetch(
            `${import.meta.env.VITE_API_URL}/api/student/groups`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          ),
        ]);

        const dashboardData =
          await dashboardResponse.json();

        const subjectsData =
          await subjectsResponse.json();

        const groupsData =
          await groupsResponse.json();

        if (!dashboardResponse.ok) {
          throw new Error(
            dashboardData?.message ||
              'Dashboard деректерін алу мүмкін болмады',
          );
        }

        if (!subjectsResponse.ok) {
          throw new Error(
            subjectsData?.message ||
              'Пәндер деректерін алу мүмкін болмады',
          );
        }

        if (!groupsResponse.ok) {
          throw new Error(
            groupsData?.message ||
              'Топтар деректерін алу мүмкін болмады',
          );
        }

        setStudent(
          (dashboardData as DashboardResponse)
            .student,
        );

        if ((dashboardData as DashboardResponse).progress) {
          setProgress((dashboardData as DashboardResponse).progress!);
        }

        setSubjects(
          (subjectsData as SubjectsResponse)
            .subjects,
        );

        setGroups(
          (groupsData as GroupsResponse)
            .groups,
        );
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            'Dashboard деректерін жүктеу кезінде қате орын алды',
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function handleJoinGroup(
    groupId: string,
  ) {
    const token =
      localStorage.getItem('accessToken');

    if (!token) {
      setError(
        'Авторизация қажет. Алдымен жүйеге кіріңіз.',
      );

      return;
    }

    setJoiningGroupId(groupId);
    setGroupError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/student/groups/${groupId}/join`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Топқа қосылу өтінішін жіберу мүмкін болмады',
        );
      }

      setGroups((currentGroups) =>
        currentGroups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                status: 'PENDING',
              }
            : group,
        ),
      );
    } catch (err) {
      if (err instanceof Error) {
        setGroupError(err.message);
      } else {
        setGroupError(
          'Өтініш жіберу кезінде қате орын алды',
        );
      }
    } finally {
      setJoiningGroupId(null);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-card">
          <div className="loading-spinner" />

          <h2>SmartUni жүктелуде...</h2>

          <p>
            Студент деректері алынуда
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="dashboard-error-card">
          <div className="error-icon">!</div>

          <h2>Қате орын алды</h2>

          <p>{error}</p>

          <a
            href="/login"
            className="dashboard-login-button"
          >
            Жүйеге кіру
          </a>
        </div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <AppShell userRole="STUDENT">
      <div className="student-dashboard-embedded">
          <section className="dashboard-welcome">
            <div>
              <div className="dashboard-badge">
                STUDENT DASHBOARD
              </div>

              <h1>
                Сәлем,{' '}
                {student.fullName.split(' ')[0]}! 👋
              </h1>

              <p>
                SmartUni жүйесіндегі оқу барысыңызды
                бір жерден басқарыңыз.
              </p>
            </div>

            <div className="welcome-university">
              <span>🎓</span>

              <div>
                <strong>
                  {student.university.shortName ||
                    'ШУ'}
                </strong>

                <span>
                  {student.course}-курс
                </span>
              </div>
            </div>
          </section>

          <section className="dashboard-stats">
            <div className="dashboard-stat-card">
              <div className="stat-icon purple">
                📚
              </div>

              <div>
                <span>Менің пәндерім</span>

                <strong>
                  {subjects.length}
                </strong>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon blue">
                📖
              </div>

              <div>
                <span>Оқу прогресі</span>
                <strong>{progress ? `${progress.learning}%` : '—'}</strong>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon green">
                📊
              </div>

              <div>
                <span>Орташа баға</span>
                <strong>{progress && progress.academic > 0 ? `${progress.academic}%` : '—'}</strong>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon orange">
                ⭐
              </div>

              <div>
                <span>Premium</span>

                <strong>
                  {student.premium
                    ? 'ON'
                    : 'OFF'}
                </strong>
              </div>
            </div>
          </section>

          {/* Progress Overview Section */}
          {progress && (
            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px',
                marginBottom: '28px',
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#2563eb', background: 'rgba(37, 99, 235, 0.08)', padding: '4px 8px', borderRadius: '6px' }}>
                      ОҚУ ҮЛГЕРІМІ
                    </span>
                    <strong style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb' }}>
                      {progress.learning}%
                    </strong>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#1e293b', margin: '0 0 8px 0' }}>
                    Оқу материалдарының орындалуы
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
                    Барлығы {progress.completedMaterials} / {progress.totalMaterials} оқу материалы аяқталды
                  </p>

                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      background: '#f1f5f9',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      style={{
                        width: `${progress.learning}%`,
                        height: '100%',
                        background: '#2563eb',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>

                <a
                  href="/student/progress"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 16px',
                    background: '#f8fafc',
                    color: '#2563eb',
                    fontWeight: 600,
                    fontSize: '13px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  Толық прогресті көру →
                </a>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  padding: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a', background: 'rgba(34, 197, 94, 0.08)', padding: '4px 8px', borderRadius: '6px' }}>
                      БАҒАЛАР
                    </span>
                    <strong style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a' }}>
                      {progress.academic > 0 ? `${progress.academic}%` : '—'}
                    </strong>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#1e293b', margin: '0 0 8px 0' }}>
                    Академиялық орташа нәтиже
                  </h3>
                  <div style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
                    Тапсырмалар: <strong>{progress.assignmentAverage > 0 ? `${progress.assignmentAverage}%` : '—'}</strong> | Тесттер: <strong>{progress.testAverage > 0 ? `${progress.testAverage}%` : '—'}</strong>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      background: '#f1f5f9',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      style={{
                        width: `${progress.academic}%`,
                        height: '100%',
                        background: '#16a34a',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>

                <a
                  href="/student/progress"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 16px',
                    background: '#f8fafc',
                    color: '#16a34a',
                    fontWeight: 600,
                    fontSize: '13px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  Нәтижелерді талдау →
                </a>
              </div>
            </section>
          )}

          {/* Quick LMS Shortcuts (Diary, Calendar, Assignments, Tests) */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '28px',
            }}
          >
            <a
              href="/student/diary"
              style={{
                background: '#ffffff',
                padding: '18px 20px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }}
              >
                📖
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                  Электронды күнделік
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Бүгінгі сабақтар мен дедлайндар
                </div>
              </div>
            </a>

            <a
              href="/student/calendar"
              style={{
                background: '#ffffff',
                padding: '18px 20px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#faf5ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }}
              >
                📅
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                  Күнтізбе
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Айлық сабақ кестесі & оқиғалар
                </div>
              </div>
            </a>

            <a
              href="/student/assignments"
              style={{
                background: '#ffffff',
                padding: '18px 20px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#fffbeb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }}
              >
                📝
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                  Тапсырмалар
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Үй жұмыстары мен бағалар
                </div>
              </div>
            </a>

            <a
              href="/student/tests"
              style={{
                background: '#ffffff',
                padding: '18px 20px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                }}
              >
                ⏱️
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                  Тесттер
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Онлайн тесттер мен нәтижелер
                </div>
              </div>
            </a>
          </section>

          <section
            className="dashboard-card"
            id="subjects"
          >
            <div className="dashboard-card-header">
              <div>
                <span className="card-label">
                  ОҚУ
                </span>

                <h2>Менің пәндерім</h2>
              </div>

              <div className="education-icon">
                📚
              </div>
            </div>

            {subjects.length === 0 ? (
              <div className="subjects-empty">
                <div className="subjects-empty-icon">
                  📚
                </div>

                <h3>
                  Әзірге пәндер жоқ
                </h3>

                <p>
                  Сіз әлі ешқандай оқу тобына
                  қосылмағансыз.
                </p>
              </div>
            ) : (
              <div className="subjects-list">
                {subjects.map((item) => (
                  <div
                    className="subject-item"
                    key={item.membershipId}
                  >
                    <div className="subject-item-icon">
                      💻
                    </div>

                    <div className="subject-item-main">
                      <div className="subject-item-top">
                        <div>
                          <h3>
                            {item.subject.name}
                          </h3>

                          <span>
                            {item.subject.code ||
                              'Код көрсетілмеген'}
                          </span>
                        </div>

                        <span className="subject-group-badge">
                          {item.group.name}
                        </span>
                      </div>

                      <p>
                        {item.subject.description ||
                          'Пән сипаттамасы көрсетілмеген'}
                      </p>

                      <div className="subject-meta">
                        <span>
                          👨‍🏫{' '}
                          {item.teacher.fullName}
                        </span>

                        <span>
                          📅{' '}
                          {item.group.lessonDay ||
                            'Күн белгіленбеген'}
                        </span>

                        <span>
                          🕐{' '}
                          {item.group.lessonTime ||
                            'Уақыт белгіленбеген'}
                        </span>

                        <span>
                          🏫{' '}
                          {item.group.classroom ||
                            'Аудитория белгіленбеген'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            className="dashboard-card"
            id="groups"
          >
            <div className="dashboard-card-header">
              <div>
                <span className="card-label">
                  ТОПТАР
                </span>

                <h2>
                  Топқа қосылу
                </h2>
              </div>

              <div className="education-icon">
                👥
              </div>
            </div>

            <p className="groups-description">
              Өзіңізге сәйкес оқу тобын таңдап,
              мұғалімге қосылу өтінішін жіберіңіз.
            </p>

            {groupError && (
              <div className="group-error">
                {groupError}
              </div>
            )}

            {groups.length === 0 ? (
              <div className="subjects-empty">
                <div className="subjects-empty-icon">
                  🔍
                </div>

                <h3>
                  Қолжетімді топтар жоқ
                </h3>

                <p>
                  Қазіргі уақытта сіздің
                  курсыңызға сәйкес белсенді
                  топ табылмады.
                </p>
              </div>
            ) : (
              <div className="groups-list">
                {groups.map((group) => (
                  <div
                    className="group-item"
                    key={group.id}
                  >
                    <div className="group-item-icon">
                      👥
                    </div>

                    <div className="group-item-main">
                      <div className="group-item-header">
                        <div>
                          <h3>
                            {group.subject.name}
                          </h3>

                          <span>
                            {group.subject.code ||
                              'Код жоқ'}
                          </span>
                        </div>

                        <span className="subject-group-badge">
                          {group.name}
                        </span>
                      </div>

                      <div className="group-info">
                        <span>
                          👨‍🏫{' '}
                          {group.teacher.fullName}
                        </span>

                        <span>
                          📅{' '}
                          {group.schedule.day ||
                            'Күн жоқ'}
                        </span>

                        <span>
                          🕐{' '}
                          {group.schedule.time ||
                            'Уақыт жоқ'}
                        </span>

                        <span>
                          🏫{' '}
                          {group.schedule.classroom ||
                            'Аудитория жоқ'}
                        </span>
                      </div>

                      <div className="group-capacity">
                        <span>
                          👥{' '}
                          {group.currentStudents}
                          /{group.capacity} студент
                        </span>

                        <span>
                          Бос орын:{' '}
                          {group.availablePlaces}
                        </span>
                      </div>
                    </div>

                    <div className="group-action">
                      {group.status ===
                        'MEMBER' && (
                        <button
                          className="group-status-button member"
                          type="button"
                          disabled
                        >
                          ✓ Мүше
                        </button>
                      )}

                      {group.status ===
                        'PENDING' && (
                        <button
                          className="group-status-button pending"
                          type="button"
                          disabled
                        >
                          ⏳ Өтініш жіберілді
                        </button>
                      )}

                      {group.status ===
                        'REJECTED' && (
                        <button
                          className="group-join-button"
                          type="button"
                          disabled={
                            joiningGroupId ===
                            group.id
                          }
                          onClick={() =>
                            handleJoinGroup(
                              group.id,
                            )
                          }
                        >
                          {joiningGroupId ===
                          group.id
                            ? 'Жіберілуде...'
                            : 'Қайта өтініш беру'}
                        </button>
                      )}

                      {group.status ===
                        'AVAILABLE' && (
                        <button
                          className="group-join-button"
                          type="button"
                          disabled={
                            joiningGroupId ===
                            group.id ||
                            group.availablePlaces <=
                              0
                          }
                          onClick={() =>
                            handleJoinGroup(
                              group.id,
                            )
                          }
                        >
                          {joiningGroupId ===
                          group.id
                            ? 'Жіберілуде...'
                            : 'Топқа қосылу'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-grid">
            <div className="dashboard-card profile-card">
              <div className="dashboard-card-header">
                <div>
                  <span className="card-label">
                    ЖЕКЕ АҚПАРАТ
                  </span>

                  <h2>
                    Студент профилі
                  </h2>
                </div>

                <div className="profile-small-avatar">
                  {student.fullName
                    .charAt(0)
                    .toUpperCase()}
                </div>
              </div>

              <div className="profile-info">
                <div className="profile-row">
                  <span>Аты-жөні</span>
                  <strong>
                    {student.fullName}
                  </strong>
                </div>

                <div className="profile-row">
                  <span>Email</span>
                  <strong>
                    {student.email}
                  </strong>
                </div>

                <div className="profile-row">
                  <span>Телефон</span>
                  <strong>
                    {student.phone ||
                      'Көрсетілмеген'}
                  </strong>
                </div>

                <div className="profile-row">
                  <span>Курс</span>
                  <strong>
                    {student.course}-курс
                  </strong>
                </div>
              </div>
            </div>

            <div className="dashboard-card education-card">
              <div className="dashboard-card-header">
                <div>
                  <span className="card-label">
                    БІЛІМ
                  </span>

                  <h2>
                    Оқу ақпараты
                  </h2>
                </div>

                <div className="education-icon">
                  🎓
                </div>
              </div>

              <div className="education-info">
                <div className="education-item">
                  <span>
                    Университет
                  </span>

                  <strong>
                    {student.university.name}
                  </strong>
                </div>

                <div className="education-item">
                  <span>
                    Факультет
                  </span>

                  <strong>
                    {student.faculty.name}
                  </strong>
                </div>

                <div className="education-item">
                  <span>
                    Мамандық
                  </span>

                  <strong>
                    {student.major.name}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-card coming-soon-card">
            <div className="coming-soon-icon">
              🚀
            </div>

            <div>
              <span className="card-label">
                КЕЛЕСІ МҮМКІНДІКТЕР
              </span>

              <h2>
                SmartUni мүмкіндіктері жақында
                осында
              </h2>

              <p>
                Пәндер, тапсырмалар, тесттер,
                бағалар, күнтізбе, прогресс және
                хабарламалар осы Dashboard арқылы
                басқарылады.
              </p>
            </div>
          </section>
      </div>
    </AppShell>
  );
}
