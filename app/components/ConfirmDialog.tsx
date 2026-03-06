"use client";

import { motion } from "framer-motion";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;

  confirmText?: string;
  cancelText?: string;

  danger?: boolean;
  loading?: boolean;
  oneButton?: boolean;

  onConfirm: () => void;
  onCancel?: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  danger = false,
  loading = false,
  oneButton = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="bg-white rounded-[28px] shadow-[0_24px_70px_rgba(15,23,42,0.22)] max-w-md w-full p-6 border border-slate-200"
      >
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
          <p className="text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        <div className={`flex gap-3 mt-7 ${oneButton ? "justify-center" : "justify-end"}`}>
          {!oneButton && (
            <button
              type="button"
              onClick={() => onCancel?.()}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 font-bold transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2.5 rounded-xl text-white font-extrabold shadow-[0_12px_28px_rgba(15,23,42,0.12)] transition disabled:opacity-70 disabled:cursor-not-allowed ${
              danger
                ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                : "bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800"
            }`}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}