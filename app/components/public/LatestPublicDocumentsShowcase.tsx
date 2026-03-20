"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { memo, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { PublicDocumentRow } from "@/app/lib/publicDocuments";

function documentPreviewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

function supportsFeaturedPreview(type?: string) {
  const value = String(type || "").toLowerCase();
  return (
    value.includes("pdf") ||
    value.startsWith("image/") ||
    value.includes("presentation") ||
    value.includes("word") ||
    value.includes("document")
  );
}

function LatestPublicDocumentsShowcase({
  documents,
}: {
  documents: PublicDocumentRow[];
}) {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [previewRequested, setPreviewRequested] = useState(false);
  const activeDocument = documents[activeIndex] ?? null;
  const activePreviewUrl = activeDocument?.fileId ? documentPreviewUrl(activeDocument.fileId) : "";
  const canPreviewActiveDocument = supportsFeaturedPreview(activeDocument?.type);
  const lightMotion = prefersReducedMotion || isSmallScreen;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const update = () => setIsSmallScreen(mediaQuery.matches);
    update();

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const goTo = (index: number) => {
    if (!documents.length) return;
    setPreviewRequested(false);
    setActiveIndex((index + documents.length) % documents.length);
  };

  if (documents.length === 0) {
    return (
      <article className="public-card p-6 md:p-8">
        <p className="text-sm leading-7 text-[var(--public-text-muted)]">
          No public Minutes or Resolutions are available yet.
        </p>
      </article>
    );
  }

  return (
    <div className="public-docs-showcase public-card public-panel-highlight overflow-hidden p-4 md:p-5 lg:p-6">
      <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,22,34,0.82),rgba(8,12,18,0.92))] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.24)] md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_28%),radial-gradient(circle_at_18%_78%,rgba(56,189,248,0.08),transparent_24%)]" />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goTo(activeIndex - 1)}
                className="public-button-secondary-light inline-flex h-11 w-11 items-center justify-center rounded-full"
                aria-label="Previous document"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => goTo(activeIndex + 1)}
                className="public-button-secondary-light inline-flex h-11 w-11 items-center justify-center rounded-full"
                aria-label="Next document"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="public-card-soft px-4 py-2 text-sm text-[var(--public-text-muted)]">
              {String(activeIndex + 1).padStart(2, "0")} / {String(documents.length).padStart(2, "0")}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:items-stretch">
            <div className="min-w-0">
              <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[rgba(255,255,255,0.04)] shadow-[0_16px_34px_rgba(0,0,0,0.18)]">
                {activeDocument && canPreviewActiveDocument && previewRequested ? (
                  <iframe
                    key={`${activeDocument.id}-${activeDocument.fileId}`}
                    src={activePreviewUrl}
                    title={activeDocument.title}
                    className="h-[420px] w-full bg-white md:h-[560px]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-[420px] w-full flex-col justify-end bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 md:h-[560px]">
                    <span className="inline-flex w-fit rounded-full border border-[rgba(245,158,11,0.18)] bg-[rgba(245,158,11,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--public-accent)]">
                      {activeDocument?.kind}
                    </span>
                    <p className="mt-5 max-w-xl text-[1.4rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[var(--public-text)]">
                      {canPreviewActiveDocument ? "Preview this document" : "Preview unavailable for this file type"}
                    </p>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--public-text-muted)]">
                      {canPreviewActiveDocument
                        ? "Load the first-page preview only when needed to keep the page lighter on mobile devices."
                        : "The document can still be opened through the public View action in a new tab."}
                    </p>
                    {canPreviewActiveDocument ? (
                      <button
                        type="button"
                        onClick={() => setPreviewRequested(true)}
                        className="public-button-secondary-light mt-5 inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold"
                      >
                        Load Preview
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[26px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDocument?.id}
                  initial={lightMotion ? false : { opacity: 0, y: 16 }}
                  animate={lightMotion ? {} : { opacity: 1, y: 0 }}
                  exit={lightMotion ? {} : { opacity: 0, y: -12 }}
                  transition={{
                    duration: lightMotion ? 0 : 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <span className="inline-flex rounded-full border border-[rgba(245,158,11,0.18)] bg-[rgba(245,158,11,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--public-accent)]">
                    {activeDocument?.kind}
                  </span>
                  <h3 className="mt-5 text-[1.7rem] font-semibold leading-[1.08] tracking-[-0.035em] text-[var(--public-text)] md:text-[2.15rem]">
                    {activeDocument?.title}
                  </h3>
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 grid gap-3">
                <div className="public-card-soft w-full px-4 py-3 text-sm text-[var(--public-text-muted)]">
                  {activeDocument?.date || "Date unavailable"}
                </div>
                <Link
                  href={activePreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="public-button-primary inline-flex min-h-11 w-full items-center justify-center rounded-full px-6 text-sm font-semibold"
                >
                  View
                </Link>
              </div>
            </div>
          </div>

          <div className="public-docs-rail scroll-docs mt-8 flex gap-3 overflow-x-auto pb-2">
            {documents.map((document, index) => {
              const active = index === activeIndex;

              return (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => goTo(index)}
                  className={`min-w-[280px] flex-1 text-left transition md:min-w-[320px] ${
                    active
                      ? "rounded-[24px] border border-[rgba(245,158,11,0.2)] bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(245,158,11,0.04))] shadow-[0_14px_30px_rgba(0,0,0,0.18)]"
                      : "rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.04)] hover:border-white/14 hover:bg-[rgba(255,255,255,0.06)]"
                  } p-4 md:p-5`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-full border border-[rgba(255,255,255,0.12)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--public-text-muted)]">
                      {document.kind}
                    </span>
                    <span className="text-[12px] text-[var(--public-text-muted)]">
                      {document.date || "Date unavailable"}
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-3 text-[1rem] font-semibold leading-7 text-[var(--public-text)]">
                    {document.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {documents.map((document, index) => (
          <button
            key={document.id}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Go to document ${index + 1}`}
            aria-current={index === activeIndex}
            className={`h-2.5 rounded-full transition-all ${
              index === activeIndex
                ? "w-10 bg-[linear-gradient(90deg,#f97316_0%,#f5b342_100%)]"
                : "w-2.5 bg-white/28 hover:bg-white/48"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(LatestPublicDocumentsShowcase);
