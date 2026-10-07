import React from 'react';
import './ui.css';

// ----------------------------------------------------------------------
// Button Component
// ----------------------------------------------------------------------
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`su-btn su-btn--${variant} su-btn--${size} ${loading ? 'su-btn--loading' : ''} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="su-spinner" aria-hidden="true" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="su-btn-icon">{icon}</span>}
          {children && <span className="su-btn-label">{children}</span>}
          {icon && iconPosition === 'right' && <span className="su-btn-icon">{icon}</span>}
        </>
      )}
    </button>
  );
};

// ----------------------------------------------------------------------
// Card Component
// ----------------------------------------------------------------------
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  padding = 'md',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`su-card su-card--pad-${padding} ${hoverable ? 'su-card--hoverable' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => <div className={`su-card-header ${className}`.trim()} {...props}>{children}</div>;

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => <h3 className={`su-card-title ${className}`.trim()} {...props}>{children}</h3>;

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => <p className={`su-card-description ${className}`.trim()} {...props}>{children}</p>;

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => <div className={`su-card-body ${className}`.trim()} {...props}>{children}</div>;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => <div className={`su-card-footer ${className}`.trim()} {...props}>{children}</div>;

// ----------------------------------------------------------------------
// Badge Component
// ----------------------------------------------------------------------
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <span className={`su-badge su-badge--${variant} su-badge--${size} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
};

// ----------------------------------------------------------------------
// Avatar Component
// ----------------------------------------------------------------------
export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy';
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  status,
  className = '',
  ...props
}) => {
  const initial = (name || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className={`su-avatar su-avatar--${size} ${className}`.trim()} {...props}>
      {src ? (
        <img src={src} alt={name} className="su-avatar-img" />
      ) : (
        <span className="su-avatar-fallback">{initial}</span>
      )}
      {status && <span className={`su-avatar-status su-avatar-status--${status}`} />}
    </div>
  );
};

// ----------------------------------------------------------------------
// StatCard Component
// ----------------------------------------------------------------------
export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  hint?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  hint,
  trend,
  className = '',
}) => {
  return (
    <div className={`su-stat-card ${className}`.trim()}>
      <div className="su-stat-header">
        <span className="su-stat-label">{label}</span>
        {icon && <div className="su-stat-icon-wrapper">{icon}</div>}
      </div>
      <div className="su-stat-value">{value}</div>
      {(hint || trend) && (
        <div className="su-stat-footer">
          {trend && (
            <span className={`su-stat-trend ${trend.positive ? 'positive' : 'negative'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {hint && <span className="su-stat-hint">{hint}</span>}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// PageHeader Component
// ----------------------------------------------------------------------
export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  badge,
  className = '',
}) => {
  return (
    <div className={`su-page-header ${className}`.trim()}>
      <div className="su-page-header-content">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="su-breadcrumb">
            <ol>
              {breadcrumbs.map((crumb, idx) => (
                <li key={idx} className="su-breadcrumb-item">
                  {crumb.path ? (
                    <a href={crumb.path} className="su-breadcrumb-link">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="su-breadcrumb-current">{crumb.label}</span>
                  )}
                  {idx < breadcrumbs.length - 1 && (
                    <span className="su-breadcrumb-separator" aria-hidden="true">
                      /
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="su-page-title-row">
          <div className="su-page-title-group">
            <h1 className="su-page-title">{title}</h1>
            {badge && <div className="su-page-badge">{badge}</div>}
          </div>
          {actions && <div className="su-page-actions">{actions}</div>}
        </div>

        {subtitle && <p className="su-page-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// ProgressBar Component
// ----------------------------------------------------------------------
export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showPercent?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercent = false,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  const percent = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  return (
    <div className={`su-progress-container ${className}`.trim()}>
      {(label || showPercent) && (
        <div className="su-progress-meta">
          {label && <span className="su-progress-label">{label}</span>}
          {showPercent && <span className="su-progress-percent">{percent}%</span>}
        </div>
      )}
      <div className={`su-progress-track su-progress--${size}`}>
        <div
          className={`su-progress-bar su-progress-bar--${variant}`}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Tabs Component
// ----------------------------------------------------------------------
export interface TabItem {
  key: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeKey,
  onChange,
  className = '',
}) => {
  return (
    <div className={`su-tabs ${className}`.trim()}>
      {items.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            className={`su-tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.icon && <span className="su-tab-icon">{tab.icon}</span>}
            <span className="su-tab-label">{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className={`su-tab-count ${isActive ? 'active' : ''}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ----------------------------------------------------------------------
// Modal Component
// ----------------------------------------------------------------------
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '520px',
}) => {
  if (!isOpen) return null;

  return (
    <div className="su-modal-backdrop" onClick={onClose}>
      <div
        className="su-modal-dialog"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="su-modal-header">
          {title && <h3 className="su-modal-title">{title}</h3>}
          <button
            type="button"
            className="su-modal-close-btn"
            onClick={onClose}
            aria-label="Жабу"
          >
            ×
          </button>
        </div>
        <div className="su-modal-body">{children}</div>
        {footer && <div className="su-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// States (Empty, Loading Skeleton, Error)
// ----------------------------------------------------------------------
export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`su-empty-state ${className}`.trim()}>
      <div className="su-empty-icon">{icon || '📂'}</div>
      <h3 className="su-empty-title">{title}</h3>
      {description && <p className="su-empty-description">{description}</p>}
      {action && <div className="su-empty-action">{action}</div>}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Қате орын алды',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`su-error-state ${className}`.trim()}>
      <div className="su-error-icon">⚠️</div>
      <h3 className="su-error-title">{title}</h3>
      <p className="su-error-message">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Қайта жүктеу
        </Button>
      )}
    </div>
  );
};

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '18px',
  borderRadius = '6px',
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`su-skeleton ${className}`.trim()}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        ...style,
      }}
    />
  );
};

