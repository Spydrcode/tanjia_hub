'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import clsx from "clsx";

type ToastVariant = "default" | "success" | "error";
type ToastMessage = { id: number; title: string; variant: ToastVariant };

type ToastContextValue = {
  show: (title: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((title: string, variant: ToastVariant = "default") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              "pointer-events-auto min-w-[200px] max-w-sm rounded-lg border px-3 py-2 text-sm shadow-md",
              toast.variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
              toast.variant === "error" && "border-red-200 bg-red-50 text-red-900",
              toast.variant === "default" && "border-neutral-200 bg-white text-neutral-800",
            )}
          >
            {toast.title}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx.show;
}

