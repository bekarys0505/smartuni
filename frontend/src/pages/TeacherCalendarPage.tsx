import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
} from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { api } from '../utils/api';

interface CalendarScheduleItem {
  id: string;
  name: string;
  course: number;
  semester: number;
  academicYear: string;
  lessonDay: string;
  lessonTime: string;
  classroom: string;
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
}

const DAYS_OF_WEEK = [
  'Дүйсенбі',
  'Сейсенбі',
  'Сәрсенбі',
  'Бейсенбі',
  'Жұма',
  'Сенбі',
];

export const TeacherCalendarPage: React.FC = () => {
  const [schedule, setSchedule] = useState<CalendarScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDay, setSelectedDay] = useState<string>('ALL');

  const fetchCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ calendar?: CalendarScheduleItem[]; schedule?: CalendarScheduleItem[] }>('/api/teacher/calendar');
      setSchedule(data.calendar || data.schedule || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Күнтізбені жүктеу кезінде қате орын алды';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const filteredSchedule = schedule.filter((item) => {
    if (selectedDay !== 'ALL' && item.lessonDay !== selectedDay) return false;
    return true;
  });

  return (
    <AppShell userRole="TEACHER">
      <div className="su-page-container">
        <PageHeader
          title="Оқытушы күнтізбесі мен кестесі"
          subtitle="Апталық оқу кестесі, дәрістер, зертханалар және аудиториялар"
          breadcrumbs={[{ label: 'Оқытушы', path: '/teacher/dashboard' }, { label: 'Күнтізбе' }]}
          actions={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="outline" size="sm" onClick={fetchCalendar} loading={loading}>
                <Icon name="refresh" size={16} /> Жаңарту
              </Button>
              <Button variant="primary" size="sm" onClick={handlePrint}>
                <Icon name="calendar" size={16} /> Кестені басып шығару (PDF)
              </Button>
            </div>
          }
        />

        {/* Day Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <Button
            variant={selectedDay === 'ALL' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedDay('ALL')}
          >
            Барлық күндер
          </Button>
          {DAYS_OF_WEEK.map((day) => (
            <Button
              key={day}
              variant={selectedDay === day ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedDay(day)}
            >
              {day}
            </Button>
          ))}
        </div>

        {/* Content View */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <Card key={i} padding="md">
                <Skeleton height={24} width="60%" />
                <div style={{ margin: '0.5rem 0' }}>
                  <Skeleton height={18} width="40%" />
                </div>
                <Skeleton height={50} />
              </Card>
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCalendar} />
        ) : filteredSchedule.length === 0 ? (
          <EmptyState
            title="Сабақ кестесі табылмады"
            description="Бұл күнге немесе семестрге бекітілген сабақтар кестесі әзірге жоқ."
            icon="calendar"
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {filteredSchedule.map((item) => (
              <Card key={item.id} padding="md" hoverable>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <Badge variant="primary" size="sm">
                    {item.lessonDay}
                  </Badge>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb' }}>
                    ⏰ {item.lessonTime}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                  {item.subject.name}
                </h3>

                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div><strong>Оқу тобы:</strong> {item.name}</div>
                  <div><strong>Курс / Семестр:</strong> {item.course}-курс, {item.semester}-семестр</div>
                  <div><strong>Аудитория:</strong> 📍 {item.classroom}</div>
                  <div><strong>Оқу жылы:</strong> {item.academicYear}</div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/teacher/groups/${item.id}`}
                  >
                    Топ журналына өту →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default TeacherCalendarPage;

