"use client";

import { useEffect, useState } from "react";

const SMALL_SCREEN_QUERY = "(max-width: 767px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToQuery(query: string, onChange: (matches: boolean) => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(query);
  const update = () => onChange(mediaQuery.matches);
  update();
  mediaQuery.addEventListener("change", update);

  return () => mediaQuery.removeEventListener("change", update);
}

export function useIsSmallScreen(query = SMALL_SCREEN_QUERY) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => subscribeToQuery(query, setIsSmallScreen), [query]);

  return isSmallScreen;
}

export function usePrefersReducedMotion(query = REDUCED_MOTION_QUERY) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => subscribeToQuery(query, setPrefersReducedMotion), [query]);

  return prefersReducedMotion;
}

export function useLightMotion() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isSmallScreen = useIsSmallScreen();

  return prefersReducedMotion || isSmallScreen;
}
