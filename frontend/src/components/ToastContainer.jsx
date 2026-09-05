import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const typeStyles = {
          success: 'bg-emerald-900 text-cream border-emerald-700',
          warning: 'bg-amber-900 text-cream border-amber-700',
          error: 'bg-red-900 text-cream border-red-700',
          info: 'bg-charcoal text-cream border-warm'
        }[toast.type || 'info'] || 'bg-charcoal text-cream border-warm';

        const Icon = {
          success: CheckCircle2,
          warning: AlertTriangle,
          error: XCircle,
          info: Info
        }[toast.type || 'info'] || Info;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-300 animate-slide-in ${typeStyles}`}
          >
            <div className="flex items-start gap-2.5">
              <Icon className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">{toast.message}</p>
            </div>

            <button 
              onClick={() => removeToast(toast.id)}
              className="text-cream/70 hover:text-cream p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
