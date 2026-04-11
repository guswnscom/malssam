'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ToastContextType {
  toast: (type: ToastItem['type'], message: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const toast = useCallback((type: ToastItem['type'], message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const handleConfirm = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast 메시지 */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-4 z-[60] space-y-2 pointer-events-none w-[90%] sm:w-auto">
        {toasts.map(t => (
          <div key={t.id}
            className={`pointer-events-auto px-4 py-3.5 rounded-2xl text-sm font-medium flex items-center gap-2.5 min-w-[240px] max-w-[360px] animate-slide-in-up sm:animate-slide-in-right ${
              t.type === 'success' ? 'bg-[#0F1A2E] text-white' :
              t.type === 'error' ? 'bg-[#0F1A2E] text-white' :
              'bg-[#0F1A2E] text-white'
            }`} style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            {t.type === 'success' && <div className="w-5 h-5 bg-[#059669] rounded-full flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg></div>}
            {t.type === 'error' && <div className="w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></div>}
            {t.type === 'info' && <div className="w-5 h-5 bg-[#C9A84C] rounded-full flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3 text-[#0F1A2E]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01"/></svg></div>}
            <span className="text-[13px]">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 animate-fade-in" style={{ background: 'rgba(15,26,46,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 animate-slide-in-up" style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.15)' }}>
            <h3 className="font-bold text-lg text-[#0F1A2E] mb-2">{confirmState.options.title}</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">{confirmState.options.message}</p>
            <div className="flex gap-3">
              <button onClick={() => handleConfirm(false)}
                className="btn-secondary flex-1 py-2.5 text-sm">
                {confirmState.options.cancelText || '취소'}
              </button>
              <button onClick={() => handleConfirm(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white active:scale-[0.98] ${
                  confirmState.options.danger ? 'btn-danger' : 'btn-primary'
                }`}>
                {confirmState.options.confirmText || '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
