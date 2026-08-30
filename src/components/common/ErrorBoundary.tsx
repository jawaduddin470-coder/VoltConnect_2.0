import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  refCode: string;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    refCode: '',
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    const refCode = `VC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return {
      hasError: true,
      refCode,
      errorMessage: error.message || 'Unknown runtime error',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[VoltGuard Global Error Boundary] Intercepted Failure:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, refCode: '', errorMessage: '' });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="vc-card p-8 bg-white border border-rose-200 text-center space-y-4 max-w-md mx-auto my-8 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="font-heading font-extrabold text-lg text-navy-900">
              {this.props.fallbackTitle || 'Component Temporarily Unavailable'}
            </h3>
            <p className="text-xs text-slate-500">
              VoltGuard intercepted a localized component issue while preserving system stability.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-700">Reference: {this.state.refCode}</div>
            <div className="text-slate-400 truncate">{this.state.errorMessage}</div>
          </div>

          <button
            onClick={this.handleReset}
            className="vc-btn vc-btn-teal text-xs font-bold py-2.5 px-5 mx-auto flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reload Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
