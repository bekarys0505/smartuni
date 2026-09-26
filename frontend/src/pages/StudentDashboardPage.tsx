import { useEffect, useState } from 'react';

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

type DashboardResponse = {
  message: string;
  student: StudentData;
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
    <div className="student-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <span className="dashboard-logo-mark">
            S
          </span>

          <div>
            <div className="dashboard-logo-title">
              SmartUni
            </div>

            <div className="dashboard-logo-subtitle">
              Электронды білім беру жүйесі
            </div>
          </div>
        </div>

        <div className="dashboard-header-right">
          <button
            className="notification-button"
            type="button"
          >
            🔔
          </button>

          <div className="dashboard-user">
            <div className="dashboard-avatar">
              {student.fullName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="dashboard-user-info">
              <strong>
                {student.fullName}
              </strong>

              <span>
                {student.course}-курс
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <nav className="dashboard-nav">
            <a
              href="/student/dashboard"
              className="dashboard-nav-item active"
            >
              <span>🏠</span>
              Басты бет
            </a>

            <a
              href="#subjects"
              className="dashboard-nav-item"
            >
              <span>📚</span>
              Пәндер
            </a>

            <a
              href="#groups"
              className="dashboard-nav-item"
            >
              <span>➕</span>
              Топқа қосылу
            </a>

            <a
              href="#"
              className="dashboard-nav-item"
            >
              <span>📝</span>
              Тапсырмалар
            </a>

            <a
              href="#"
              className="dashboard-nav-item"
            >
              <span>🧪</span>
              Лаборатория
            </a>

            <a
              href="#"
              className="dashboard-nav-item"
            >
              <span>📅</span>
              Күнтізбе
            </a>

            <a
              href="#"
              className="dashboard-nav-item"
            >
              <span>📊</span>
              Бағалар
            </a>

            <a
              href="#"
              className="dashboard-nav-item"
            >
              <span>📈</span>
              Прогресс
            </a>

            <a
              href="#"
              className="dashboard-nav-item"
            >
              <span>🔔</span>
              Хабарламалар
            </a>

            <a
              href="#"
              className="dashboard-nav-item"
            >
              <span>⚙️</span>
              Профиль
            </a>
          </nav>

          <div className="dashboard-sidebar-bottom">
            <div className="premium-sidebar-card">
              <div className="premium-icon">
                ⭐
              </div>

              <strong>
                SmartUni Premium
              </strong>

              <p>
                Оқу мүмкіндіктерін кеңейтіңіз.
              </p>

              <button type="button">
                Толығырақ
              </button>
            </div>

            <button
              className="logout-button"
              type="button"
              onClick={() => {
                localStorage.removeItem(
                  'accessToken',
                );

                localStorage.removeItem(
                  'smartuniUser',
                );

                window.location.href =
                  '/login';
              }}
            >
              <span>🚪</span>
              Шығу
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
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
                📝
              </div>

              <div>
                <span>Тапсырмалар</span>
                <strong>0</strong>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon green">
                📊
              </div>

              <div>
                <span>Орташа баға</span>
                <strong>—</strong>
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
        </main>
      </div>
    </div>
  );
}
