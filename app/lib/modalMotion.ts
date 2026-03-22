"use client";

import { useReducedMotion } from "framer-motion";

type TiltCardMotionOptions = {
  hoverY: number;
  hoverScale: number;
  hoverRotateX: number;
  hoverRotateY: number;
  tapScale: number;
  tapRotateX: number;
  tapRotateY: number;
  tapY?: number;
  reducedHoverY?: number;
  reducedHoverScale?: number;
  reducedTapScale?: number;
  reducedTapY?: number;
  perspective?: number;
};

export function createTiltCardMotion(
  prefersReducedMotion: boolean,
  options: TiltCardMotionOptions
) {
  return {
    hoverMotion: prefersReducedMotion
      ? {
          y: options.reducedHoverY ?? Math.min(options.hoverY * 0.5, -2),
          scale: options.reducedHoverScale ?? Math.min(options.hoverScale, 1.01),
        }
      : {
          y: options.hoverY,
          scale: options.hoverScale,
          rotateX: options.hoverRotateX,
          rotateY: options.hoverRotateY,
        },
    tapMotion: prefersReducedMotion
      ? {
          scale: options.reducedTapScale ?? options.tapScale,
          y: options.reducedTapY ?? options.tapY ?? -1,
        }
      : {
          scale: options.tapScale,
          y: options.tapY ?? -1,
          rotateX: options.tapRotateX,
          rotateY: options.tapRotateY,
        },
    transition: prefersReducedMotion
      ? { duration: 0.16, ease: "easeOut" as const }
      : { type: "spring" as const, stiffness: 260, damping: 20, mass: 0.7 },
    style: {
      transformStyle: prefersReducedMotion ? undefined : ("preserve-3d" as const),
      transformPerspective: prefersReducedMotion ? undefined : (options.perspective ?? 1100),
      willChange: "transform" as const,
    },
  };
}

export function useModalMotion() {
  const prefersReducedMotion = useReducedMotion();

  const overlayMotion = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: "easeOut" as const },
  };

  const panelMotion = prefersReducedMotion
    ? {
        initial: { opacity: 0, y: 10, scale: 0.99 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 8, scale: 0.99 },
        transition: { duration: 0.2, ease: "easeOut" as const },
      }
    : {
        initial: { opacity: 0, scale: 0.97, y: 16 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98, y: 8 },
        transition: { duration: 0.2, ease: "easeOut" as const },
      };

  const dropdownMotion = prefersReducedMotion
    ? {
        initial: { opacity: 0, y: 6, scale: 0.99 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 4, scale: 0.99 },
        transition: { duration: 0.16, ease: "easeOut" as const },
      }
    : {
        initial: { opacity: 0, y: 8, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 6, scale: 0.98 },
        transition: { duration: 0.18, ease: "easeOut" as const },
      };

  const actionPressMotion = prefersReducedMotion ? { scale: 0.99 } : { scale: 0.975 };

  return {
    prefersReducedMotion,
    overlayMotion,
    panelMotion,
    dropdownMotion,
    actionPressMotion,
  };
}

export function useEditModalMotion() {
  const prefersReducedMotion = useReducedMotion();
  const polishedEase = [0.22, 1, 0.36, 1] as const;

  const overlayMotion = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.14, ease: "easeOut" as const } },
        exit: { opacity: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
      }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.18, ease: polishedEase } },
        exit: { opacity: 0, transition: { duration: 0.26, ease: polishedEase } },
      };

  const panelMotion = prefersReducedMotion
    ? {
        initial: { opacity: 0, y: 8, scale: 0.995 },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.16, ease: "easeOut" as const },
        },
        exit: {
          opacity: 0,
          y: 6,
          scale: 0.99,
          transition: { duration: 0.22, ease: "easeOut" as const },
        },
      }
    : {
        initial: { opacity: 0, scale: 0.975, y: 14 },
        animate: {
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { duration: 0.18, ease: polishedEase },
        },
        exit: {
          opacity: 0,
          scale: 0.985,
          y: 6,
          transition: { duration: 0.28, ease: polishedEase },
        },
      };

  return {
    prefersReducedMotion,
    overlayMotion,
    panelMotion,
  };
}
