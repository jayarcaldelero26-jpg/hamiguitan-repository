"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useOptionalProtectedTheme } from "@/app/components/ProtectedThemeProvider";
import { useModalMotion } from "@/app/lib/modalMotion";

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
  const protectedTheme = useOptionalProtectedTheme();
  const { overlayMotion, panelMotion } = useModalMotion();
  const protectedLight = protectedTheme?.theme === "light";
  const finalVariant = getVariant(variant, danger);
  const isDanger = finalVariant === "danger";

  const iconWrapClass =
    finalVariant === "success"
      ? "bg-[linear-gradient(180deg,rgba(57,92,122,0.92),rgba(47,78,102,0.96))] text-[var(--ui-text-main)] shadow-[0_16px_36px_rgba(24,31,39,0.3)]"
      : finalVariant === "warning"
      ? "bg-[linear-gradient(180deg,rgba(86,94,64,0.94),rgba(63,69,46,0.98))] text-[var(--ui-text-main)] shadow-[0_16px_36px_rgba(24,31,39,0.3)]"
      : finalVariant === "danger"
      ? "bg-[linear-gradient(180deg,rgba(122,46,55,0.96),rgba(88,34,42,0.98))] text-white shadow-[0_18px_42px_rgba(73,24,31,0.34)]"
      : "bg-[linear-gradient(180deg,rgba(47,78,102,0.94),rgba(35,58,77,0.98))] text-[var(--ui-text-main)] shadow-[0_16px_36px_rgba(24,31,39,0.3)]";

  const iconOuterRingClass = isDanger
    ? protectedLight
      ? "border border-[rgba(127,29,29,0.12)] bg-[radial-gradient(circle,rgba(220,38,38,0.18),rgba(220,38,38,0.05)_60%,transparent_76%)]"
      : "border border-[rgba(248,113,113,0.12)] bg-[radial-gradient(circle,rgba(220,38,38,0.22),rgba(127,29,29,0.08)_62%,transparent_78%)]"
    : protectedLight
    ? "border border-[rgba(57,92,122,0.1)] bg-[radial-gradient(circle,rgba(148,163,184,0.14),rgba(148,163,184,0.04)_60%,transparent_76%)]"
    : "border border-white/8 bg-[radial-gradient(circle,rgba(255,255,255,0.08),rgba(255,255,255,0.02)_62%,transparent_78%)]";

  const confirmBtnClass =
    finalVariant === "success"
      ? "app-glass-button app-protected-action-button app-sidebar-btn app-sidebar-btn-primary border border-[rgba(86,134,173,0.22)] bg-[linear-gradient(180deg,rgba(57,92,122,0.96),rgba(47,78,102,0.98))] text-[var(--ui-text-main)] shadow-[0_16px_34px_rgba(24,31,39,0.3)]"
      : finalVariant === "warning"
      ? "app-glass-button app-protected-action-button app-sidebar-btn app-sidebar-btn-warning border border-[rgba(166,174,120,0.18)] bg-[linear-gradient(180deg,rgba(86,94,64,0.96),rgba(63,69,46,0.98))] text-[var(--ui-text-main)] shadow-[0_16px_34px_rgba(24,31,39,0.3)]"
      : finalVariant === "danger"
      ? "app-glass-button app-protected-action-button app-sidebar-btn app-sidebar-btn-danger border border-[rgba(248,113,113,0.18)] bg-[linear-gradient(180deg,rgba(112,36,44,0.98),rgba(81,26,34,1))] text-[#FFF1F2] shadow-[0_18px_38px_rgba(63,16,23,0.36)]"
      : "app-glass-button app-protected-action-button app-sidebar-btn app-sidebar-btn-primary border border-[rgba(110,140,168,0.18)] bg-[linear-gradient(180deg,rgba(47,78,102,0.96),rgba(35,58,77,0.98))] text-[var(--ui-text-main)] shadow-[0_16px_34px_rgba(24,31,39,0.3)]";

  const cancelBtnClass = protectedLight
    ? "app-glass-button app-protected-action-button app-sidebar-btn app-sidebar-btn-secondary border border-[rgba(15,23,42,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.96))] text-[#1F2937] shadow-[0_12px_28px_rgba(15,23,42,0.1)]"
    : "app-glass-button app-protected-action-button border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] text-[var(--ui-text-main)] shadow-[0_14px_30px_rgba(0,0,0,0.24)]";

  const detailCardClassName = "app-soft-surface rounded-2xl px-4 py-3 text-left";

  const accentTextClass =
    finalVariant === "success"
      ? "text-[#9AB6D1]"
      : finalVariant === "warning"
      ? "text-[#B8BE92]"
      : finalVariant === "danger"
      ? "text-[#D3B5B5]"
      : "text-[#A9BDD1]";

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={overlayMotion.initial}
            animate={overlayMotion.animate}
            exit={overlayMotion.exit}
            transition={overlayMotion.transition}
            className="app-overlay absolute inset-0"
            onClick={() => {
              if (!loading) onCancel?.();
            }}
          />

          <motion.div
            initial={panelMotion.initial}
            animate={panelMotion.animate}
            exit={panelMotion.exit}
            transition={panelMotion.transition}
            className="app-dialog-surface relative max-h-[min(88dvh,760px)] w-full max-w-[540px] overflow-y-auto rounded-[28px] px-5 py-7 sm:rounded-[30px] sm:px-7 sm:py-8"
          >
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-[inherit] ${
                isDanger
                  ? protectedLight
                    ? "bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.14),transparent_68%)]"
                    : "bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.18),transparent_68%)]"
                  : protectedLight
                  ? "bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.1),transparent_70%)]"
                  : "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_72%)]"
              }`}
            />
            <div
              className={`pointer-events-none absolute inset-0 rounded-[inherit] ${
                protectedLight
                  ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
                  : "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              }`}
            />

            {!oneButton && onCancel && (
              <button
                type="button"
                onClick={() => !loading && onCancel()}
                disabled={loading}
                className={`app-glass-skip absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-2xl border transition disabled:opacity-60 sm:right-4 sm:top-4 sm:h-10 sm:w-10 ${
                  protectedLight
                    ? "border-[rgba(15,23,42,0.08)] bg-white/78 text-[var(--ui-text-soft)] hover:bg-white hover:text-[var(--ui-text-main)]"
                    : "border-white/10 bg-white/[0.06] text-[var(--ui-text-soft)] hover:bg-white/[0.1] hover:text-[var(--ui-text-main)]"
                }`}
                aria-label="Close dialog"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}

            <div className="relative flex flex-col items-center text-center">
              <div className={`mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full ${iconOuterRingClass}`}>
                <div className={`grid h-16 w-16 place-items-center rounded-full border border-white/10 ${iconWrapClass}`}>
                  <VariantIcon variant={finalVariant} />
                </div>
              </div>

              <h2 className="max-w-[420px] text-[24px] leading-tight font-extrabold tracking-[-0.03em] text-[var(--ui-text-main)] sm:text-[30px]">
                {title}
              </h2>

              <p className="app-muted-text mt-3 max-w-[420px] whitespace-pre-line text-[14px] leading-6 sm:text-[15px] sm:leading-7">
                {message}
              </p>

              {details.length > 0 && (
                <div className="mt-7 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                  {details.map((item, i) => (
                    <div
                      key={`${item.label}-${i}`}
                      className={detailCardClassName}
                    >
                      <div className="text-[12px] text-[var(--ui-text-soft)]">{item.label}</div>
                      <div className={`mt-1 text-[15px] font-extrabold ${accentTextClass}`}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div
                className={`mt-8 flex w-full flex-col gap-3 sm:flex-row ${
                  oneButton ? "justify-center" : "justify-center sm:justify-center"
                } ${oneButton ? "max-w-[320px]" : ""}`}
              >
                {!oneButton && (
                  <button
                    type="button"
                    onClick={() => onCancel?.()}
                    disabled={loading}
                    className={`min-h-11 flex-1 rounded-full px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-[148px] sm:flex-none ${cancelBtnClass}`}
                  >
                    {cancelText}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className={`min-h-11 flex-1 rounded-full px-6 py-3 font-extrabold transition disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-[180px] sm:flex-none ${confirmBtnClass}`}
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
