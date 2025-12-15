import React from 'react';
import { useTranslation } from 'react-i18next';
import { captureException } from '../telemetry/sentry';

type TranslationProps = { readonly t: (key: string) => string };
type Props = { readonly children: React.ReactNode } & TranslationProps;
type State = { hasError: boolean; error?: Error };

export class ErrorBoundaryImpl extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Intentionally left empty: side-effects are handled by getDerivedStateFromError and render branch
  componentDidCatch(error: Error): void {
    captureException(error);
  }

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      return (
        <div className="p-6" role="alert" aria-live="assertive">
          <h2 className="text-lg font-semibold mb-2">{t('something_went_wrong')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {this.state.error?.message || t('unknown_error')}
          </p>
          <button
            className="px-3 py-1 border rounded"
            onClick={() => this.setState({ hasError: false, error: undefined })}
            aria-label={t('retry')}
          >
            {t('retry')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ErrorBoundary: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  return <ErrorBoundaryImpl t={t}>{children}</ErrorBoundaryImpl>;
};

export const RetryHint: React.FC<{ readonly onRetry: () => void; readonly message?: string }> = ({
  onRetry,
  message,
}) => {
  const { t } = useTranslation();
  return (
    <div className="p-3 border rounded bg-amber-50 text-amber-900" role="alert">
      <div className="flex items-center justify-between">
        <span className="text-sm">{message || t('error_loading_hint')}</span>
        <button className="ml-3 px-2 py-1 border rounded" onClick={onRetry} aria-label={t('retry')}>
          {t('retry')}
        </button>
      </div>
    </div>
  );
};
