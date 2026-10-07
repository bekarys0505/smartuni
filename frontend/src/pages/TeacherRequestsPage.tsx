import { useEffect, useState, useCallback } from 'react';
import { getToken } from '../utils/auth';
import { AppShell } from '../components/layout/AppShell';
import '../styles/TeacherDashboard.css';
import '../styles/TeacherRequests.css';

interface JoinRequestItem {
  id: string;
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
  group: {
    id: string;
    name: string;
    subject: {
      id: string;
      name: string;
      code: string | null;
    };
  };
}

interface ActionFeedback {
  type: 'success' | 'error';
  message: string;
}

export default function TeacherRequestsPage() {
  const [requests, setRequests] = useState<JoinRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ID of the request currently being processed (accepted or rejected)
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingType, setProcessingType] = useState<'accept' | 'reject' | null>(null);

  // ID of the request for which confirmation to reject is currently open
  const [confirmingRejectId, setConfirmingRejectId] = useState<string | null>(null);

  // Success or error feedback message banner
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);

  const loadRequests = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setError('Авторизация қажет. Алдымен жүйеге кіріңіз.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/teacher/join-requests`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Өтініштерді жүктеу сәтсіз аяқталды');
      }

      setRequests(data.requests || []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Өтініштерді жүктеу кезінде белгісіз қате орын алды');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Handle Accept Action
  async function handleAccept(request: JoinRequestItem) {
    const token = getToken();
    if (!token) {
      setFeedback({
        type: 'error',
        message: 'Сессия аяқталды. Қайта жүйеге кіріңіз.',
      });
      return;
    }

    setProcessingId(request.id);
    setProcessingType('accept');
    setConfirmingRejectId(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/teacher/join-requests/${request.id}/accept`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Өтінішті қабылдау сәтсіз аяқталды');
      }

      // Remove the accepted request from the pending list
      setRequests((prev) => prev.filter((r) => r.id !== request.id));

      setFeedback({
        type: 'success',
        message: `${request.student.fullName} студентінің «${request.group.name}» тобына өтініші сәтті қабылданды!`,
      });
    } catch (err) {
      if (err instanceof Error) {
        setFeedback({ type: 'error', message: err.message });
      } else {
        setFeedback({
          type: 'error',
          message: 'Өтінішті қабылдау кезінде қате туындады',
        });
      }
    } finally {
      setProcessingId(null);
      setProcessingType(null);
    }
  }

  // Handle Reject Action
  async function handleReject(request: JoinRequestItem) {
    const token = getToken();
    if (!token) {
      setFeedback({
        type: 'error',
        message: 'Сессия аяқталды. Қайта жүйеге кіріңіз.',
      });
      return;
    }

    setProcessingId(request.id);
    setProcessingType('reject');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/teacher/join-requests/${request.id}/reject`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Өтінішті қабылдамау сәтсіз аяқталды');
      }

      // Remove the rejected request from the pending list
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      setConfirmingRejectId(null);

      setFeedback({
        type: 'success',
        message: `${request.student.fullName} студентінің өтініші қабылданбады.`,
      });
    } catch (err) {
      if (err instanceof Error) {
        setFeedback({ type: 'error', message: err.message });
      } else {
        setFeedback({
          type: 'error',
          message: 'Өтінішті қабылдамау кезінде қате туындады',
        });
      }
    } finally {
      setProcessingId(null);
      setProcessingType(null);
    }
  }

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const pendingCount = pendingRequests.length;

  return (
    <AppShell userRole="TEACHER">
      <div className="teacher-dashboard-embedded">
          {/* Header section */}
          <div className="requests-page-header">
            <div className="requests-title-row">
              <div>
                <div className="teacher-badge">
                  <span>📩</span>
                  <span>Топқа қосылу өтініштері</span>
                </div>
                <h1>Студенттердің өтініштері</h1>
                <p className="requests-subtitle">
                  Студенттерден түскен топқа қосылу өтініштерін қарап, қабылдаңыз
                  немесе қабылдамаңыз.
                </p>
              </div>

              <div
                className={`requests-counter-badge ${
                  pendingCount > 0 ? 'has-pending' : ''
                }`}
              >
                <span>Күтудегі өтініштер:</span>
                <span className="counter-number">{pendingCount}</span>
              </div>
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`feedback-banner ${feedback.type}`}
              role="alert"
            >
              <div className="feedback-banner-content">
                <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
                <span>{feedback.message}</span>
              </div>
              <button
                type="button"
                className="feedback-close-btn"
                onClick={() => setFeedback(null)}
                aria-label="Жабу"
              >
                ✕
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="dashboard-loading">
              <div className="dashboard-loading-card">
                <div className="loading-spinner" />
                <h2>Өтініштер жүктелуде...</h2>
                <p>Студенттерден түскен өтініштер тізімі алынуда</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="dashboard-error">
              <div className="dashboard-error-card">
                <div className="error-icon">!</div>
                <h2>Қате орын алды</h2>
                <p>{error}</p>
                <button
                  type="button"
                  className="retry-button"
                  onClick={loadRequests}
                >
                  🔄 Қайта көру
                </button>
              </div>
            </div>
          )}

          {/* Content: List or Empty */}
          {!loading && !error && (
            <>
              {pendingCount === 0 ? (
                <div className="requests-empty">
                  <div className="requests-empty-icon">📭</div>
                  <h3>Күтудегі өтініштер жоқ</h3>
                  <p>
                    Барлық өтініштер өңделді немесе әзірге жаңа өтініштер түспеді.
                  </p>
                </div>
              ) : (
                <div className="requests-list">
                  {pendingRequests.map((request) => {
                    const studentInitials =
                      request.student.fullName.charAt(0).toUpperCase() || 'S';
                    const isProcessing = processingId === request.id;
                    const isConfirmingReject =
                      confirmingRejectId === request.id;

                    const formattedDate = new Date(
                      request.createdAt,
                    ).toLocaleDateString('kk-KZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <article key={request.id} className="request-card">
                        {/* Top info */}
                        <div className="request-card-top">
                          <div className="request-student-header">
                            <div className="student-avatar">
                              {studentInitials}
                            </div>
                            <div className="student-name-box">
                              <h3>{request.student.fullName}</h3>
                              <div className="student-target-group">
                                <span>Топқа өтініш:</span>
                                <strong className="group-name-highlight">
                                  {request.group.name}
                                </strong>
                                <span>•</span>
                                <span>{request.group.subject.name}</span>
                              </div>
                            </div>
                          </div>

                          <div className="request-meta-top">
                            <span className="course-badge">
                              {request.student.course}-курс
                            </span>
                            <span className="status-badge pending">
                              {request.status === 'PENDING'
                                ? 'Күтуде'
                                : request.status}
                            </span>
                          </div>
                        </div>

                        {/* Detailed grid */}
                        <div className="request-info-grid">
                          <div className="info-item">
                            <span className="info-item-label">Университет</span>
                            <span className="info-item-value">
                              {request.student.university}
                            </span>
                          </div>

                          <div className="info-item">
                            <span className="info-item-label">Факультет</span>
                            <span className="info-item-value">
                              {request.student.faculty}
                            </span>
                          </div>

                          <div className="info-item">
                            <span className="info-item-label">Мамандық</span>
                            <span className="info-item-value">
                              {request.student.major}
                            </span>
                          </div>

                          <div className="info-item">
                            <span className="info-item-label">Email</span>
                            <span className="info-item-value">
                              {request.student.email}
                            </span>
                          </div>

                          {request.student.phone && (
                            <div className="info-item">
                              <span className="info-item-label">Телефон</span>
                              <span className="info-item-value">
                                {request.student.phone}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Footer & Actions */}
                        <div className="request-card-footer">
                          <div className="request-time-info">
                            <span>🕒</span>
                            <span>Жіберілді: {formattedDate}</span>
                          </div>

                          {request.status === 'PENDING' && (
                            <div className="request-actions-row">
                              <button
                                type="button"
                                className="btn-action btn-accept"
                                onClick={() => handleAccept(request)}
                                disabled={isProcessing}
                              >
                                {isProcessing && processingType === 'accept' ? (
                                  <>
                                    <span className="btn-spinner" />
                                    <span>Қабылдануда...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>✓</span>
                                    <span>Қабылдау</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                className="btn-action btn-reject"
                                onClick={() => {
                                  if (isConfirmingReject) {
                                    setConfirmingRejectId(null);
                                  } else {
                                    setConfirmingRejectId(request.id);
                                  }
                                }}
                                disabled={isProcessing}
                              >
                                <span>✕</span>
                                <span>Қабылдамау</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Reject confirmation UI */}
                        {isConfirmingReject && (
                          <div className="reject-confirm-box">
                            <div className="reject-confirm-text">
                              <span>⚠️</span>
                              <span>
                                Бұл өтінішті қабылдамайсыз ба? Студент топқа қосылмайды.
                              </span>
                            </div>
                            <div className="reject-confirm-actions">
                              <button
                                type="button"
                                className="btn-confirm-reject"
                                onClick={() => handleReject(request)}
                                disabled={isProcessing}
                              >
                                {isProcessing && processingType === 'reject' ? (
                                  <>
                                    <span className="btn-spinner" />
                                    <span>Қабылданбауда...</span>
                                  </>
                                ) : (
                                  'Иә, қабылдамау'
                                )}
                              </button>
                              <button
                                type="button"
                                className="btn-cancel-reject"
                                onClick={() => setConfirmingRejectId(null)}
                                disabled={isProcessing}
                              >
                                Болдырмау
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
    </AppShell>
  );
}
