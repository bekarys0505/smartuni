import { getUser } from '../utils/auth';
import { AppShell } from '../components/layout/AppShell';
import { PageHeader, Card, CardBody, Badge, StatCard } from '../components/ui';
import { Icon } from '../components/ui/Icon';

export default function AdminDashboardPlaceholder() {
  const user = getUser();

  return (
    <AppShell userRole="ADMIN">
      <PageHeader
        title={`Сәлем, ${user?.fullName || 'Әкімші'}!`}
        subtitle="SmartUni платформасының орталықтандырылған әкімшілік және басқару кеңістігі."
        breadcrumbs={[{ label: 'Әкімші' }, { label: 'Басты панель' }]}
        badge={
          <Badge variant="primary" size="md">
            ADMIN CONTROL · PHASE 1 & 3
          </Badge>
        }
      />

      {/* Quick stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        <StatCard
          label="Жүйелік статус"
          value="Тұрақты"
          hint="Барлық қызметтер қалыпты жұмыс істеуде"
          icon={<Icon name="shield" size={20} />}
        />
        <StatCard
          label="Рөлдік саясат"
          value="RBAC ACTIVE"
          hint="STUDENT / TEACHER / ADMIN"
          icon={<Icon name="users" size={20} />}
        />
        <StatCard
          label="Университеттер"
          value="SmartUni"
          hint="Орталық академиялық база"
          icon={<Icon name="layers" size={20} />}
        />
      </div>

      <Card padding="lg">
        <CardBody>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '20px',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                backgroundColor: 'var(--su-primary-light)',
                color: 'var(--su-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="settings" size={28} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--su-primary)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                6-КЕЗЕҢ ДАЙЫНДЫҒЫ
              </span>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--su-text-main)',
                  margin: '6px 0 10px 0',
                }}
              >
                Әкімші толық аналитикалық панелі алдағы кезеңде қосылады
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--su-text-muted)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                SmartUni foundation аясында әкімші рөлі (ADMIN) және жаңа App Shell
                интерфейстік құрылымы сәтті біріктірілді. Пайдаланушыларды жаппай
                басқару, университет құрылымын өзгерту және аудиторлық журналдар
                жобаның 6-кезеңінде толық көлемде ұсынылады.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </AppShell>
  );
}
