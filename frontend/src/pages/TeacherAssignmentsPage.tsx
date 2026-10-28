import React, { useEffect, useState } from 'react';
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
import { api, getDownloadUrl } from '../utils/api';

type AssignmentResponseType = 'TEXT' | 'FILE' | 'TEXT_AND_FILE';
type AssignmentSubmissionStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED' | 'LATE';

interface TeacherAssignmentItem {
  id: string;
  title: string;
  description: string | null;
  responseType: AssignmentResponseType;
  attachmentUrl: string | null;
  maxScore: number;
  assignedAt: string;
  deadline: string | null;
  allowLate: boolean;
  createdAt: string;
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
  topic: {
    id: string;
    title: string;
  };
  submissionsCount: number;
  gradedCount: number;
  isLate: boolean;
}

interface SubjectWithTopics {
  id: string;
  name: string;
  code: string | null;
  topics: Array<{
    id: string;
    title: string;
    order: number;
  }>;
}

interface StudentSubmissionItem {
  student: {
    id: string;
    fullName: string;
    email: string;
    groupName: string;
    course: number;
  };
  submission: {
    id: string;
    textAnswer: string | null;
    fileUrl: string | null;
    status: AssignmentSubmissionStatus;
    submittedAt: string | null;
    score: number | null;
    teacherComment: string | null;
    gradedAt: string | null;
  } | null;
  status: AssignmentSubmissionStatus;
  score: number | null;
  teacherComment: string | null;
}

export const TeacherAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<TeacherAssignmentItem[]>([]);
  const [subjectsWithTopics, setSubjectsWithTopics] = useState<SubjectWithTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTopicId, setFormTopicId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formResponseType, setFormResponseType] = useState<AssignmentResponseType>('TEXT');
  const [formMaxScore, setFormMaxScore] = useState(100);
  const [formDeadline, setFormDeadline] = useState('');
  const [formAllowLate, setFormAllowLate] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Submissions Modal State
  const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [submissionsData, setSubmissionsData] = useState<{
    assignment: any;
    studentSubmissions: StudentSubmissionItem[];
    maxScore: number;
  } | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Grading Form State (in modal)
  const [gradingSubmission, setGradingSubmission] = useState<{
    submissionId: string;
    studentName: string;
    maxScore: number;
    score: number;
    teacherComment: string;
  } | null>(null);
  const [gradeSaving, setGradeSaving] = useState(false);

  const fetchAssignmentsAndSubjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const [assignmentsData, subjectsData] = await Promise.all([
        api.get<{ assignments: TeacherAssignmentItem[] }>('/api/teacher/assignments'),
        api.get<{ subjects: SubjectWithTopics[] }>('/api/teacher/subjects-and-topics'),
      ]);

      setAssignments(assignmentsData.assignments || []);
      setSubjectsWithTopics(subjectsData.subjects || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Белгісіз қате';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentsAndSubjects();
  }, []);

  const openCreateModal = () => {
    setEditingAssignmentId(null);
    setFormSubjectId(subjectsWithTopics[0]?.id || '');
    setFormTopicId(subjectsWithTopics[0]?.topics[0]?.id || '');
    setFormTitle('');
    setFormDescription('');
    setFormResponseType('TEXT');
    setFormMaxScore(100);
    setFormDeadline('');
    setFormAllowLate(false);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (a: TeacherAssignmentItem) => {
    setEditingAssignmentId(a.id);
    setFormSubjectId(a.subject.id);
    setFormTopicId(a.topic.id);
    setFormTitle(a.title);
    setFormDescription(a.description || '');
    setFormResponseType(a.responseType);
    setFormMaxScore(a.maxScore);
    setFormDeadline(
      a.deadline ? new Date(a.deadline).toISOString().slice(0, 16) : '',
    );
    setFormAllowLate(a.allowLate);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Тапсырма атауын жазыңыз.');
      return;
    }
    if (!editingAssignmentId && !formTopicId) {
      setFormError('Тақырыпты таңдаңыз.');
      return;
    }

    setFormSaving(true);
    setFormError(null);

    try {
      const payload = {
        topicId: formTopicId,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        responseType: formResponseType,
        maxScore: Number(formMaxScore) || 100,
        deadline: formDeadline ? new Date(formDeadline).toISOString() : null,
        allowLate: formAllowLate,
      };

      if (editingAssignmentId) {
        await api.patch(`/api/teacher/assignments/${editingAssignmentId}`, payload);
      } else {
        await api.post('/api/teacher/assignments', payload);
      }

      setIsFormModalOpen(false);
      await fetchAssignmentsAndSubjects();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Қате кетті';
      setFormError(msg);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Бұл тапсырманы және барлық студент жауаптарын өшіруге сенімдісіз бе?')) return;

    try {
      await api.delete(`/api/teacher/assignments/${id}`);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Өшіру қатесі');
    }
  };

  const openSubmissionsModal = async (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setIsSubmissionsModalOpen(true);
    setSubmissionsLoading(true);

    try {
      const data = await api.get<any>(`/api/teacher/assignments/${assignmentId}`);
      setSubmissionsData({
        assignment: data.assignment,
        studentSubmissions: data.studentSubmissions || [],
        maxScore: data.assignment.maxScore,
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Қате');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleOpenGradeForm = (item: StudentSubmissionItem) => {
    if (!item.submission) return;
    setGradingSubmission({
      submissionId: item.submission.id,
      studentName: item.student.fullName,
      maxScore: submissionsData?.maxScore || 100,
      score: item.submission.score !== null ? item.submission.score : submissionsData?.maxScore || 100,
      teacherComment: item.submission.teacherComment || '',
    });
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission || !selectedAssignmentId) return;

    setGradeSaving(true);

    try {
      const resData = await api.patch<any>(
        `/api/teacher/assignments/${selectedAssignmentId}/submissions/${gradingSubmission.submissionId}/grade`,
        {
          score: Number(gradingSubmission.score),
          teacherComment: gradingSubmission.teacherComment.trim() || undefined,
        },
      );

      // Update submissionsData in state
      setSubmissionsData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          studentSubmissions: prev.studentSubmissions.map((st) => {
            if (st.submission?.id === gradingSubmission.submissionId) {
              return {
                ...st,
                status: 'GRADED',
                score: resData.submission.score,
                teacherComment: resData.submission.teacherComment,
                submission: {
                  ...st.submission,
                  status: 'GRADED',
                  score: resData.submission.score,
                  teacherComment: resData.submission.teacherComment,
                  gradedAt: resData.submission.gradedAt,
                },
              };
            }
            return st;
          }),
        };
      });

      // Update assignment list graded count
      setAssignments((prev) =>
        prev.map((a) => {
          if (a.id === selectedAssignmentId) {
            return {
              ...a,
              gradedCount: a.gradedCount + 1,
            };
          }
          return a;
        }),
      );

      setGradingSubmission(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Бағалау қатесі');
    } finally {
      setGradeSaving(false);
    }
  };

  const getStatusBadge = (status: AssignmentSubmissionStatus, score: number | null, maxScore: number) => {
    switch (status) {
      case 'GRADED':
        return <Badge variant="success" size="sm">Бағаланды: {score} / {maxScore}</Badge>;
      case 'SUBMITTED':
        return <Badge variant="primary" size="sm">Жіберілді</Badge>;
      case 'LATE':
        return <Badge variant="warning" size="sm">Кеш тапсырылды</Badge>;
      case 'NOT_SUBMITTED':
      default:
        return <Badge variant="neutral" size="sm">Тапсырмаған</Badge>;
    }
  };

  // Find topics for currently selected form subject
  const currentSubjectTopics =
    subjectsWithTopics.find((s) => s.id === formSubjectId)?.topics || [];

  return (
    <AppShell userRole="TEACHER">
      <div className="su-teacher-assignments-container">
        <PageHeader
          title="Тапсырмалар"
          subtitle="Студенттерге арналған оқу тапсырмаларын жасау, қадағалау және баға қою"
          breadcrumbs={[
            { label: 'Басты бет', path: '/teacher/dashboard' },
            { label: 'Тапсырмалар' },
          ]}
          actions={
            <Button
              variant="primary"
              size="md"
              onClick={openCreateModal}
              icon={<Icon name="plus" size={16} />}
            >
              Жаңа тапсырма жасау
            </Button>
          }
        />

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </div>
        )}

        {!loading && error && (
          <ErrorState
            title="Тапсырмаларды жүктеу қатесі"
            message={error}
            onRetry={fetchAssignmentsAndSubjects}
          />
        )}

        {!loading && !error && assignments.length === 0 && (
          <EmptyState
            title="Тапсырмалар жоқ"
            description="Сіз әлі ешқандай оқу тапсырмасын құрмағансыз. Жаңа тапсырма қосу үшін жоғарыдағы түймені басыңыз."
            icon={<Icon name="file-text" size={48} />}
            action={
              <Button
                variant="primary"
                onClick={openCreateModal}
                icon={<Icon name="plus" size={16} />}
              >
                Тапсырма жасау
              </Button>
            }
          />
        )}

        {!loading && !error && assignments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {assignments.map((assignment) => {
              return (
                <Card
                  key={assignment.id}
                  padding="md"
                  hoverable
                  style={{ border: '1px solid var(--su-border)' }}
                >
                  <CardBody
                    style={{
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: '1 1 360px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Badge variant="primary" size="sm">
                          {assignment.subject.code || assignment.subject.name}
                        </Badge>
                        <span style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>
                          • {assignment.topic.title}
                        </span>
                        <Badge variant="neutral" size="sm">
                          {assignment.responseType === 'TEXT'
                            ? 'Мәтіндік'
                            : assignment.responseType === 'FILE'
                            ? 'Файлдық'
                            : 'Мәтін + Файл'}
                        </Badge>
                      </div>

                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: 'var(--su-text-main)',
                          margin: '0 0 6px 0',
                        }}
                      >
                        {assignment.title}
                      </h3>

                      {assignment.description && (
                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--su-text-muted)',
                            margin: '0 0 8px 0',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {assignment.description}
                        </p>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          fontSize: '12px',
                          color: 'var(--su-text-muted)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>
                          Макс. балл: <strong>{assignment.maxScore}</strong>
                        </span>
                        <span>
                          Мерзімі: <strong>{assignment.deadline ? new Date(assignment.deadline).toLocaleDateString('kk-KZ') : 'Шектелмеген'}</strong>
                        </span>
                        <span>
                          Жауаптар: <strong>{assignment.submissionsCount}</strong> студент
                        </span>
                        <span style={{ color: 'var(--su-success)' }}>
                          Бағаланды: <strong>{assignment.gradedCount}</strong>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openSubmissionsModal(assignment.id)}
                        icon={<Icon name="users" size={14} />}
                      >
                        Жауаптарды бағалау ({assignment.submissionsCount})
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(assignment)}
                        icon={<Icon name="settings" size={14} />}
                      >
                        Өңдеу
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        icon={<Icon name="x" size={14} />}
                      >
                        Өшіру
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create / Edit Assignment Modal */}
        {isFormModalOpen && (
          <Modal
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
            maxWidth="640px"
            title={editingAssignmentId ? 'Тапсырманы өңдеу' : 'Жаңа тапсырма жасау'}
          >
            <form onSubmit={handleSaveAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formError && (
                <div style={{ color: 'var(--su-error)', fontSize: '13px', background: 'rgba(211, 47, 47, 0.1)', padding: '8px 12px', borderRadius: '4px' }}>
                  ⚠️ {formError}
                </div>
              )}

              {/* Subject Select */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Пән:
                </label>
                <select
                  value={formSubjectId}
                  disabled={Boolean(editingAssignmentId)}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setFormSubjectId(sid);
                    const sub = subjectsWithTopics.find((s) => s.id === sid);
                    setFormTopicId(sub?.topics[0]?.id || '');
                  }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--su-radius-md)', border: '1px solid var(--su-border)' }}
                >
                  {subjectsWithTopics.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || 'КУРС'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Select */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Тақырып:
                </label>
                <select
                  value={formTopicId}
                  disabled={Boolean(editingAssignmentId)}
                  onChange={(e) => setFormTopicId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--su-radius-md)', border: '1px solid var(--su-border)' }}
                >
                  {currentSubjectTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      Тақырып #{t.order}: {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Тапсырма атауы:
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Мысалы: HTML бет жасау"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--su-radius-md)', border: '1px solid var(--su-border)', boxSizing: 'border-box' }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Тапсырма шарты мен сипаттамасы:
                </label>
                <textarea
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Студенттерге қойылатын талаптар мен нұсқаулықтар..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--su-radius-md)', border: '1px solid var(--su-border)', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Response Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                    Жауап түрі:
                  </label>
                  <select
                    value={formResponseType}
                    onChange={(e) => setFormResponseType(e.target.value as any)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--su-radius-md)', border: '1px solid var(--su-border)' }}
                  >
                    <option value="TEXT">Мәтіндік жауап</option>
                    <option value="FILE">Файл тіркеу</option>
                    <option value="TEXT_AND_FILE">Мәтін және Файл</option>
                  </select>
                </div>

                {/* Max Score */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                    Максималды балл:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formMaxScore}
                    onChange={(e) => setFormMaxScore(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--su-radius-md)', border: '1px solid var(--su-border)', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Deadline & Allow Late */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                    Тапсыру мерзімі (Deadline):
                  </label>
                  <input
                    type="datetime-local"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--su-radius-md)', border: '1px solid var(--su-border)', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ paddingTop: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formAllowLate}
                      onChange={(e) => setFormAllowLate(e.target.checked)}
                    />
                    Кеш тапсыруға рұқсат беру
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--su-border-light)', paddingTop: '14px' }}>
                <Button variant="secondary" size="md" type="button" onClick={() => setIsFormModalOpen(false)}>
                  Болдырмау
                </Button>
                <Button variant="primary" size="md" type="submit" loading={formSaving}>
                  {editingAssignmentId ? 'Өзгерістерді сақтау' : 'Тапсырманы жасау'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Submissions & Grading Modal */}
        {isSubmissionsModalOpen && (
          <Modal
            isOpen={isSubmissionsModalOpen}
            onClose={() => setIsSubmissionsModalOpen(false)}
            maxWidth="850px"
            title={submissionsData ? `Студенттер жауаптары: ${submissionsData.assignment.title}` : 'Жауаптар тізімі'}
          >
            {submissionsLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Skeleton height="50px" />
                <Skeleton height="50px" />
                <Skeleton height="50px" />
              </div>
            )}

            {!submissionsLoading && submissionsData && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--su-bg-muted)',
                    padding: '10px 14px',
                    borderRadius: 'var(--su-radius-md)',
                    marginBottom: '16px',
                    fontSize: '13px',
                  }}
                >
                  <span>
                    Барлық студенттер: <strong>{submissionsData.studentSubmissions.length}</strong>
                  </span>
                  <span>
                    Жіберілген: <strong>{submissionsData.studentSubmissions.filter((s) => s.status !== 'NOT_SUBMITTED').length}</strong>
                  </span>
                  <span>
                    Бағаланған: <strong style={{ color: 'var(--su-success)' }}>{submissionsData.studentSubmissions.filter((s) => s.status === 'GRADED').length}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {submissionsData.studentSubmissions.map((item) => (
                    <div
                      key={item.student.id}
                      style={{
                        border: '1px solid var(--su-border)',
                        borderRadius: 'var(--su-radius-md)',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '15px', color: 'var(--su-text-main)' }}>
                            {item.student.fullName}
                          </strong>
                          <span style={{ fontSize: '12px', color: 'var(--su-text-muted)', marginLeft: '8px' }}>
                            ({item.student.groupName}, {item.student.course}-курс)
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {getStatusBadge(item.status, item.score, submissionsData.maxScore)}

                          {item.submission && (
                            <Button
                              variant={item.status === 'GRADED' ? 'outline' : 'primary'}
                              size="sm"
                              onClick={() => handleOpenGradeForm(item)}
                              icon={<Icon name="check" size={14} />}
                            >
                              {item.status === 'GRADED' ? 'Бағаны өзгерту' : 'Бағалау'}
                            </Button>
                          )}
                        </div>
                      </div>

                      {item.submission ? (
                        <div
                          style={{
                            background: 'var(--su-bg-muted)',
                            borderRadius: 'var(--su-radius-sm)',
                            padding: '10px 12px',
                            fontSize: '13px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          {item.submission.submittedAt && (
                            <div style={{ fontSize: '11px', color: 'var(--su-text-muted)' }}>
                              Жіберілген уақыты: {new Date(item.submission.submittedAt).toLocaleString('kk-KZ')}
                            </div>
                          )}

                          {item.submission.textAnswer && (
                            <div>
                              <span style={{ color: 'var(--su-text-muted)', fontSize: '12px' }}>Мәтіндік жауап:</span>
                              <div style={{ whiteSpace: 'pre-wrap', marginTop: '2px', color: 'var(--su-text-main)' }}>
                                {item.submission.textAnswer}
                              </div>
                            </div>
                          )}

                          {item.submission.fileUrl && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <span>📎 Тіркелген файл:</span>
                              <a
                                href={getDownloadUrl(item.submission.fileUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--su-primary)', fontWeight: 500 }}
                              >
                                Файлды ашу / Жүктеп алу
                              </a>
                            </div>
                          )}

                          {item.teacherComment && (
                            <div style={{ color: 'var(--su-success)', fontSize: '12px', marginTop: '4px' }}>
                              <strong>Пікір:</strong> {item.teacherComment}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: 'var(--su-text-muted)', fontStyle: 'italic' }}>
                          Тапсырма әлі орындалмаған
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Modal>
        )}

        {/* Grading Sub-Modal */}
        {gradingSubmission && (
          <Modal
            isOpen={Boolean(gradingSubmission)}
            onClose={() => setGradingSubmission(null)}
            maxWidth="480px"
            title={`Бағалау: ${gradingSubmission.studentName}`}
          >
            <form onSubmit={handleSaveGrade} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Балл (0 - {gradingSubmission.maxScore}):
                </label>
                <input
                  type="number"
                  min={0}
                  max={gradingSubmission.maxScore}
                  required
                  value={gradingSubmission.score}
                  onChange={(e) =>
                    setGradingSubmission({
                      ...gradingSubmission,
                      score: Number(e.target.value),
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '15px',
                    fontWeight: 600,
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Оқытушының пікірі (комментарий):
                </label>
                <textarea
                  rows={3}
                  value={gradingSubmission.teacherComment}
                  onChange={(e) =>
                    setGradingSubmission({
                      ...gradingSubmission,
                      teacherComment: e.target.value,
                    })
                  }
                  placeholder="Жақсы орындалған! Немесе түзетулерді жазыңыз..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--su-radius-md)',
                    border: '1px solid var(--su-border)',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <Button variant="secondary" size="md" type="button" onClick={() => setGradingSubmission(null)}>
                  Болдырмау
                </Button>
                <Button variant="success" size="md" type="submit" loading={gradeSaving} icon={<Icon name="check" size={16} />}>
                  Бағалауды сақтау
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </AppShell>
  );
};

export default TeacherAssignmentsPage;
