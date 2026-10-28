import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  CardBody,
  Badge,
  Button,
  Modal,
  Tabs,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { getToken } from '../utils/auth';
import { api, getDownloadUrl } from '../utils/api';

type AssignmentResponseType = 'TEXT' | 'FILE' | 'TEXT_AND_FILE';
type AssignmentSubmissionStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED' | 'LATE';

interface AssignmentItem {
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
  teacher: {
    id: string;
    fullName: string;
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
  isLate: boolean;
}

export const StudentAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'SUBMITTED'>('ALL');

  // Detail / Submit Modal
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);

    const token = getToken();
    if (!token) {
      setError('Авторизация қажет. Қайта кіріңіз.');
      setLoading(false);
      return;
    }

    try {
      const data = await api.get<{ assignments: AssignmentItem[] }>('/api/student/assignments');
      setAssignments(data.assignments || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Белгісіз қателік';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const openDetailModal = (assignment: AssignmentItem) => {
    setSelectedAssignment(assignment);
    setTextAnswer(assignment.submission?.textAnswer || '');
    setFileUrl(assignment.submission?.fileUrl || null);
    setFileName(assignment.submission?.fileUrl ? assignment.submission.fileUrl.split('/').pop() || 'Құжат' : null);
    setSelectedFile(null);
    setSubmitSuccess(null);
    setSubmitError(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Check size <= 10MB
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('Файл көлемі 10 МБ-тан аспауы қажет.');
      return;
    }

    // Check extension
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      setSubmitError('Тек PDF, DOC, DOCX, JPG, PNG форматтарына рұқсат етіледі.');
      return;
    }

    setSelectedFile(file);
    setSubmitError(null);

    // Upload file
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const resData = await api.upload<{ url: string }>('/api/upload', {
            fileName: file.name,
            fileBase64: base64,
            fileSize: file.size,
          });

          setFileUrl(resData.url);
          setFileName(file.name);
          setUploading(false);
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : 'Файлды жүктеу мүмкін болмады';
          setSubmitError(msg);
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Файл қатесі';
      setSubmitError(msg);
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    const token = getToken();
    if (!token) {
      setSubmitError('Авторизация токені жоқ.');
      setSubmitting(false);
      return;
    }

    try {
      const resData = await api.post<{
        message?: string;
        submission: {
          id: string;
          textAnswer: string | null;
          fileUrl: string | null;
          status: AssignmentSubmissionStatus;
          submittedAt: string | null;
          score: number | null;
          teacherComment: string | null;
        };
      }>(`/api/student/assignments/${selectedAssignment.id}/submit`, {
        textAnswer: textAnswer.trim() || undefined,
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
      });

      setSubmitSuccess(resData.message || 'Жауабыңыз сәтті жіберілді!');

      // Update state
      setAssignments((prev) =>
        prev.map((item) => {
          if (item.id === selectedAssignment.id) {
            return {
              ...item,
              submission: {
                id: resData.submission.id,
                textAnswer: resData.submission.textAnswer,
                fileUrl: resData.submission.fileUrl,
                status: resData.submission.status,
                submittedAt: resData.submission.submittedAt,
                score: null,
                teacherComment: null,
                gradedAt: null,
              },
              status: resData.submission.status,
              score: null,
              teacherComment: null,
            };
          }
          return item;
        }),
      );

      setSelectedAssignment((prev) =>
        prev
          ? {
              ...prev,
              submission: {
                id: resData.submission.id,
                textAnswer: resData.submission.textAnswer,
                fileUrl: resData.submission.fileUrl,
                status: resData.submission.status,
                submittedAt: resData.submission.submittedAt,
                score: null,
                teacherComment: null,
                gradedAt: null,
              },
              status: resData.submission.status,
              score: null,
              teacherComment: null,
            }
          : null,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Қате кетті';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDeadline = (deadlineStr: string | null, allowLate: boolean) => {
    if (!deadlineStr) return { text: 'Мерзімі шектелмеген', variant: 'neutral' as const };
    const dl = new Date(deadlineStr);
    const now = new Date();
    const diffMs = dl.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      return allowLate
        ? { text: 'Мерзімі өтіп кетті (Кеш тапсыруға болады)', variant: 'warning' as const }
        : { text: 'Мерзімі өтіп кетті (Қабылданбайды)', variant: 'danger' as const };
    }

    if (diffDays <= 1) {
      return { text: 'Мерзімі: Бүгін аяқталады!', variant: 'danger' as const };
    }
    if (diffDays <= 3) {
      return { text: `Мерзімі: ${diffDays} күн қалды`, variant: 'warning' as const };
    }

    return {
      text: `Мерзімі: ${dl.toLocaleDateString('kk-KZ', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      variant: 'neutral' as const,
    };
  };

  const getStatusBadge = (status: AssignmentSubmissionStatus, score: number | null, maxScore: number) => {
    switch (status) {
      case 'GRADED':
        return (
          <Badge variant="success" size="sm">
            Бағаланды: {score} / {maxScore}
          </Badge>
        );
      case 'SUBMITTED':
        return (
          <Badge variant="primary" size="sm">
            Жіберілді
          </Badge>
        );
      case 'LATE':
        return (
          <Badge variant="warning" size="sm">
            Кеш тапсырылды
          </Badge>
        );
      case 'NOT_SUBMITTED':
      default:
        return (
          <Badge variant="neutral" size="sm">
            Тапсырма жіберілмеген
          </Badge>
        );
    }
  };

  // Filtered assignments
  const filteredAssignments = assignments.filter((a) => {
    if (activeTab === 'PENDING') return a.status === 'NOT_SUBMITTED';
    if (activeTab === 'SUBMITTED') return a.status !== 'NOT_SUBMITTED';
    return true;
  });

  return (
    <AppShell userRole="STUDENT">
      <div className="su-assignments-page-container">
        <PageHeader
          title="Тапсырмалар"
          subtitle="Оқу пәндері бойынша практикалық жұмыстар, есептер және бағалау нәтижелері"
          breadcrumbs={[
            { label: 'Басты бет', path: '/student/dashboard' },
            { label: 'Тапсырмалар' },
          ]}
          badge={
            !loading && assignments.length > 0 ? (
              <Badge variant="primary" size="md">
                Барлығы: {assignments.length} тапсырма
              </Badge>
            ) : null
          }
        />

        {/* Filter Tabs */}
        {!loading && !error && assignments.length > 0 && (
          <Tabs
            items={[
              { key: 'ALL', label: 'Барлық тапсырмалар', count: assignments.length },
              {
                key: 'PENDING',
                label: 'Тапсырылмаған',
                count: assignments.filter((a) => a.status === 'NOT_SUBMITTED').length,
              },
              {
                key: 'SUBMITTED',
                label: 'Жіберілген / Бағаланған',
                count: assignments.filter((a) => a.status !== 'NOT_SUBMITTED').length,
              },
            ]}
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as any)}
          />
        )}

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
            onRetry={fetchAssignments}
          />
        )}

        {!loading && !error && assignments.length === 0 && (
          <EmptyState
            title="Тапсырмалар табылмады"
            description="Сіздің оқу топтарыңызға әлі практикалық тапсырмалар тағайындалмаған."
            icon={<Icon name="file-text" size={48} />}
          />
        )}

        {!loading && !error && assignments.length > 0 && filteredAssignments.length === 0 && (
          <EmptyState
            title="Бұл санатта тапсырмалар жоқ"
            description="Таңдалған сүзгі бойынша тапсырмалар табылмады."
            icon={<Icon name="file-text" size={40} />}
          />
        )}

        {!loading && !error && filteredAssignments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredAssignments.map((assignment) => {
              const dlInfo = formatDeadline(assignment.deadline, assignment.allowLate);

              return (
                <Card
                  key={assignment.id}
                  padding="md"
                  hoverable
                  style={{
                    border: '1px solid var(--su-border)',
                    cursor: 'pointer',
                  }}
                  onClick={() => openDetailModal(assignment)}
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
                    <div style={{ flex: '1 1 340px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Badge variant="primary" size="sm">
                          {assignment.subject.code || assignment.subject.name}
                        </Badge>
                        <span style={{ fontSize: '12px', color: 'var(--su-text-muted)' }}>
                          • {assignment.topic.title}
                        </span>
                        {getStatusBadge(assignment.status, assignment.score, assignment.maxScore)}
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
                        }}
                      >
                        <span>
                          Максималды балл: <strong>{assignment.maxScore}</strong>
                        </span>
                        <span style={{ color: dlInfo.variant === 'danger' ? 'var(--su-error)' : dlInfo.variant === 'warning' ? 'var(--su-warning)' : 'inherit' }}>
                          <Icon name="clock" size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                          {dlInfo.text}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                      <Button
                        variant={assignment.status === 'NOT_SUBMITTED' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailModal(assignment);
                        }}
                        icon={<Icon name="chevron-right" size={14} />}
                        iconPosition="right"
                      >
                        {assignment.status === 'NOT_SUBMITTED'
                          ? 'Орындау'
                          : assignment.status === 'GRADED'
                          ? 'Нәтижені көру'
                          : 'Жауапты қарау'}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        {/* Assignment Detail & Submission Modal */}
        {selectedAssignment && (
          <Modal
            isOpen={Boolean(selectedAssignment)}
            onClose={() => setSelectedAssignment(null)}
            maxWidth="680px"
            title={selectedAssignment.title}
            footer={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <Button variant="secondary" size="sm" onClick={() => setSelectedAssignment(null)}>
                  Жабу
                </Button>

                {(!selectedAssignment.deadline ||
                  new Date() <= new Date(selectedAssignment.deadline) ||
                  selectedAssignment.allowLate) && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={submitting || uploading}
                    onClick={handleSubmit}
                    icon={<Icon name="check" size={16} />}
                  >
                    {selectedAssignment.status === 'NOT_SUBMITTED' ? 'Жіберу' : 'Қайта жіберу'}
                  </Button>
                )}
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Meta Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Badge variant="primary" size="sm">
                  {selectedAssignment.subject.name}
                </Badge>
                <Badge variant="neutral" size="sm">
                  {selectedAssignment.topic.title}
                </Badge>
                {getStatusBadge(selectedAssignment.status, selectedAssignment.score, selectedAssignment.maxScore)}
              </div>

              {/* Deadline & Max Score Box */}
              <div
                style={{
                  background: 'var(--su-bg-muted)',
                  borderRadius: 'var(--su-radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--su-text-muted)' }}>Мерзімі (Deadline): </span>
                  <strong>
                    {selectedAssignment.deadline
                      ? new Date(selectedAssignment.deadline).toLocaleString('kk-KZ')
                      : 'Шектелмеген'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--su-text-muted)' }}>Максималды балл: </span>
                  <strong style={{ color: 'var(--su-primary)' }}>{selectedAssignment.maxScore}</strong>
                </div>
              </div>

              {/* Description */}
              {selectedAssignment.description && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--su-text-main)' }}>
                    Тапсырма шарты:
                  </h4>
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'var(--su-text-body)',
                      lineHeight: 1.6,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selectedAssignment.description}
                  </p>
                </div>
              )}

              {/* Teacher Attachment if present */}
              {selectedAssignment.attachmentUrl && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'var(--su-primary-subtle)',
                    borderRadius: 'var(--su-radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '13px', color: 'var(--su-text-main)' }}>
                    📎 Оқытушы тіркеген материал
                  </span>
                  <a
                    href={getDownloadUrl(selectedAssignment.attachmentUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="outline" size="sm" icon={<Icon name="download" size={14} />}>
                      Жүктеп алу
                    </Button>
                  </a>
                </div>
              )}

              {/* Teacher Feedback if Graded */}
              {selectedAssignment.status === 'GRADED' && (
                <div
                  style={{
                    background: 'rgba(46, 125, 50, 0.08)',
                    border: '1px solid rgba(46, 125, 50, 0.25)',
                    borderRadius: 'var(--su-radius-md)',
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Icon name="check-circle" size={18} style={{ color: 'var(--su-success)' }} />
                    <strong style={{ color: 'var(--su-success)', fontSize: '15px' }}>
                      Бағаланды: {selectedAssignment.score} / {selectedAssignment.maxScore}
                    </strong>
                  </div>
                  {selectedAssignment.teacherComment && (
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--su-text-main)' }}>
                      <strong>Оқытушы пікірі:</strong> {selectedAssignment.teacherComment}
                    </p>
                  )}
                </div>
              )}

              {/* Status Alert Messages */}
              {submitSuccess && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(46, 125, 50, 0.1)',
                    color: 'var(--su-success)',
                    borderRadius: 'var(--su-radius-md)',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  ✓ {submitSuccess}
                </div>
              )}

              {submitError && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(211, 47, 47, 0.1)',
                    color: 'var(--su-error)',
                    borderRadius: 'var(--su-radius-md)',
                    fontSize: '13px',
                    fontWeight: 500,
                  }}
                >
                  ⚠️ {submitError}
                </div>
              )}

              {/* Submission Form */}
              <div
                style={{
                  borderTop: '1px solid var(--su-border-light)',
                  paddingTop: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--su-text-main)' }}>
                  Сіздің жауабыңыз:
                </h4>

                {(selectedAssignment.responseType === 'TEXT' ||
                  selectedAssignment.responseType === 'TEXT_AND_FILE') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--su-text-muted)', marginBottom: '4px' }}>
                      Мәтіндік жауап:
                    </label>
                    <textarea
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="Тапсырма жауабын осында жазыңыз немесе кодты енгізіңіз..."
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 'var(--su-radius-md)',
                        border: '1px solid var(--su-border)',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                )}

                {(selectedAssignment.responseType === 'FILE' ||
                  selectedAssignment.responseType === 'TEXT_AND_FILE') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--su-text-muted)', marginBottom: '6px' }}>
                      Файлды тіркеу (PDF, DOC, DOCX, JPG, PNG — 10 МБ дейін):
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        style={{ fontSize: '13px' }}
                      />
                      {uploading && <span style={{ fontSize: '12px', color: 'var(--su-primary)' }}>Жүктелуде...</span>}
                    </div>

                    {fileUrl && (
                      <div
                        style={{
                          marginTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          color: 'var(--su-success)',
                        }}
                      >
                        <Icon name="check" size={14} /> Тіркелген файл: <strong>{fileName}</strong>
                        <a
                          href={getDownloadUrl(fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--su-primary)', marginLeft: '6px' }}
                        >
                          (көру)
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
};

export default StudentAssignmentsPage;
