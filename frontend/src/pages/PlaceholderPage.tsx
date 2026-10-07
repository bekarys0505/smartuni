import React from 'react';
import { PageHeader, Card, CardBody, Badge } from '../components/ui';
import { Icon } from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  phaseNumber?: number;
  icon?: IconName;
  description?: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  subtitle,
  phaseNumber = 3,
  icon = 'sparkles',
  description,
  breadcrumbs,
}) => {
  return (
    <div className="su-placeholder-page">
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={breadcrumbs}
        badge={
          <Badge variant="primary" size="md">
            Дайындық кезеңі · {phaseNumber}-кезең
          </Badge>
        }
      />

      <Card padding="lg" style={{ marginTop: '20px' }}>
        <CardBody>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '40px 20px',
              maxWidth: '560px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: 'var(--su-primary-light)',
                color: 'var(--su-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Icon name={icon} size={32} />
            </div>

            <h2
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--su-text-main)',
                marginBottom: '10px',
              }}
            >
              {title} модулі жақында қолжетімді болады
            </h2>

            <p
              style={{
                fontSize: '14px',
                color: 'var(--su-text-muted)',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}
            >
              {description ||
                'SmartUni академиялық экожүйесінің бұл бөлімі алдағы жоспарлы даму кезеңінде толыққанды іске қосылады. Қазіргі уақытта маршруттау мен интерфейс құрылымы дайындалды.'}
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'var(--su-bg-muted)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--su-text-body)',
              }}
            >
              <Icon name="info" size={16} />
              <span>SmartUni Foundation UI/UX Ready</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
