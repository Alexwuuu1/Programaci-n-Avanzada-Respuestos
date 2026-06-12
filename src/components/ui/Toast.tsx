import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type ToastListener = (toast: ToastMessage) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  show: (message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, message, duration };
    listeners.forEach((listener) => listener(newToast));
  },
  success: (message: string, duration?: number) => toast.show(message, "success", duration),
  error: (message: string, duration?: number) => toast.show(message, "error", duration),
  warning: (message: string, duration?: number) => toast.show(message, "warning", duration),
  info: (message: string, duration?: number) => toast.show(message, "info", duration),
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleNewToast = (t: ToastMessage) => {
      setToasts((prev) => [...prev, t]);
      
      // Auto-remove after duration
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== t.id));
      }, t.duration || 4000);

      return () => clearTimeout(timer);
    };

    listeners.add(handleNewToast);
    return () => {
      listeners.delete(handleNewToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const iconMap = {
          success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
          error: <XCircle className="h-5 w-5 text-red-400 shrink-0" />,
          warning: <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />,
          info: <Info className="h-5 w-5 text-primary shrink-0" />,
        };

        const borderMap = {
          success: "border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
          error: "border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
          warning: "border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]",
          info: "border-primary/30 shadow-[0_0_15px_rgba(0,149,255,0.1)]",
        };

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 bg-card/90 backdrop-blur-md border ${borderMap[t.type]} p-4 rounded-xl text-xs text-foreground animate-slideInRight`}
          >
            {iconMap[t.type]}
            <div className="flex-1 font-semibold">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
