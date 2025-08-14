import React from 'react'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  // Intentionally left empty: side-effects are handled by getDerivedStateFromError and render branch
  componentDidCatch(): void {
    return
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-600 mb-4">{this.state.error?.message || 'Unknown error'}</p>
          <button className="px-3 py-1 border rounded" onClick={() => this.setState({ hasError: false, error: undefined })}>
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export const RetryHint: React.FC<{ onRetry: () => void; message?: string }> = ({ onRetry, message }) => {
  return (
    <div className="p-3 border rounded bg-amber-50 text-amber-900">
      <div className="flex items-center justify-between">
        <span className="text-sm">{message || 'There was a problem loading data. Check your connection and try again.'}</span>
        <button className="ml-3 px-2 py-1 border rounded" onClick={onRetry}>Retry</button>
      </div>
    </div>
  )
}


