import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#070708] text-[#F5F2EB] flex items-center justify-center px-6">
          <div className="max-w-md text-center space-y-4">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4B475]">
              Md. Nabiul Islam
            </p>
            <h1 className="font-serif text-3xl font-semibold">
              Unable to load view completely
            </h1>
            <p className="text-sm text-[#8C8A84]">
              A display component encountered an unexpected browser error. Reload the page to restore the experience.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#D4B475] text-[#070708] text-xs font-semibold"
            >
              Reload Portfolio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
