"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
};

type ToastContextType = {
  toast: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = (t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    const next: Toast = { id, ...t };
    setItems((prev) => [...prev, next]);

    setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }, 2600);
  };

  const value = useMemo(() => ({ toast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* TOAST STACK */}
      <div className="fixed bottom-4 right-4 z-[9999] space-y-2 w-[340px] max-w-[92vw]">
        {items.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl border shadow-lg px-4 py-3 backdrop-blur bg-white/90 ${
              t.type === "success"
                ? "border-green-200"
                : t.type === "error"
                ? "border-red-200"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {t.title && (
                  <div className="font-extrabold text-gray-900">{t.title}</div>
                )}
                <div className="text-sm text-gray-700 break-words">
                  {t.message}
                </div>
              </div>

              <button
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                className="text-gray-400 hover:text-gray-700 font-bold"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div
              className={`mt-2 h-1 rounded-full ${
                t.type === "success"
                  ? "bg-green-600"
                  : t.type === "error"
                  ? "bg-red-600"
                  : "bg-gray-500"
              }`}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}