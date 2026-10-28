import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../utils/api';
import { getToken, updateUser } from '../utils/auth';
import { AppShell } from '../components/layout/AppShell';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/index';
import '../styles/ProfilePage.css';

interface UserProfileData {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  status: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    course: number;
    avatarUrl: string | null;
    premium: boolean;
    university: {
      id: string;
      name: string;
      shortName: string | null;
    } | null;
    faculty: {
      id: string;
      name: string;
    } | null;
    major: {
      id: string;
      name: string;
    } | null;
    groups: Array<{
      id: string;
      name: string;
      course: number;
      subject: {
        id: string;
        name: string;
        code: string | null;
      };
    }>;
  } | null;
  teacher?: {
    id: string;
    department: string | null;
    position: string | null;
    experience: number | null;
    bio: string | null;
    avatarUrl: string | null;
    premium: boolean;
    university: {
      id: string;
      name: string;
      shortName: string | null;
    } | null;
    faculty: {
      id: string;
      name: string;
    } | null;
    subjects: Array<{
      id: string;
      name: string;
      code: string | null;
    }>;
    groups: Array<{
      id: string;
      name: string;
      course: number;
      activeStudentsCount: number;
      subject: {
        id: string;
        name: string;
        code: string | null;
      };
    }>;
  } | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'edit' | 'security'>('info');

  // Edit form state
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editExperience, setEditExperience] = useState<string>('');
  const [editBio, setEditBio] = useState('');
  const [editCourse, setEditCourse] = useState<number>(1);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Security / Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError('Сессия табылмады. Қайта жүйеге кіріңіз.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.get<{ profile: UserProfileData }>('/api/auth/profile');
      setProfile(data.profile);

      // Populate edit fields
      setEditFullName(data.profile.fullName || '');
      setEditPhone(data.profile.phone || '');
      if (data.profile.teacher) {
        setEditDepartment(data.profile.teacher.department || '');
        setEditPosition(data.profile.teacher.position || '');
        setEditExperience(data.profile.teacher.experience !== null ? String(data.profile.teacher.experience) : '');
        setEditBio(data.profile.teacher.bio || '');
      }
      if (data.profile.student) {
        setEditCourse(data.profile.student.course || 1);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Профильді жүктеу кезінде белгісіз қате орын алды');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);

    if (!editFullName.trim()) {
      setProfileFeedback({ type: 'error', message: 'Аты-жөніңізді енгізіңіз' });
      return;
    }

    setSavingProfile(true);

    try {
      const payload: any = {
        fullName: editFullName.trim(),
        phone: editPhone.trim() || undefined,
      };

      if (profile?.role === 'TEACHER') {
        payload.department = editDepartment.trim();
        payload.position = editPosition.trim();
        payload.experience = editExperience !== '' ? parseInt(editExperience, 10) : undefined;
        payload.bio = editBio.trim();
      } else if (profile?.role === 'STUDENT') {
        payload.course = editCourse;
      }

      const res = await api.patch<{ profile: UserProfileData }>('/api/auth/profile', payload);

      setProfile(res.profile);
      // Sync local storage user state
      updateUser({
        fullName: res.profile.fullName,
        phone: res.profile.phone,
      });

      setProfileFeedback({
        type: 'success',
        message: 'Профиль мәліметтері сәтті жаңартылды!',
      });
      setActiveTab('info');
    } catch (err) {
      if (err instanceof Error) {
        setProfileFeedback({ type: 'error', message: err.message });
      } else {
        setProfileFeedback({ type: 'error', message: 'Профильді сақтау сәтсіз аяқталды' });
      }
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', message: 'Қазіргі құпиясөзді енгізіңіз' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordFeedback({
        type: 'error',
        message: 'Жаңа құпиясөз кемінде 8 таңбадан тұруы керек',
      });
      return;
    }

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!regex.test(newPassword)) {
      setPasswordFeedback({
        type: 'error',
        message: 'Құпиясөз кемінде 1 бас әріп, 1 кіші әріп және 1 саннан құралуы қажет',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        message: 'Жаңа құпиясөздер бір-біріне сәйкес келмейді',
      });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordFeedback({
        type: 'error',
        message: 'Жаңа құпиясөз қазіргі құпиясөзден өзгеше болуы керек',
      });
      return;
    }

    setSavingPassword(true);

    try {
      await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setPasswordFeedback({
        type: 'success',
        message: 'Құпиясөз сәтті жаңартылды!',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err instanceof Error) {
        setPasswordFeedback({ type: 'error', message: err.message });
      } else {
        setPasswordFeedback({ type: 'error', message: 'Құпиясөзді өзгерту сәтсіз аяқталды' });
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const roleTitleMap: Record<string, string> = {
    STUDENT: 'Студент',
    TEACHER: 'Оқытушы',
    ADMIN: 'Әкімші',
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('kk-KZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AppShell userRole={profile?.role}>
      <div className="su-profile-page">
        {/* Page Header */}
        <div className="su-profile-header">
          <h1 className="su-profile-title">Жеке профиль және баптаулар</h1>
          <p className="su-profile-subtitle">
            Аккаунт мәліметтерін қарау, профиль деректерін өңдеу және қауіпсіздік параметрлері
          </p>
        </div>

        {/* Global Loading / Error State */}
        {loading && (
          <div className="su-profile-loading">
            <span className="su-spinner" style={{ width: 36, height: 36 }} />
            <p>Профиль деректері жүктелуде...</p>
          </div>
        )}

        {error && (
          <div className="su-profile-banner su-profile-banner--error">
            <Icon name="alert-circle" size={20} />
            <span>{error}</span>
          </div>
        )}

        {profile && !loading && (
          <>
            {/* Hero Card */}
            <div className="su-profile-hero">
              <div className="su-profile-hero-left">
                <div className="su-profile-avatar-wrap">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="su-profile-hero-info">
                  <h2>{profile.fullName}</h2>
                  <div className="su-profile-hero-meta">
                    <span className={`su-profile-role-badge su-role-${profile.role}`}>
                      <Icon
                        name={
                          profile.role === 'STUDENT'
                            ? 'graduation-cap'
                            : profile.role === 'TEACHER'
                            ? 'users'
                            : 'shield'
                        }
                        size={14}
                      />
                      {roleTitleMap[profile.role] || profile.role}
                    </span>
                    <span className="su-profile-status-badge">
                      <Icon name="check-circle" size={14} />
                      {profile.status === 'ACTIVE' ? 'Белсенді' : profile.status}
                    </span>
                    <span className="su-profile-created-date">
                      Тіркелген күні: {formatDate(profile.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {activeTab !== 'edit' ? (
                  <Button
                    variant="primary"
                    icon={<Icon name="settings" size={16} />}
                    onClick={() => {
                      setActiveTab('edit');
                      setProfileFeedback(null);
                    }}
                  >
                    Профильді өңдеу
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    icon={<Icon name="chevron-left" size={16} />}
                    onClick={() => setActiveTab('info')}
                  >
                    Көру режиміне оралу
                  </Button>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="su-profile-tabs">
              <button
                type="button"
                className={`su-profile-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                <Icon name="user" size={18} />
                <span>Жалпы мәліметтер</span>
              </button>
              <button
                type="button"
                className={`su-profile-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
                onClick={() => setActiveTab('edit')}
              >
                <Icon name="settings" size={18} />
                <span>Профильді өңдеу</span>
              </button>
              <button
                type="button"
                className={`su-profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <Icon name="shield" size={18} />
                <span>Құпиясөз және Қауіпсіздік</span>
              </button>
            </div>

            {/* Feedback Notifications */}
            {profileFeedback && (
              <div className={`su-profile-banner su-profile-banner--${profileFeedback.type}`}>
                <Icon name={profileFeedback.type === 'success' ? 'check-circle' : 'alert-circle'} size={20} />
                <span>{profileFeedback.message}</span>
              </div>
            )}

            {passwordFeedback && (
              <div className={`su-profile-banner su-profile-banner--${passwordFeedback.type}`}>
                <Icon name={passwordFeedback.type === 'success' ? 'check-circle' : 'alert-circle'} size={20} />
                <span>{passwordFeedback.message}</span>
              </div>
            )}

            {/* Tab 1: Info (View Mode) */}
            {activeTab === 'info' && (
              <div className="su-profile-grid">
                <div>
                  {/* Basic Information */}
                  <div className="su-profile-card">
                    <div className="su-profile-card-header">
                      <h3 className="su-profile-card-title">
                        <Icon name="user" size={20} />
                        Негізгі ақпарат
                      </h3>
                    </div>
                    <div className="su-profile-details-list">
                      <div className="su-profile-detail-item">
                        <span className="su-profile-detail-label">Аты-жөні</span>
                        <span className="su-profile-detail-value">{profile.fullName}</span>
                      </div>
                      <div className="su-profile-detail-item">
                        <span className="su-profile-detail-label">Email мекенжайы</span>
                        <span className="su-profile-detail-value">{profile.email}</span>
                      </div>
                      <div className="su-profile-detail-item">
                        <span className="su-profile-detail-label">Телефон нөмірі</span>
                        <span className={`su-profile-detail-value ${!profile.phone ? 'empty' : ''}`}>
                          {profile.phone || 'Көрсетілмеген'}
                        </span>
                      </div>
                      <div className="su-profile-detail-item">
                        <span className="su-profile-detail-label">Жүйелік рөлі</span>
                        <span className="su-profile-detail-value">
                          {roleTitleMap[profile.role] || profile.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Student Academic Info */}
                  {profile.role === 'STUDENT' && profile.student && (
                    <div className="su-profile-card">
                      <div className="su-profile-card-header">
                        <h3 className="su-profile-card-title">
                          <Icon name="book" size={20} />
                          Академиялық оқу мәліметтері
                        </h3>
                      </div>
                      <div className="su-profile-details-list">
                        <div className="su-profile-detail-item">
                          <span className="su-profile-detail-label">Университет</span>
                          <span className="su-profile-detail-value">
                            {profile.student.university?.name || 'Көрсетілмеген'}
                          </span>
                        </div>
                        <div className="su-profile-detail-item">
                          <span className="su-profile-detail-label">Факультет</span>
                          <span className="su-profile-detail-value">
                            {profile.student.faculty?.name || 'Көрсетілмеген'}
                          </span>
                        </div>
                        <div className="su-profile-detail-item">
                          <span className="su-profile-detail-label">Мамандық</span>
                          <span className="su-profile-detail-value">
                            {profile.student.major?.name || 'Көрсетілмеген'}
                          </span>
                        </div>
                        <div className="su-profile-detail-item">
                          <span className="su-profile-detail-label">Оқу курсы</span>
                          <span className="su-profile-detail-value">
                            {profile.student.course}-курс
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Teacher Academic Info */}
                  {profile.role === 'TEACHER' && profile.teacher && (
                    <div className="su-profile-card">
                      <div className="su-profile-card-header">
                        <h3 className="su-profile-card-title">
                          <Icon name="book" size={20} />
                          Кәсіби және академиялық мәліметтер
                        </h3>
                      </div>
                      <div className="su-profile-details-list">
                        <div className="su-profile-detail-item">
                          <span className="su-profile-detail-label">Университет</span>
                          <span className="su-profile-detail-value">
                            {profile.teacher.university?.name || 'Көрсетілмеген'}
                          </span>
                        </div>
                        <div className="su-profile-detail-item">
                          <span className="su-profile-detail-label">Факультет</span>
                          <span className="su-profile-detail-value">
                            {profile.teacher.faculty?.name || 'Көрсетілмеген'}
                          </span>
                        </div>
                        <div className="su-profile-detail-item">
                          <span className="su-profile-detail-label">Кафедра</span>
                          <span className={`su-profile-detail-value ${!profile.teacher.department ? 'empty' : ''}`}>
                            {profile.teacher.department || 'Көрсетілмеген'}
                          </span>
                        </div>
                        <div className="su-profile-detail-item">
                          <span className="su-profile-detail-label">Лауазымы</span>
                          <span className={`su-profile-detail-value ${!profile.teacher.position ? 'empty' : ''}`}>
                            {profile.teacher.position || 'Көрсетілмеген'}
                          </span>
                        </div>
                        <div className="su-profile-detail-item">
                          <span className="su-profile-detail-label">Педагогикалық өтілі</span>
                          <span className={`su-profile-detail-value ${profile.teacher.experience === null ? 'empty' : ''}`}>
                            {profile.teacher.experience !== null ? `${profile.teacher.experience} жыл` : 'Көрсетілмеген'}
                          </span>
                        </div>
                      </div>

                      {profile.teacher.bio && (
                        <div style={{ marginTop: 20 }}>
                          <span className="su-profile-detail-label">Өмірбаян / Қосымша ақпарат</span>
                          <p style={{ marginTop: 6, fontSize: '0.95rem', color: 'var(--su-text-body)', lineHeight: 1.6 }}>
                            {profile.teacher.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Info */}
                  {profile.role === 'ADMIN' && (
                    <div className="su-profile-card">
                      <div className="su-profile-card-header">
                        <h3 className="su-profile-card-title">
                          <Icon name="shield" size={20} />
                          Жүйелік басқару құқықтары
                        </h3>
                      </div>
                      <p style={{ color: 'var(--su-text-body)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                        Бұл есептік жазба жүйенің толық әкімшілік құқықтарына ие (Global Admin). Қауіпсіздік
                        талаптарына сәйкес әкімшілік рөлді қарапайым өңдеу арқылы өзгерту шектелген.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Groups / Subjects */}
                <div>
                  {profile.role === 'STUDENT' && profile.student && (
                    <div className="su-profile-card">
                      <div className="su-profile-card-header">
                        <h3 className="su-profile-card-title">
                          <Icon name="users" size={20} />
                          Тіркелген топтары ({profile.student.groups.length})
                        </h3>
                      </div>
                      {profile.student.groups.length === 0 ? (
                        <div className="su-profile-empty">Студент әзірге топтарға тіркелмеген</div>
                      ) : (
                        <div className="su-profile-pills">
                          {profile.student.groups.map((grp) => (
                            <div key={grp.id} className="su-profile-pill">
                              <span className="su-profile-pill-code">{grp.name}</span>
                              <span className="su-profile-pill-meta">{grp.subject.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {profile.role === 'TEACHER' && profile.teacher && (
                    <>
                      <div className="su-profile-card">
                        <div className="su-profile-card-header">
                          <h3 className="su-profile-card-title">
                            <Icon name="book" size={20} />
                            Оқытатын пәндері ({profile.teacher.subjects.length})
                          </h3>
                        </div>
                        {profile.teacher.subjects.length === 0 ? (
                          <div className="su-profile-empty">Әзірге бекітілген пәндер жоқ</div>
                        ) : (
                          <div className="su-profile-pills">
                            {profile.teacher.subjects.map((sub) => (
                              <div key={sub.id} className="su-profile-pill">
                                {sub.code && <span className="su-profile-pill-code">{sub.code}:</span>}
                                <span>{sub.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="su-profile-card">
                        <div className="su-profile-card-header">
                          <h3 className="su-profile-card-title">
                            <Icon name="users" size={20} />
                            Жетекшілік топтары ({profile.teacher.groups.length})
                          </h3>
                        </div>
                        {profile.teacher.groups.length === 0 ? (
                          <div className="su-profile-empty">Әзірге белсенді топтар жоқ</div>
                        ) : (
                          <div className="su-profile-pills">
                            {profile.teacher.groups.map((grp) => (
                              <div key={grp.id} className="su-profile-pill">
                                <span className="su-profile-pill-code">{grp.name}</span>
                                <span className="su-profile-pill-meta">
                                  ({grp.activeStudentsCount} студент)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Edit Profile */}
            {activeTab === 'edit' && (
              <div className="su-profile-card" style={{ maxWidth: 760 }}>
                <div className="su-profile-card-header">
                  <h3 className="su-profile-card-title">
                    <Icon name="settings" size={20} />
                    Профиль мәліметтерін түзету
                  </h3>
                </div>

                <form onSubmit={handleSaveProfile} className="su-profile-form">
                  <div className="su-form-row">
                    <div className="su-form-group">
                      <label htmlFor="fullName">Аты-жөні *</label>
                      <input
                        id="fullName"
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        placeholder="Мысалы: Бауыржан Момышұлы"
                        required
                      />
                    </div>

                    <div className="su-form-group">
                      <label htmlFor="phone">Телефон нөмірі</label>
                      <input
                        id="phone"
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="+77011234567"
                      />
                      <span className="su-form-hint">Халықаралық формат (+7...)</span>
                    </div>
                  </div>

                  <div className="su-form-row">
                    <div className="su-form-group">
                      <label htmlFor="email">Email мекенжайы</label>
                      <input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        title="Email мекенжайын өзгерту жүйелік қауіпсіздік мақсатында бұғатталған"
                      />
                      <span className="su-form-hint">Email тек оқу режимінде (өзгертілмейді)</span>
                    </div>

                    <div className="su-form-group">
                      <label htmlFor="role">Жүйедегі рөлі</label>
                      <input
                        id="role"
                        type="text"
                        value={roleTitleMap[profile.role] || profile.role}
                        disabled
                      />
                      <span className="su-form-hint">Рөлді өзгертуге құқық жоқ</span>
                    </div>
                  </div>

                  {/* Teacher specific edit fields */}
                  {profile.role === 'TEACHER' && (
                    <>
                      <div className="su-form-row">
                        <div className="su-form-group">
                          <label htmlFor="department">Кафедра</label>
                          <input
                            id="department"
                            type="text"
                            value={editDepartment}
                            onChange={(e) => setEditDepartment(e.target.value)}
                            placeholder="Мысалы: Компьютерлік инженерия"
                          />
                        </div>

                        <div className="su-form-group">
                          <label htmlFor="position">Лауазымы</label>
                          <input
                            id="position"
                            type="text"
                            value={editPosition}
                            onChange={(e) => setEditPosition(e.target.value)}
                            placeholder="Мысалы: Аға оқытушы, Доцент"
                          />
                        </div>
                      </div>

                      <div className="su-form-row">
                        <div className="su-form-group">
                          <label htmlFor="experience">Педагогикалық өтілі (жыл)</label>
                          <input
                            id="experience"
                            type="number"
                            min="0"
                            max="70"
                            value={editExperience}
                            onChange={(e) => setEditExperience(e.target.value)}
                            placeholder="Мысалы: 5"
                          />
                        </div>
                      </div>

                      <div className="su-form-group">
                        <label htmlFor="bio">Өмірбаян және ғылыми қызығушылықтары</label>
                        <textarea
                          id="bio"
                          rows={4}
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          placeholder="Өзіңіз туралы қысқаша мәлімет..."
                        />
                      </div>
                    </>
                  )}

                  {/* Student specific edit fields */}
                  {profile.role === 'STUDENT' && (
                    <div className="su-form-row">
                      <div className="su-form-group">
                        <label htmlFor="course">Оқу курсы</label>
                        <select
                          id="course"
                          value={editCourse}
                          onChange={(e) => setEditCourse(parseInt(e.target.value, 10))}
                        >
                          <option value={1}>1-курс</option>
                          <option value={2}>2-курс</option>
                          <option value={3}>3-курс</option>
                          <option value={4}>4-курс</option>
                          <option value={5}>5-курс</option>
                          <option value={6}>6-курс</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="su-form-actions">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setActiveTab('info');
                        setProfileFeedback(null);
                      }}
                      disabled={savingProfile}
                    >
                      Болдырмау
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={savingProfile}
                      icon={<Icon name="check" size={16} />}
                    >
                      Өзгерістерді сақтау
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 3: Security & Password */}
            {activeTab === 'security' && (
              <div className="su-profile-card" style={{ maxWidth: 640 }}>
                <div className="su-profile-card-header">
                  <h3 className="su-profile-card-title">
                    <Icon name="shield" size={20} />
                    Құпиясөзді өзгерту
                  </h3>
                </div>

                <form onSubmit={handleChangePassword} className="su-profile-form">
                  <div className="su-form-group">
                    <label htmlFor="currentPassword">Қазіргі құпиясөз *</label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="su-form-group">
                    <label htmlFor="newPassword">Жаңа құпиясөз *</label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="su-form-group">
                    <label htmlFor="confirmPassword">Жаңа құпиясөзді қайталау *</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="su-pwd-requirements">
                    <p>Құпиясөз қауіпсіздік талаптары:</p>
                    <ul>
                      <li>Кемінде 8 таңбадан тұруы тиіс</li>
                      <li>Кем дегенде 1 бас әріп (A-Z) және 1 кіші әріп (a-z)</li>
                      <li>Кем дегенде 1 сан (0-9) болуы қажет</li>
                      <li>Қазіргі құпиясөзбен бірдей болмауы тиіс</li>
                    </ul>
                  </div>

                  <div className="su-form-actions">
                    <Button
                      type="submit"
                      variant="primary"
                      loading={savingPassword}
                      icon={<Icon name="shield" size={16} />}
                    >
                      Құпиясөзді жаңарту
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
