"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

const SMALL_SCREEN_QUERY = "(max-width: 767px)";

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

export function useLightMotion() {
  const prefersReducedMotion = useReducedMotion();
  const isSmallScreen = useIsSmallScreen();

  return prefersReducedMotion || isSmallScreen;
}
