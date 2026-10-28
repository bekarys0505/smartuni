import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

interface StudentItem {
  id: string; // membership id
  studentProfileId: string;
  fullName: string;
  email: string;
  phone: string | null;
  university: string;
  faculty: string;
  major: string;
  course: number;
  joinedAt: string;
  membershipStatus: string;
}

interface PendingRequestItem {
  id: string; // request id
  status: string;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    course: number;
    university: string;
    faculty: string;
    major: string;
  };
}

interface GroupDetailsData {
  group: {
    id: string;
    name: string;
    subject: {
      id: string;
      name: string;
      code: string | null;
      description: string | null;
    };
    course: number;
    capacity: number;
    semester: number;
    academicYear: string;
    lessonDay: string | null;
    lessonTime: string | null;
    classroom: string | null;
    status: string;
    activeStudentsCount: number;
    availablePlaces: number;
    createdAt: string;
  };
  students: StudentItem[];
  pendingRequests: PendingRequestItem[];
}

export const TeacherGroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  // Data states
  const [data, setData] = useState<GroupDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs & Search
  const [activeTab, setActiveTab] = useState<'students' | 'requests'>('students');
  const [studentSearch, setStudentSearch] = useState('');

  // Processing states for join requests
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [processingType, setProcessingType] = useState<'accept' | 'reject' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal: Remove Student
  const [studentToRemove, setStudentToRemove] = useState<StudentItem | null>(null);
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // Fetch Group Details
  const fetchGroupDetails = async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.get<GroupDetailsData>(`/api/teacher/groups/${groupId}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Топ мәліметтерін жүктеу сәтсіз аяқталды');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  // Handle Accept Join Request
  const handleAcceptRequest = async (req: PendingRequestItem) => {
    setProcessingRequestId(req.id);
    setProcessingType('accept');
    setFeedback(null);

    try {
      await api.patch(`/api/teacher/join-requests/${req.id}/accept`);
      setFeedback({
        type: 'success',
        message: `${req.student.fullName} студентінің өтініші қабылданды және топқа қосылды!`,
      });
      await fetchGroupDetails();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Өтінішті қабылдау кезінде қате орын алды',
      });
    } finally {
      setProcessingRequestId(null);
      setProcessingType(null);
    }
  };

  // Handle Reject Join Request
  const handleRejectRequest = async (req: PendingRequestItem) => {
    setProcessingRequestId(req.id);
    setProcessingType('reject');
    setFeedback(null);

    try {
      await api.patch(`/api/teacher/join-requests/${req.id}/reject`);
      setFeedback({
        type: 'success',
        message: `${req.student.fullName} студентінің өтініші қабылданбады.`,
      });
      await fetchGroupDetails();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Өтінішті қабылдамау кезінде қате орын алды',
      });
    } finally {
      setProcessingRequestId(null);
      setProcessingType(null);
    }
  };

  // Confirm Remove Student
  const handleConfirmRemoveStudent = async () => {
    if (!studentToRemove || !groupId) return;
    setRemoveSubmitting(true);
    setRemoveError(null);

    try {
      await api.delete(`/api/teacher/groups/${groupId}/students/${studentToRemove.studentProfileId}`);
      setFeedback({
        type: 'success',
        message: `${studentToRemove.fullName} топ құрамынан шығарылды`,
      });
      setStudentToRemove(null);
      await fetchGroupDetails();
    } catch (err: any) {
      setRemoveError(err.message || 'Студентті топтан шығару кезінде қате орын алды');
    } finally {
      setRemoveSubmitting(false);
    }
  };

  // Filter students by search
  const students = data?.students;
  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.major && s.major.toLowerCase().includes(q)),
    );
  }, [students, studentSearch]);

  const group = data?.group;
  const occupancyPercent = group
    ? Math.min(100, Math.round((group.activeStudentsCount / group.capacity) * 100))
    : 0;

  return (
    <AppShell userRole="TEACHER">
      <div className="su-content-container" style={{ padding: '24px 0', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Loading state */}
        {loading && (
          <div>
            <Skeleton height="40px" width="300px" style={{ marginBottom: '16px' }} />
            <Skeleton height="160px" style={{ marginBottom: '24px' }} />
            <Skeleton height="300px" />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div style={{ marginBottom: '24px' }}>
            <ErrorState title="Топты жүктеу қатесі" message={error} onRetry={fetchGroupDetails} />
          </div>
        )}

        {/* Content */}
        {!loading && !error && group && (
          <>
            {/* Page Header */}
            <PageHeader
              title={`Топ: ${group.name}`}
              subtitle={`${group.subject.name} • ${group.course}-курс • ${group.academicYear} оқу жылы`}
              breadcrumbs={[
                { label: 'Басты бет', path: '/teacher/dashboard' },
                { label: 'Менің топтарым', path: '/teacher/groups' },
                { label: group.name },
              ]}
              actions={
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <Button
                    variant="outline"
                    icon={<Icon name="chevron-left" size={14} />}
                    onClick={() => navigate('/teacher/groups')}
                  >
                    Топтар тізіміне қайту
                  </Button>
                  <Button
                    variant="outline"
                    icon={<Icon name="layers" size={14} />}
                    onClick={() => navigate(`/teacher/topics?subjectId=${group.subject.id}`)}
                  >
                    Оқу тақырыптары
                  </Button>
                  <Button
                    variant="primary"
                    icon={<Icon name="file-text" size={14} />}
                    onClick={() => navigate('/teacher/assignments')}
                  >
                    Тапсырмалар
                  </Button>
                </div>
              }
            />

            {/* Feedback message banner */}
            {feedback && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--su-radius-md)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background:
                    feedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: feedback.type === 'success' ? 'var(--su-success, #10b981)' : 'var(--su-danger)',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: `1px solid ${
                    feedback.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                  }`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name={feedback.type === 'success' ? 'check-circle' : 'alert-circle'} size={18} />
                  <span>{feedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Group Summary Card */}
            <Card style={{ marginBottom: '24px', border: '1px solid var(--su-border)' }}>
              <CardBody style={{ padding: '24px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '20px',
                    alignItems: 'center',
                  }}
                >
                  {/* Left: Academic Profile */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--su-text-main)' }}>
                        {group.name}
                      </span>
                      <Badge variant={group.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                        {group.status === 'ACTIVE' ? 'Белсенді топ' : 'Мұрағатталған'}
                      </Badge>
                    </div>

                    <div
                      style={{
                        fontSize: '14px',
                        color: 'var(--su-primary)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '10px',
                      }}
                    >
                      <Icon name="book" size={16} />
                      {group.subject.name}
                      {group.subject.code ? ` (${group.subject.code})` : ''}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <Badge variant="primary" size="sm">
                        {group.course}-курс • {group.semester}-семестр
                      </Badge>
                      <Badge variant="neutral" size="sm">
                        {group.academicYear} оқу жылы
                      </Badge>
                    </div>
                  </div>

                  {/* Middle: Schedule & Classroom */}
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--su-radius-md)',
                      background: 'var(--su-bg-muted)',
                      fontSize: '13px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--su-text-muted)' }}>САБАҚ КЕСТЕСІ:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="clock" size={16} style={{ color: 'var(--su-primary)' }} />
                      <span>
                        {group.lessonDay || 'Күн белгіленбеген'} {group.lessonTime ? `• ${group.lessonTime}` : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="grid" size={16} style={{ color: 'var(--su-primary)' }} />
                      <span>Аудитория: {group.classroom || 'Көрсетілмеген'}</span>
                    </div>
                  </div>

                  {/* Right: Enrollment Capacity */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        fontWeight: 600,
                        marginBottom: '8px',
                        color: 'var(--su-text-main)',
                      }}
                    >
                      <span>Студенттер саны:</span>
                      <span>
                        {group.activeStudentsCount} / {group.capacity} (бос: {group.availablePlaces})
                      </span>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        background: 'var(--su-bg-muted)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '8px',
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
                          borderRadius: '4px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>
                      Сыйымдылықтың толуы: {occupancyPercent}%
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid var(--su-border)',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('students')}
                style={{
                  padding: '12px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'students' ? '3px solid var(--su-primary)' : '3px solid transparent',
                  color: activeTab === 'students' ? 'var(--su-primary)' : 'var(--su-text-muted)',
                  fontWeight: activeTab === 'students' ? 700 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Icon name="users" size={16} />
                <span>Студенттер құрамы ({data.students.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                style={{
                  padding: '12px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'requests' ? '3px solid var(--su-primary)' : '3px solid transparent',
                  color: activeTab === 'requests' ? 'var(--su-primary)' : 'var(--su-text-muted)',
                  fontWeight: activeTab === 'requests' ? 700 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Icon name="bell" size={16} />
                <span>Қосылу өтініштері</span>
                {data.pendingRequests.length > 0 && (
                  <Badge variant="danger" size="sm">
                    {data.pendingRequests.length}
                  </Badge>
                )}
              </button>
            </div>

            {/* TAB 1: Enrolled Students */}
            {activeTab === 'students' && (
              <div>
                {/* Search Bar */}
                <div style={{ marginBottom: '16px', maxWidth: '360px' }}>
                  <input
                    type="text"
                    placeholder="Студент аты немесе Email бойынша іздеу..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--su-radius-md)',
                      border: '1px solid var(--su-border)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {data.students.length === 0 ? (
                  <Card>
                    <CardBody style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <EmptyState
                        icon="user"
                        title="Бұл топта әзірге студенттер жоқ"
                        description="Студенттер топқа қосылу өтінішін жібергенде немесе оларды қабылдағанда осында пайда болады."
                      />
                    </CardBody>
                  </Card>
                ) : filteredStudents.length === 0 ? (
                  <Card>
                    <CardBody style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--su-text-muted)' }}>
                      Іздеу шарттары бойынша студенттер табылмады.
                    </CardBody>
                  </Card>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredStudents.map((st) => {
                      const initials = st.fullName.charAt(0).toUpperCase() || 'S';
                      const joinedDate = new Date(st.joinedAt).toLocaleDateString('kk-KZ', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });

                      return (
                        <Card key={st.id} style={{ border: '1px solid var(--su-border)' }}>
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
                              {/* Avatar and name */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1', minWidth: '260px' }}>
                                <div
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'var(--su-primary)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    flexShrink: 0,
                                  }}
                                >
                                  {initials}
                                </div>

                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h4
                                      style={{
                                        margin: 0,
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        color: 'var(--su-text-main)',
                                      }}
                                    >
                                      {st.fullName}
                                    </h4>
                                    <Badge variant="primary" size="sm">
                                      {st.course}-курс
                                    </Badge>
                                  </div>
                                  <div style={{ fontSize: '13px', color: 'var(--su-text-muted)', marginTop: '2px' }}>
                                    {st.email} {st.phone ? `• ${st.phone}` : ''}
                                  </div>
                                </div>
                              </div>

                              {/* Academic info */}
                              <div style={{ fontSize: '12px', color: 'var(--su-text-muted)', minWidth: '180px' }}>
                                <div>
                                  Мамандық: <strong>{st.major || 'Көрсетілмеген'}</strong>
                                </div>
                                <div>
                                  Тіркелді: <span>{joinedDate}</span>
                                </div>
                              </div>

                              {/* Action */}
                              <div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  style={{ color: 'var(--su-danger)' }}
                                  icon={<Icon name="x" size={14} />}
                                  onClick={() => {
                                    setRemoveError(null);
                                    setStudentToRemove(st);
                                  }}
                                >
                                  Топтан шығару
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
            )}

            {/* TAB 2: Pending Join Requests */}
            {activeTab === 'requests' && (
              <div>
                {data.pendingRequests.length === 0 ? (
                  <Card>
                    <CardBody style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <EmptyState
                        icon="bell"
                        title="Күтудегі өтініштер жоқ"
                        description={`«${group.name}» тобына жаңа қосылу өтініштері түспеген немесе барлығы өңделген.`}
                      />
                    </CardBody>
                  </Card>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {data.pendingRequests.map((req) => {
                      const initials = req.student.fullName.charAt(0).toUpperCase() || 'S';
                      const formattedTime = new Date(req.createdAt).toLocaleDateString('kk-KZ', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const isProcessing = processingRequestId === req.id;

                      return (
                        <Card key={req.id} style={{ border: '1px solid var(--su-border)' }}>
                          <CardBody style={{ padding: '18px 20px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '16px',
                              }}
                            >
                              {/* Student Info */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1', minWidth: '280px' }}>
                                <div
                                  style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '50%',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: 'var(--su-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '16px',
                                    flexShrink: 0,
                                  }}
                                >
                                  {initials}
                                </div>

                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h4
                                      style={{
                                        margin: 0,
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: 'var(--su-text-main)',
                                      }}
                                    >
                                      {req.student.fullName}
                                    </h4>
                                    <Badge variant="warning" size="sm">
                                      Күтуде (PENDING)
                                    </Badge>
                                  </div>
                                  <div style={{ fontSize: '13px', color: 'var(--su-text-muted)', marginTop: '2px' }}>
                                    {req.student.course}-курс • {req.student.major}
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--su-text-muted)', marginTop: '2px' }}>
                                    Email: {req.student.email} {req.student.phone ? `• Тел: ${req.student.phone}` : ''}
                                  </div>
                                </div>
                              </div>

                              {/* Request Time */}
                              <div style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Icon name="clock" size={14} />
                                  <span>Жіберілген уақыты: {formattedTime}</span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={<Icon name="check" size={14} />}
                                  loading={isProcessing && processingType === 'accept'}
                                  disabled={isProcessing}
                                  onClick={() => handleAcceptRequest(req)}
                                >
                                  Қабылдау
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={<Icon name="x" size={14} />}
                                  loading={isProcessing && processingType === 'reject'}
                                  disabled={isProcessing}
                                  onClick={() => handleRejectRequest(req)}
                                >
                                  Қабылдамау
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
            )}

            {/* Modal: Remove Student Confirmation */}
            <Modal
              isOpen={Boolean(studentToRemove)}
              onClose={() => setStudentToRemove(null)}
              title="Студентті топтан шығару"
              maxWidth="440px"
              footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <Button
                    variant="secondary"
                    onClick={() => setStudentToRemove(null)}
                    disabled={removeSubmitting}
                  >
                    Болдырмау
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleConfirmRemoveStudent}
                    loading={removeSubmitting}
                  >
                    Топтан шығару
                  </Button>
                </div>
              }
            >
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--su-text-main)' }}>
                {removeError && (
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
                    {removeError}
                  </div>
                )}
                <p style={{ margin: '0 0 10px 0' }}>
                  Сіз шынымен де <strong>{studentToRemove?.fullName}</strong> студентін «{group.name}» тобынан шығарғыңыз келе ме?
                </p>
                <div
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--su-radius-md)',
                    background: 'rgba(245, 158, 11, 0.08)',
                    color: 'var(--su-warning, #f59e0b)',
                    fontSize: '13px',
                  }}
                >
                  Студент топ мүшелігінен алынады, бірақ оның оқу тарихы мен бұрынғы бағалары базада сақталады.
                </div>
              </div>
            </Modal>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default TeacherGroupDetailPage;
