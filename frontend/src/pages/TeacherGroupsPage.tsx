import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
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

interface AvailableSubject {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
}

interface TeacherGroupItem {
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

export const TeacherGroupsPage: React.FC = () => {
  const navigate = useNavigate();

  // Data states
  const [groups, setGroups] = useState<TeacherGroupItem[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<AvailableSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');

  // Modal states: Create / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TeacherGroupItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formCourse, setFormCourse] = useState<number>(1);
  const [formSemester, setFormSemester] = useState<number>(1);
  const [formAcademicYear, setFormAcademicYear] = useState('2026-2027');
  const [formCapacity, setFormCapacity] = useState<number>(30);
  const [formLessonDay, setFormLessonDay] = useState('');
  const [formLessonTime, setFormLessonTime] = useState('');
  const [formClassroom, setFormClassroom] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal states: Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<TeacherGroupItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch groups and available subjects
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupsRes, subjectsRes] = await Promise.all([
        api.get<{ groups: TeacherGroupItem[] }>('/api/teacher/groups'),
        api.get<{ subjects: AvailableSubject[] }>('/api/teacher/available-subjects'),
      ]);
      setGroups(groupsRes.groups || []);
      setAvailableSubjects(subjectsRes.subjects || []);
    } catch (err: any) {
      setError(err.message || 'Топтарды жүктеу сәтсіз аяқталды');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Aggregated Stats
  const stats = useMemo(() => {
    const totalGroups = groups.length;
    const totalActiveStudents = groups.reduce((acc, g) => acc + g.activeStudentsCount, 0);
    const totalAvailablePlaces = groups.reduce((acc, g) => acc + g.availablePlaces, 0);
    const activeGroupsCount = groups.filter((g) => g.status === 'ACTIVE').length;
    return { totalGroups, totalActiveStudents, totalAvailablePlaces, activeGroupsCount };
  }, [groups]);

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch =
        !searchQuery.trim() ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.subject.code && g.subject.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (g.classroom && g.classroom.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCourse = courseFilter === 'ALL' || g.course === courseFilter;
      const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [groups, searchQuery, courseFilter, statusFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingGroup(null);
    setFormName('');
    setFormSubjectId(availableSubjects.length > 0 ? availableSubjects[0].id : '');
    setFormCourse(1);
    setFormSemester(1);
    setFormAcademicYear('2026-2027');
    setFormCapacity(30);
    setFormLessonDay('');
    setFormLessonTime('');
    setFormClassroom('');
    setFormStatus('ACTIVE');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (group: TeacherGroupItem) => {
    setEditingGroup(group);
    setFormName(group.name);
    setFormSubjectId(group.subject.id);
    setFormCourse(group.course);
    setFormSemester(group.semester);
    setFormAcademicYear(group.academicYear);
    setFormCapacity(group.capacity);
    setFormLessonDay(group.lessonDay || '');
    setFormLessonTime(group.lessonTime || '');
    setFormClassroom(group.classroom || '');
    setFormStatus(group.status);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Топ атауын енгізіңіз');
      return;
    }
    if (!formSubjectId && !editingGroup) {
      setFormError('Пәнді таңдаңыз');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingGroup) {
        await api.patch(`/api/teacher/groups/${editingGroup.id}`, {
          name: formName.trim(),
          course: Number(formCourse),
          semester: Number(formSemester),
          academicYear: formAcademicYear.trim(),
          capacity: Number(formCapacity),
          lessonDay: formLessonDay.trim() || undefined,
          lessonTime: formLessonTime.trim() || undefined,
          classroom: formClassroom.trim() || undefined,
          status: formStatus,
        });
      } else {
        await api.post('/api/teacher/groups', {
          name: formName.trim(),
          subjectId: formSubjectId,
          course: Number(formCourse),
          semester: Number(formSemester),
          academicYear: formAcademicYear.trim(),
          capacity: Number(formCapacity),
          lessonDay: formLessonDay.trim() || undefined,
          lessonTime: formLessonTime.trim() || undefined,
          classroom: formClassroom.trim() || undefined,
          status: formStatus,
        });
      }
      setIsFormModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Топты сақтау кезінде қате туындады');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (group: TeacherGroupItem) => {
    setGroupToDelete(group);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/teacher/groups/${groupToDelete.id}`);
      setIsDeleteModalOpen(false);
      setGroupToDelete(null);
      await fetchData();
    } catch (err: any) {
      setDeleteError(err.message || 'Топты өшіру кезінде қате туындады');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <AppShell userRole="TEACHER">
      <div className="su-content-container" style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Page Header */}
        <PageHeader
          title="Менің топтарым"
          subtitle="Бекітілген оқу топтары, сабақ кестесі және студенттер құрамы"
          breadcrumbs={[
            { label: 'Басты бет', path: '/teacher/dashboard' },
            { label: 'Менің топтарым' },
          ]}
          actions={
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                variant="outline"
                icon={<Icon name="bell" size={16} />}
                onClick={() => navigate('/teacher/requests')}
              >
                Қосылу өтініштері
              </Button>
              <Button
                variant="primary"
                icon={<Icon name="plus" size={16} />}
                onClick={handleOpenCreateModal}
              >
                Жаңа топ құру
              </Button>
            </div>
          }
        />

        {/* Global Error State */}
        {error && (
          <div style={{ marginBottom: '24px' }}>
            <ErrorState title="Деректерді жүктеу қатесі" message={error} onRetry={fetchData} />
          </div>
        )}

        {/* Stats Row */}
        {!loading && !error && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <Card padding="md" style={{ background: 'var(--su-bg-surface)' }}>
              <CardBody style={{ padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--su-radius-md)',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: 'var(--su-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="users" size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--su-text-muted)', fontWeight: 500 }}>
                      БАРЛЫҚ ТОПТАР
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--su-text-main)' }}>
                      {stats.totalGroups}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card padding="md" style={{ background: 'var(--su-bg-surface)' }}>
              <CardBody style={{ padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--su-radius-md)',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: 'var(--su-success, #10b981)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="user" size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--su-text-muted)', fontWeight: 500 }}>
                      БЕЛСЕНДІ СТУДЕНТТЕР
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--su-text-main)' }}>
                      {stats.totalActiveStudents}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card padding="md" style={{ background: 'var(--su-bg-surface)' }}>
              <CardBody style={{ padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--su-radius-md)',
                      background: 'rgba(245, 158, 11, 0.1)',
                      color: 'var(--su-warning, #f59e0b)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="grid" size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--su-text-muted)', fontWeight: 500 }}>
                      БОС ОРЫНДАР
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--su-text-main)' }}>
                      {stats.totalAvailablePlaces}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card padding="md" style={{ background: 'var(--su-bg-surface)' }}>
              <CardBody style={{ padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--su-radius-md)',
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--su-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="check-circle" size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--su-text-muted)', fontWeight: 500 }}>
                      БЕЛСЕНДІ ТОПТАР
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--su-text-main)' }}>
                      {stats.activeGroupsCount}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Filter and Search Bar */}
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
              {/* Search */}
              <div style={{ flex: '1', minWidth: '260px' }}>
                <input
                  type="text"
                  placeholder="Топ немесе пән атауы бойынша іздеу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    background: 'var(--su-bg-surface)',
                    color: 'var(--su-text-main)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Course & Status Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    background: 'var(--su-bg-surface)',
                    color: 'var(--su-text-main)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">Барлық курстар</option>
                  <option value="1">1-курс</option>
                  <option value="2">2-курс</option>
                  <option value="3">3-курс</option>
                  <option value="4">4-курс</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    background: 'var(--su-bg-surface)',
                    color: 'var(--su-text-main)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">Барлық статустар</option>
                  <option value="ACTIVE">Белсенді (ACTIVE)</option>
                  <option value="ARCHIVED">Мұрағатталған (ARCHIVED)</option>
                </select>

                {(searchQuery || courseFilter !== 'ALL' || statusFilter !== 'ALL') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setCourseFilter('ALL');
                      setStatusFilter('ALL');
                    }}
                  >
                    Сүзгіні тазалау
                  </Button>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Loading Skeletons */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
            <Skeleton height="180px" />
            <Skeleton height="180px" />
            <Skeleton height="180px" />
          </div>
        )}

        {/* Empty State: No Groups */}
        {!loading && !error && groups.length === 0 && (
          <Card>
            <CardBody style={{ padding: '48px 24px', textAlign: 'center' }}>
              <EmptyState
                icon="users"
                title="Әзірге топтар тіркелмеген"
                description="Сізге бекітілген оқу топтары жоқ. Жаңа оқу тобын құрып, студенттерді шақырыңыз."
                action={
                  <Button
                    variant="primary"
                    icon={<Icon name="plus" size={16} />}
                    onClick={handleOpenCreateModal}
                  >
                    Алғашқы топты құру
                  </Button>
                }
              />
            </CardBody>
          </Card>
        )}

        {/* Empty State: Filter mismatch */}
        {!loading && !error && groups.length > 0 && filteredGroups.length === 0 && (
          <Card>
            <CardBody style={{ padding: '36px 16px', textAlign: 'center' }}>
              <div style={{ color: 'var(--su-text-muted)', fontSize: '14px', marginBottom: '12px' }}>
                Іздеу және сүзгі шарттарына сәйкес топтар табылмады.
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setCourseFilter('ALL');
                  setStatusFilter('ALL');
                }}
              >
                Сүзгіні қайтару
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Groups Grid */}
        {!loading && !error && filteredGroups.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '18px',
            }}
          >
            {filteredGroups.map((group) => {
              const occupancyPercent = Math.min(
                100,
                Math.round((group.activeStudentsCount / group.capacity) * 100),
              );

              return (
                <Card
                  key={group.id}
                  hoverable
                  style={{
                    border: '1px solid var(--su-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <CardBody style={{ padding: '20px' }}>
                    {/* Top Row: Group name, Subject badge, status */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px',
                        marginBottom: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: '18px',
                              fontWeight: 700,
                              color: 'var(--su-text-main)',
                            }}
                          >
                            {group.name}
                          </h3>
                          <Badge
                            variant={group.status === 'ACTIVE' ? 'success' : 'neutral'}
                            size="sm"
                          >
                            {group.status === 'ACTIVE' ? 'Белсенді' : 'Мұрағат'}
                          </Badge>
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--su-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Icon name="book" size={14} />
                          {group.subject.name}
                          {group.subject.code ? ` (${group.subject.code})` : ''}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Icon name="file-text" size={14} />}
                          onClick={() => handleOpenEditModal(group)}
                          title="Өңдеу"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          style={{ color: 'var(--su-danger)' }}
                          icon={<Icon name="x" size={14} />}
                          onClick={() => handleOpenDeleteModal(group)}
                          title="Өшіру"
                        />
                      </div>
                    </div>

                    {/* Academic details pills */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      <Badge variant="primary" size="sm">
                        {group.course}-курс • {group.semester}-семестр
                      </Badge>
                      <Badge variant="neutral" size="sm">
                        {group.academicYear} оқу жылы
                      </Badge>
                    </div>

                    {/* Capacity & Occupancy Bar */}
                    <div style={{ marginBottom: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          fontWeight: 500,
                          marginBottom: '6px',
                          color: 'var(--su-text-muted)',
                        }}
                      >
                        <span>
                          Студенттер: <strong>{group.activeStudentsCount}</strong> / {group.capacity}
                        </span>
                        <span>{group.availablePlaces} бос орын</span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          background: 'var(--su-bg-muted)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${occupancyPercent}%`,
                            height: '100%',
                            background:
                              occupancyPercent >= 90
                                ? 'var(--su-danger)'
                                : occupancyPercent >= 70
                                ? 'var(--su-warning, #f59e0b)'
                                : 'var(--su-primary)',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </div>

                    {/* Schedule & Classroom */}
                    {(group.lessonDay || group.lessonTime || group.classroom) && (
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--su-radius-md)',
                          background: 'var(--su-bg-muted)',
                          fontSize: '12px',
                          color: 'var(--su-text-main)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          marginBottom: '16px',
                        }}
                      >
                        {(group.lessonDay || group.lessonTime) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icon name="clock" size={14} style={{ color: 'var(--su-text-muted)' }} />
                            <span>
                              {group.lessonDay || 'Күн көрсетілмеген'}{' '}
                              {group.lessonTime ? `• ${group.lessonTime}` : ''}
                            </span>
                          </div>
                        )}
                        {group.classroom && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icon name="grid" size={14} style={{ color: 'var(--su-text-muted)' }} />
                            <span>Аудитория: {group.classroom}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Open Group Details button */}
                    <Button
                      variant="outline"
                      size="sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                      icon={<Icon name="chevron-right" size={14} />}
                      iconPosition="right"
                      onClick={() => navigate(`/teacher/groups/${group.id}`)}
                    >
                      Топты басқару / Студенттер тізімі
                    </Button>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal: Create or Edit Group */}
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={editingGroup ? `«${editingGroup.name}» тобын өңдеу` : 'Жаңа оқу тобын құру'}
          maxWidth="560px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                variant="secondary"
                onClick={() => setIsFormModalOpen(false)}
                disabled={formSubmitting}
              >
                Бас тарту
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitForm}
                loading={formSubmitting}
              >
                {editingGroup ? 'Өзгерістерді сақтау' : 'Топты құру'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {formError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--su-radius-md)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--su-danger)',
                  fontSize: '13px',
                }}
              >
                {formError}
              </div>
            )}

            {/* Name & Subject */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Топ атауы *
                </label>
                <input
                  type="text"
                  placeholder="Мысалы: IS-23-1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    boxSizing: 'border-box',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Оқу пәні *
                </label>
                {editingGroup ? (
                  <input
                    type="text"
                    disabled
                    value={editingGroup.subject.name}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--su-radius-md)',
                      border: '1px solid var(--su-border)',
                      background: 'var(--su-bg-muted)',
                      boxSizing: 'border-box',
                      fontSize: '14px',
                      color: 'var(--su-text-muted)',
                    }}
                  />
                ) : (
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--su-radius-md)',
                      border: '1px solid var(--su-border)',
                      background: 'var(--su-bg-surface)',
                      boxSizing: 'border-box',
                      fontSize: '14px',
                    }}
                  >
                    {availableSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.code ? `(${s.code})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Course, Semester, Capacity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Курс *
                </label>
                <select
                  value={formCourse}
                  onChange={(e) => setFormCourse(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    background: 'var(--su-bg-surface)',
                    boxSizing: 'border-box',
                    fontSize: '14px',
                  }}
                >
                  <option value={1}>1-курс</option>
                  <option value={2}>2-курс</option>
                  <option value={3}>3-курс</option>
                  <option value={4}>4-курс</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Семестр *
                </label>
                <select
                  value={formSemester}
                  onChange={(e) => setFormSemester(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    background: 'var(--su-bg-surface)',
                    boxSizing: 'border-box',
                    fontSize: '14px',
                  }}
                >
                  <option value={1}>1-семестр</option>
                  <option value={2}>2-семестр</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Сыйымдылық *
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(Number(e.target.value))}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    boxSizing: 'border-box',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Academic Year & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Оқу жылы *
                </label>
                <input
                  type="text"
                  placeholder="2026-2027"
                  value={formAcademicYear}
                  onChange={(e) => setFormAcademicYear(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    boxSizing: 'border-box',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Статус
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    background: 'var(--su-bg-surface)',
                    boxSizing: 'border-box',
                    fontSize: '14px',
                  }}
                >
                  <option value="ACTIVE">Белсенді (ACTIVE)</option>
                  <option value="ARCHIVED">Мұрағатталған (ARCHIVED)</option>
                </select>
              </div>
            </div>

            {/* Schedule & Classroom */}
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--su-radius-md)',
                background: 'var(--su-bg-muted)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '10px',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Сабақ күні
                </label>
                <input
                  type="text"
                  placeholder="Дүйсенбі"
                  value={formLessonDay}
                  onChange={(e) => setFormLessonDay(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    boxSizing: 'border-box',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Сабақ уақыты
                </label>
                <input
                  type="text"
                  placeholder="14:00 - 15:30"
                  value={formLessonTime}
                  onChange={(e) => setFormLessonTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    boxSizing: 'border-box',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Аудитория
                </label>
                <input
                  type="text"
                  placeholder="301"
                  value={formClassroom}
                  onChange={(e) => setFormClassroom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    boxSizing: 'border-box',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>
          </form>
        </Modal>

        {/* Modal: Delete Confirmation */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Топты өшіру"
          maxWidth="440px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                variant="secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteSubmitting}
              >
                Болдырмау
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                loading={deleteSubmitting}
              >
                Өшіру
              </Button>
            </div>
          }
        >
          <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--su-text-main)' }}>
            {deleteError && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--su-radius-md)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--su-danger)',
                  fontSize: '13px',
                  marginBottom: '12px',
                }}
              >
                {deleteError}
              </div>
            )}
            <p style={{ margin: '0 0 10px 0' }}>
              Сіз шынымен де <strong>«{groupToDelete?.name}»</strong> тобын өшіргіңіз келе ме?
            </p>
            {groupToDelete && groupToDelete.activeStudentsCount > 0 ? (
              <div
                style={{
                  padding: '10px',
                  borderRadius: 'var(--su-radius-md)',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: 'var(--su-danger)',
                  fontSize: '13px',
                }}
              >
                ⚠️ Топта {groupToDelete.activeStudentsCount} студент бар! Белсенді студенттері бар топты өшіруге болмайды.
              </div>
            ) : (
              <div
                style={{
                  padding: '10px',
                  borderRadius: 'var(--su-radius-md)',
                  background: 'rgba(245, 158, 11, 0.08)',
                  color: 'var(--su-warning, #f59e0b)',
                  fontSize: '13px',
                }}
              >
                Бұл әрекет топты жүйеден біржола жояды.
              </div>
            )}
          </div>
        </Modal>
      </div>
    </AppShell>
  );
};

export default TeacherGroupsPage;

