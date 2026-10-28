import { useEffect, useState, useCallback } from 'react';
import { getToken } from '../utils/auth';
import { api } from '../utils/api';
import { AppShell } from '../components/layout/AppShell';
import '../styles/TeacherDashboard.css';

interface TeacherProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  university: {
    id: string;
    name: string;
    shortName: string | null;
  };
  faculty: {
    id: string;
    name: string;
  };
  department: string | null;
  position: string | null;
  experience: number | null;
  bio: string | null;
  avatarUrl: string | null;
  premium: boolean;
}

interface TeacherGroup {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
  course: number;
  capacity: number;
  activeStudentsCount: number;
  availablePlaces: number;
  semester: number;
  academicYear: string;
  lessonDay: string | null;
  lessonTime: string | null;
  classroom: string | null;
  status: string;
}

interface DashboardData {
  teacher: {
    id: string;
    fullName: string;
    email: string;
    position: string | null;
    department: string | null;
    university: string;
    faculty: string;
  };
  groupsCount: number;
  pendingRequestsCount: number;
  activeStudentsCount: number;
  groups: TeacherGroup[];
}

export default function TeacherDashboardPage() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [groups, setGroups] = useState<TeacherGroup[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setError('Авторизация қажет. Алдымен жүйеге кіріңіз.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [profileData, dashboardData, groupsData] = await Promise.all([
        api.get<{ profile: TeacherProfile }>('/api/teacher/profile'),
        api.get<DashboardData>('/api/teacher/dashboard'),
        api.get<{ groups: TeacherGroup[] }>('/api/teacher/groups'),
      ]);

      setProfile(profileData.profile);
      setDashboard(dashboardData);
      setGroups(groupsData.groups);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Оқытушы деректерін жүктеу кезінде белгісіз қате орын алды');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const teacherName = profile?.fullName || dashboard?.teacher.fullName || 'Оқытушы';

  return (
    <AppShell userRole="TEACHER">
      <div className="teacher-dashboard-embedded">
        {loading && (
          <div className="dashboard-loading" style={{ margin: '40px 0' }}>
            <div className="dashboard-loading-card">
              <div className="loading-spinner" />
              <h2>SmartUni жүктелуде...</h2>
              <p>Оқытушы кабинетінің деректері алынуда</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="dashboard-error" style={{ margin: '40px 0' }}>
            <div className="dashboard-error-card">
              <div className="error-icon">!</div>
              <h2>Қате орын алды</h2>
              <p>{error}</p>
              <button
                type="button"
                className="retry-button"
                onClick={loadData}
              >
                🔄 Қайта көру
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Welcome Section */}
          <section className="dashboard-welcome">
            <div>
              <div className="teacher-badge">
                <span>🎓</span>
                <span>TEACHER PORTAL · OVERVIEW</span>
              </div>

              <h1>
                Сәлем, {teacherName.split(' ')[0]}! 👋
              </h1>

              <p>
                SmartUni оқытушыларға арналған электронды ортасына қош келдіңіз.
                Топтарыңыз бен оқу процесін басқарыңыз.
              </p>
            </div>

            <div className="welcome-university">
              <span>🏛️</span>
              <div>
                <strong>
                  {profile?.university.shortName ||
                    profile?.university.name ||
                    dashboard?.teacher.university ||
                    'Көкшетау университеті'}
                </strong>
                <span>
                  {profile?.department ||
                    dashboard?.teacher.department ||
                    profile?.faculty.name ||
                    dashboard?.teacher.faculty ||
                    'Ақпараттық технологиялар'}
                </span>
              </div>
            </div>
          </section>

          {/* Statistics Cards */}
          <section className="dashboard-stats">
            <div className="dashboard-stat-card">
              <div className="stat-icon purple">👥</div>
              <div>
                <span>Менің топтарым</span>
                <strong>{dashboard?.groupsCount ?? groups.length}</strong>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon orange">📩</div>
              <div>
                <span>Күтудегі өтініштер</span>
                <strong>{dashboard?.pendingRequestsCount ?? 0}</strong>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon green">🎓</div>
              <div>
                <span>Белсенді студенттер</span>
                <strong>{dashboard?.activeStudentsCount ?? 0}</strong>
              </div>
            </div>
          </section>

          {/* Groups Section */}
          <section className="dashboard-card" id="my-groups">
            <div className="dashboard-card-header">
              <div>
                <span className="card-label">ОҚУ ТОПТАРЫ</span>
                <h2>Менің топтарым</h2>
              </div>
              <div className="education-icon">👥</div>
            </div>

            {groups.length === 0 ? (
              <div className="subjects-empty">
                <div className="subjects-empty-icon">🔍</div>
                <h3>Әзірге оқу топтары жоқ</h3>
                <p>Сізге әлі бекітілген белсенді оқу топтары табылмады.</p>
              </div>
            ) : (
              <div className="teacher-groups-grid">
                {groups.map((group) => {
                  const percentFilled =
                    group.capacity > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (group.activeStudentsCount / group.capacity) * 100,
                          ),
                        )
                      : 0;

                  return (
                    <article
                      key={group.id}
                      className="teacher-group-card"
                    >
                      <div>
                        <div className="group-card-top">
                          <div className="group-card-title">
                            <h3>{group.subject.name}</h3>
                            <span className="group-subject-code">
                              {group.subject.code || 'Код көрсетілмеген'}
                            </span>
                          </div>

                          <span
                            className={`group-status-pill ${
                              group.status === 'ACTIVE'
                                ? 'active'
                                : 'inactive'
                            }`}
                          >
                            {group.status}
                          </span>
                        </div>

                        <div className="group-academic-details">
                          <span className="academic-chip">
                            Топ: <strong>{group.name}</strong>
                          </span>
                          <span className="academic-chip">
                            {group.course}-курс
                          </span>
                          <span className="academic-chip">
                            {group.semester}-семестр
                          </span>
                          <span className="academic-chip">
                            {group.academicYear}
                          </span>
                        </div>

                        <div className="group-schedule-box">
                          <div className="schedule-item">
                            <span>📅</span>
                            <span>
                              Күн:{' '}
                              <strong>
                                {group.lessonDay || 'Белгіленбеген'}
                              </strong>
                            </span>
                          </div>
                          <div className="schedule-item">
                            <span>🕐</span>
                            <span>
                              Уақыт:{' '}
                              <strong>
                                {group.lessonTime || 'Белгіленбеген'}
                              </strong>
                            </span>
                          </div>
                          <div className="schedule-item">
                            <span>🏫</span>
                            <span>
                              Аудитория:{' '}
                              <strong>
                                {group.classroom || 'Белгіленбеген'}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="group-progress-box">
                        <div className="group-capacity-labels">
                          <span>
                            Студенттер: {group.activeStudentsCount} /{' '}
                            {group.capacity}
                          </span>
                          <span>Бос орын: {group.availablePlaces}</span>
                        </div>

                        <div className="capacity-track">
                          <div
                            className={`capacity-fill ${
                              percentFilled >= 100
                                ? 'full'
                                : percentFilled >= 80
                                  ? 'near-full'
                                  : ''
                            }`}
                            style={{ width: `${percentFilled}%` }}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
