import React, { Component, type ReactNode } from 'react';
import { getDashboardRouteByRole, getUserRole } from '../utils/auth';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('SmartUni ErrorBoundary caught a rendering error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoDashboard = (): void => {
    const role = getUserRole();
    const route = getDashboardRouteByRole(role);
    window.location.href = route;
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallbackTitle, fallbackMessage } = this.props;
      const errorMessage =
        this.state.error?.message ||
        fallbackMessage ||
        'Интерфейс компоненттерін жүктеу кезінде техникалық ақаулық орын алды.';

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            padding: '24px',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '36px 32px',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                margin: '0 auto 20px',
              }}
            >
              ⚠️
            </div>

            <h2
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#0f172a',
                marginBottom: '10px',
              }}
            >
              {fallbackTitle || 'Күтпеген қате орын алды'}
            </h2>

            <p
              style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#475569',
                marginBottom: '24px',
              }}
            >
              {errorMessage}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
                }}
              >
                🔄 Бетті қайта жүктеу
              </button>

              <button
                type="button"
                onClick={this.handleGoDashboard}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: '1px solid #cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                🏠 Негізгі кабинетке оралу
              </button>
            </div>

            {/* Error details for debugging */}
            {this.state.error && (
              <details
                style={{
                  marginTop: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  color: '#64748b',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                  Техникалық толық мәліметтер
                </summary>
                <pre
                  style={{
                    marginTop: '8px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    color: '#991b1b',
                    maxHeight: '180px',
                    overflowY: 'auto',
                  }}
                >
                  {this.state.error.name}: {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

