"use client";

import React, { useEffect, useRef } from "react";

export interface ToastProps {
  message: string | null;
  type?: "success" | "error" | "warning" | "info";
  onClose?: () => void;
  duration?: number;
}

const ICON: Record<NonNullable<ToastProps["type"]>, React.ReactNode> = {
  success: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

const STYLE: Record<NonNullable<ToastProps["type"]>, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-200",
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/90 dark:text-red-200",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/90 dark:text-amber-200",
  info: "border-zinc-200 bg-zinc-900 text-zinc-100 dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900",
};

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "info",
  onClose,
  duration = 5000,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (onClose) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, duration);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message, onClose, duration]);

  if (!message) return null;

  return (
    <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-50 animate-slide-up-in" style={{ transform: "translateX(-50%)" }}>
      <div className={`flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg shadow-black/10 ${STYLE[type]}`}>
        {ICON[type]}
        <span className="max-w-xs truncate">{message}</span>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Dismiss notification" className="ml-0.5 shrink-0 opacity-60 transition hover:opacity-100">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
