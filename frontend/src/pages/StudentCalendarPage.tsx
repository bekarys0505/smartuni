import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  CardBody,
  Badge,
  Button,
  Modal,
  ErrorState,
  Skeleton,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { getToken } from '../utils/auth';

interface CalendarEvent {
  id: string;
  type: 'LESSON' | 'ASSIGNMENT_DEADLINE' | 'TEST';
  title: string;
  description: string | null;
  date: string; // YYYY-MM-DD
  startTime: string | null;
  endTime: string | null;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  location?: string | null;
  teacherName?: string | null;
  groupName?: string | null;
  status: string;
  maxScore?: number | null;
  score?: number | null;
  percentage?: number | null;
  meta?: Record<string, any>;
}

interface CalendarResponse {
  message: string;
  from: string;
  to: string;
  events: CalendarEvent[];
}

const KAZAKH_MONTHS = [
  'Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым',
  'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан',
];

const WEEKDAY_NAMES = [
  { short: 'Дс', full: 'Дүйсенбі' },
  { short: 'Сс', full: 'Сейсенбі' },
  { short: 'Ср', full: 'Сәрсенбі' },
  { short: 'Бс', full: 'Бейсенбі' },
  { short: 'Жм', full: 'Жұма' },
  { short: 'Сб', full: 'Сенбі' },
  { short: 'Жс', full: 'Жексенбі' },
];

function formatDateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface CalendarGridDay {
  date: Date;
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export const StudentCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const today = new Date();

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-11
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected event for detail modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const fetchEvents = async (year: number, month: number) => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();

      // Compute range covering 1 week before month and 1 week after
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const fromDate = new Date(firstDay);
      fromDate.setDate(fromDate.getDate() - 7);

      const toDate = new Date(lastDay);
      toDate.setDate(toDate.getDate() + 7);

      const fromStr = formatDateToIso(fromDate);
      const toStr = formatDateToIso(toDate);

      const res = await fetch(`/api/student/calendar?from=${fromStr}&to=${toStr}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Күнтізбе оқиғаларын жүктеу кезінде қате орын алды');
      }

      const data: CalendarResponse = await res.json();
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || 'Сервермен байланыс қатесі');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Build 7-column calendar grid starting on Monday
  const buildCalendarGrid = (): CalendarGridDay[] => {
    const todayIso = formatDateToIso(new Date());
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Monday-based offset: 0 for Monday, 6 for Sunday
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = lastDayOfMonth.getDate();

    const days: CalendarGridDay[] = [];

    // 1. Previous month leading days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(currentYear, currentMonth - 1, dayNum);
      const dStr = formatDateToIso(d);
      days.push({
        date: d,
        dateString: dStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dStr === todayIso,
        events: events.filter((e) => e.date === dStr),
      });
    }

    // 2. Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentYear, currentMonth, i);
      const dStr = formatDateToIso(d);
      days.push({
        date: d,
        dateString: dStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dStr === todayIso,
        events: events.filter((e) => e.date === dStr),
      });
    }

    // 3. Next month trailing days to complete full weeks (rows of 7)
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        const d = new Date(currentYear, currentMonth + 1, i);
        const dStr = formatDateToIso(d);
        days.push({
          date: d,
          dateString: dStr,
          dayNumber: i,
          isCurrentMonth: false,
          isToday: dStr === todayIso,
          events: events.filter((e) => e.date === dStr),
        });
      }
    }

    return days;
  };

  const gridDays = buildCalendarGrid();

  const getEventBadgeStyle = (event: CalendarEvent) => {
    const isCompleted = event.status === 'COMPLETED';

    if (isCompleted) {
      return {
        background: '#ecfdf5',
        border: '1px solid #a7f3d0',
        color: '#047857',
        icon: '✓',
      };
    }

    switch (event.type) {
      case 'LESSON':
        return {
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1d4ed8',
          icon: '📚',
        };
      case 'ASSIGNMENT_DEADLINE':
        return {
          background: '#fffbeb',
          border: '1px solid #fde68a',
          color: '#b45309',
          icon: '📝',
        };
      case 'TEST':
        return {
          background: '#faf5ff',
          border: '1px solid #e9d5ff',
          color: '#7e22ce',
          icon: '⏱️',
        };
      default:
        return {
          background: '#f1f5f9',
          border: '1px solid #cbd5e1',
          color: '#334155',
          icon: '📌',
        };
    }
  };

  return (
    <AppShell userRole="STUDENT">
      <div className="su-content-container">
        <PageHeader
          title="Күнтізбе"
          subtitle="Сабақ кестесі, дедлайндар және тесттердің толық айлық күнтізбесі"
          breadcrumbs={[
            { label: 'Студент', path: '/student/dashboard' },
            { label: 'Күнтізбе' },
          ]}
          actions={
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Button
                variant="outline"
                size="sm"
                icon={<Icon name="book" size={16} />}
                onClick={() => navigate('/student/diary')}
              >
                Күнделікті ашу
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Icon name="clock" size={16} />}
                onClick={() => fetchEvents(currentYear, currentMonth)}
              >
                Жаңарту
              </Button>
            </div>
          }
        />

        {/* Month Navigation & Legend Bar */}
        <Card style={{ marginBottom: '20px' }}>
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
              {/* Navigation buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Button variant="outline" size="sm" onClick={goToPrevMonth} title="Алдыңғы ай">
                  ← Алдыңғы
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Бүгін
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextMonth} title="Келесі ай">
                  Келесі →
                </Button>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: '0 0 0 12px' }}>
                  {KAZAKH_MONTHS[currentMonth]} {currentYear}
                </h2>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#2563eb',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ color: '#475569', fontWeight: 500 }}>Сабақтар</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#d97706',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ color: '#475569', fontWeight: 500 }}>Тапсырма дедлайны</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#7e22ce',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ color: '#475569', fontWeight: 500 }}>Тест</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#16a34a',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ color: '#475569', fontWeight: 500 }}>Аяқталған</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {error && (
          <ErrorState
            title="Күнтізбені жүктеу қатесі"
            message={error}
            onRetry={() => fetchEvents(currentYear, currentMonth)}
          />
        )}

        {loading && events.length === 0 && (
          <Card>
            <CardBody style={{ padding: '32px' }}>
              <Skeleton width="100%" height="450px" />
            </CardBody>
          </Card>
        )}

        {/* 7-Column Calendar Grid */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
            overflow: 'hidden',
          }}
        >
          {/* Weekday Headers (Monday to Sunday) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            {WEEKDAY_NAMES.map((wd, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 8px',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: idx >= 5 ? '#dc2626' : '#475569',
                }}
              >
                <span>{wd.short}</span>
                <span style={{ display: 'none' }}> ({wd.full})</span>
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridAutoRows: 'minmax(120px, auto)',
              gap: '1px',
              background: '#e2e8f0',
            }}
          >
            {gridDays.map((cell, idx) => {
              const maxDisplayEvents = 3;
              const overflowCount = cell.events.length - maxDisplayEvents;

              return (
                <div
                  key={idx}
                  style={{
                    background: cell.isToday
                      ? '#f0f7ff'
                      : cell.isCurrentMonth
                      ? '#ffffff'
                      : '#fafbfc',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: cell.isCurrentMonth ? 1 : 0.45,
                    border: cell.isToday ? '2px solid #3b82f6' : 'none',
                    minHeight: '120px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onClick={() => {
                    navigate(`/student/diary?date=${cell.dateString}`);
                  }}
                >
                  {/* Day Header Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: cell.isToday ? '26px' : 'auto',
                        height: cell.isToday ? '26px' : 'auto',
                        borderRadius: cell.isToday ? '50%' : '0',
                        background: cell.isToday ? '#2563eb' : 'transparent',
                        color: cell.isToday
                          ? '#ffffff'
                          : cell.isCurrentMonth
                          ? '#1e293b'
                          : '#94a3b8',
                        fontWeight: cell.isToday ? 800 : 700,
                        fontSize: '13px',
                      }}
                    >
                      {cell.dayNumber}
                    </span>

                    {cell.events.length > 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#64748b',
                        }}
                      >
                        {cell.events.length}
                      </span>
                    )}
                  </div>

                  {/* Day Events list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    {cell.events.slice(0, maxDisplayEvents).map((event) => {
                      const style = getEventBadgeStyle(event);

                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          style={{
                            background: style.background,
                            border: style.border,
                            color: style.color,
                            borderRadius: '6px',
                            padding: '3px 6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                          }}
                          title={`${event.title} (${event.startTime || ''})`}
                        >
                          <span style={{ fontSize: '10px' }}>{style.icon}</span>
                          {event.startTime && (
                            <span style={{ opacity: 0.85, fontSize: '10px' }}>
                              {event.startTime}
                            </span>
                          )}
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {event.title}
                          </span>
                        </div>
                      );
                    })}

                    {overflowCount > 0 && (
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#2563eb',
                          padding: '2px 4px',
                        }}
                      >
                        +{overflowCount} тағы...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedEvent(null)}
            title={
              selectedEvent.type === 'LESSON'
                ? '📚 Сабақ туралы мәлімет'
                : selectedEvent.type === 'ASSIGNMENT_DEADLINE'
                ? '📝 Тапсырма дедлайны'
                : '⏱️ Тестілеу оқиғасы'
            }
            footer={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate(`/student/diary?date=${selectedEvent.date}`);
                    setSelectedEvent(null);
                  }}
                >
                  Осы күнді күнделіктен ашу 📖
                </Button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedEvent.type === 'LESSON' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        navigate(`/student/subjects/${selectedEvent.subjectId}`);
                        setSelectedEvent(null);
                      }}
                    >
                      Пәнге өту →
                    </Button>
                  )}

                  {selectedEvent.type === 'ASSIGNMENT_DEADLINE' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        navigate('/student/assignments');
                        setSelectedEvent(null);
                      }}
                    >
                      Тапсырманы ашу →
                    </Button>
                  )}

                  {selectedEvent.type === 'TEST' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        navigate('/student/tests');
                        setSelectedEvent(null);
                      }}
                    >
                      Тестке өту →
                    </Button>
                  )}

                  <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>
                    Жабу
                  </Button>
                </div>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                  ПӘН АТАУЫ
                </div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                  {selectedEvent.subjectName}{' '}
                  {selectedEvent.subjectCode && (
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                      ({selectedEvent.subjectCode})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
                  ОҚИҒА АТАУЫ
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#334155' }}>
                  {selectedEvent.title}
                </div>
                {selectedEvent.description && (
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                    {selectedEvent.description}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  background: '#f8fafc',
                  padding: '14px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Күні:</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                    📅 {selectedEvent.date}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Уақыты:</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                    ⏰ {selectedEvent.startTime || 'Көрсетілмеген'}
                    {selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ''}
                  </div>
                </div>

                {selectedEvent.location && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Дәрісхана:</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                      📍 {selectedEvent.location}
                    </div>
                  </div>
                )}

                {selectedEvent.teacherName && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Оқытушы:</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                      👨‍🏫 {selectedEvent.teacherName}
                    </div>
                  </div>
                )}

                {selectedEvent.groupName && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Оқу тобы:</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                      👥 {selectedEvent.groupName}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Мәртебесі:</div>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>
                    {selectedEvent.status === 'COMPLETED' ? (
                      <Badge variant="success">Аяқталды</Badge>
                    ) : selectedEvent.status === 'SUBMITTED' ? (
                      <Badge variant="primary">Жіберілді</Badge>
                    ) : selectedEvent.status === 'PAST_DUE' ? (
                      <Badge variant="danger">Мерзімі өткен</Badge>
                    ) : (
                      <Badge variant="secondary">{selectedEvent.status}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedEvent.score !== null && selectedEvent.score !== undefined && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>
                    Жиналған нәтиже:
                  </span>
                  <strong style={{ fontSize: '16px', color: '#15803d' }}>
                    {selectedEvent.score} {selectedEvent.maxScore ? `/ ${selectedEvent.maxScore}` : ''}
                    {selectedEvent.percentage !== null && selectedEvent.percentage !== undefined
                      ? ` (${selectedEvent.percentage}%)`
                      : ''}
                  </strong>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  );
};
