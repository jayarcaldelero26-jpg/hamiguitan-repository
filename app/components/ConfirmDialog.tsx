"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type DialogVariant = "success" | "info" | "warning" | "danger";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;

  confirmText?: string;
  cancelText?: string;

  danger?: boolean;
  loading?: boolean;
  oneButton?: boolean;

  variant?: DialogVariant;
  details?: Array<{ label: string; value: string }>;

  onConfirm: () => void;
  onCancel?: () => void;
};

function getVariant(variant?: DialogVariant, danger?: boolean): DialogVariant {
  if (variant) return variant;
  if (danger) return "danger";
  return "success";
}

function VariantIcon({ variant }: { variant: DialogVariant }) {
  const base =
    "w-8 h-8";

  if (variant === "success") {
    return <CheckIcon className={base} />;
  }

  if (variant === "warning") {
    return <ExclamationTriangleIcon className={base} />;
  }

  if (variant === "danger") {
    return <TrashIcon className={base} />;
  }

  return <InformationCircleIcon className={base} />;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  danger = false,
  loading = false,
  oneButton = false,
  variant,
  details = [],
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const finalVariant = getVariant(variant, danger);

  const iconWrapClass =
    finalVariant === "success"
      ? "bg-cyan-500 text-white shadow-[0_10px_24px_rgba(6,182,212,0.28)]"
      : finalVariant === "warning"
      ? "bg-amber-500 text-white shadow-[0_10px_24px_rgba(245,158,11,0.28)]"
      : finalVariant === "danger"
      ? "bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.28)]"
      : "bg-sky-500 text-white shadow-[0_10px_24px_rgba(14,165,233,0.28)]";

  const confirmBtnClass =
    finalVariant === "success"
      ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_10px_24px_rgba(6,182,212,0.24)]"
      : finalVariant === "warning"
      ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_10px_24px_rgba(245,158,11,0.24)]"
      : finalVariant === "danger"
      ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_10px_24px_rgba(6,182,212,0.24)]"
      : "bg-sky-600 hover:bg-sky-500 text-white shadow-[0_10px_24px_rgba(14,165,233,0.24)]";

  const accentTextClass =
    finalVariant === "success"
      ? "text-cyan-600"
      : finalVariant === "warning"
      ? "text-amber-600"
      : finalVariant === "danger"
      ? "text-slate-800"
      : "text-sky-600";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!loading) onCancel?.();
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-w-[540px] max-h-[min(88dvh,760px)] overflow-y-auto rounded-[28px] bg-white border border-slate-200 shadow-[0_28px_80px_rgba(15,23,42,0.20)] px-4 py-6 sm:px-6 sm:py-7 sm:rounded-[30px]"
          >
            {!oneButton && onCancel && (
              <button
                type="button"
                onClick={() => !loading && onCancel()}
                disabled={loading}
                className="absolute right-3 top-3 h-11 w-11 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition disabled:opacity-60 grid place-items-center sm:right-4 sm:top-4 sm:h-10 sm:w-10"
                aria-label="Close dialog"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-5">
                <div className={`h-16 w-16 rounded-full grid place-items-center ${iconWrapClass}`}>
                  <VariantIcon variant={finalVariant} />
                </div>

                <span className="absolute -left-4 top-2 h-2.5 w-2.5 rounded-full bg-cyan-200" />
                <span className="absolute -right-3 top-0 h-2 w-2 rounded-full bg-sky-300" />
                <span className="absolute right-0 -bottom-1 h-2.5 w-2.5 rounded-full bg-emerald-200" />
                <span className="absolute -left-1 -bottom-3 h-2 w-2 rounded-full bg-cyan-100" />
              </div>

              <h2 className="text-[24px] sm:text-[30px] leading-tight font-extrabold text-slate-900">
                {title}
              </h2>

              <p className="mt-3 max-w-[420px] text-[14px] sm:text-[15px] leading-6 sm:leading-7 text-slate-500 whitespace-pre-line">
                {message}
              </p>

              {details.length > 0 && (
                <div className="mt-6 grid w-full grid-cols-1 sm:grid-cols-3 gap-3">
                  {details.map((item, i) => (
                    <div
                      key={`${item.label}-${i}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left"
                    >
                      <div className="text-[12px] text-slate-500">{item.label}</div>
                      <div className={`mt-1 text-[15px] font-extrabold ${accentTextClass}`}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div
                className={`mt-7 flex w-full flex-col sm:flex-row gap-3 ${
                  oneButton ? "justify-center" : "justify-center sm:justify-between"
                } ${oneButton ? "max-w-[320px]" : ""}`}
              >
                {!oneButton && (
                  <button
                    type="button"
                    onClick={() => onCancel?.()}
                    disabled={loading}
                    className="flex-1 sm:flex-none sm:min-w-[140px] min-h-11 px-5 py-3 rounded-2xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {cancelText}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 sm:flex-none sm:min-w-[180px] min-h-11 px-6 py-3 rounded-2xl font-extrabold transition disabled:opacity-70 disabled:cursor-not-allowed ${confirmBtnClass}`}
                >
                  {loading ? "Please wait..." : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
