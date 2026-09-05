import React from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('DealFlow360 Error Boundary caught an unhandled render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleResetStorage = () => {
    try {
      localStorage.removeItem('dealflow360_frontend_state');
      localStorage.removeItem('dealflow360_user');
      localStorage.removeItem('dealflow360_registered_users');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fbf9f5] flex items-center justify-center p-6 text-charcoal font-sans">
          <div className="max-w-xl w-full bg-white border border-[#e5e0d8] rounded-2xl shadow-xl p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center shadow-xs border border-amber-200">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-charcoal tracking-tight font-heading">
                Something went wrong
              </h2>
              <p className="text-sm text-muted">
                An unexpected interface render issue occurred. Your data is safe. You can reload the page or reset the cached session.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-charcoal-03 border border-warm rounded-xl p-3.5 max-h-40 overflow-y-auto font-mono text-xs text-danger">
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="btn btn-secondary w-full sm:w-auto px-6 py-2.5 text-xs flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleResetStorage}
                className="btn btn-primary w-full sm:w-auto px-6 py-2.5 text-xs flex items-center justify-center gap-2 bg-charcoal text-cream hover:bg-black"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset Session & Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
