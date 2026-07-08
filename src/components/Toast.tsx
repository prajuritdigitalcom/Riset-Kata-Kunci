import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const bgClass =
    toast.type === "success"
      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/85 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
      : toast.type === "error"
      ? "bg-rose-50 border-rose-200 dark:bg-rose-950/85 dark:border-rose-800 text-rose-800 dark:text-rose-200"
      : "bg-blue-50 border-blue-200 dark:bg-blue-950/85 dark:border-blue-800 text-blue-800 dark:text-blue-200";

  const Icon =
    toast.type === "success"
      ? CheckCircle2
      : toast.type === "error"
      ? AlertCircle
      : Info;

  return (
    <div
      id={`toast-${toast.id}`}
      className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 animate-slide-in ${bgClass}`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
      <button
        id={`close-toast-${toast.id}`}
        onClick={() => onClose(toast.id)}
        className="ml-4 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
