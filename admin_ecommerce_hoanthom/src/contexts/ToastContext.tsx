import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  msg?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, msg?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastType, title: string, msg?: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, msg }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3600);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-root">
        {toasts.map(t => {
          const Icon = TOAST_ICONS[t.type];
          return (
            <div key={t.id} className={`toast toast--${t.type}`}>
              <span className="toast__icon"><Icon size={20} /></span>
              <div>
                <strong>{t.title}</strong>
                {t.msg && <p>{t.msg}</p>}
              </div>
              <button className="icon-btn icon-btn--sm" aria-label="Đóng" onClick={() => removeToast(t.id)}>
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
