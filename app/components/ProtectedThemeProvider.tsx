"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ProtectedTheme = "dark" | "light";

type ProtectedThemeContextValue = {
  theme: ProtectedTheme;
  dark: boolean;
  mounted: boolean;
  setTheme: (theme: ProtectedTheme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "protected-theme";
const LEGACY_STORAGE_KEY = "page-theme";

const ProtectedThemeContext = createContext<ProtectedThemeContextValue | null>(null);

function readStoredTheme(): ProtectedTheme {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;

  const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacy === "dark" || legacy === "light") return legacy;

  return "light";
}

export function ProtectedThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<ProtectedTheme>("light");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedTheme = readStoredTheme();
      setThemeState((currentTheme) =>
        currentTheme === storedTheme ? currentTheme : storedTheme
      );
      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const setTheme = useCallback((nextTheme: ProtectedTheme) => {
    setThemeState(nextTheme);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
      window.localStorage.setItem(LEGACY_STORAGE_KEY, nextTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const resolvedTheme = mounted ? theme : "light";

  const value = useMemo<ProtectedThemeContextValue>(
    () => ({
      theme: resolvedTheme,
      dark: resolvedTheme === "dark",
      mounted,
      setTheme,
      toggleTheme,
    }),
    [mounted, resolvedTheme, setTheme, toggleTheme]
  );

  return (
    <ProtectedThemeContext.Provider value={value}>
      <div
        data-protected-theme={resolvedTheme}
        className="min-h-full"
        suppressHydrationWarning
      >
        {children}
      </div>
    </ProtectedThemeContext.Provider>
  );
}

export function useProtectedTheme() {
  const context = useContext(ProtectedThemeContext);

  if (!context) {
    throw new Error("useProtectedTheme must be used inside <ProtectedThemeProvider />");
  }

  return context;
}

export function useOptionalProtectedTheme() {
  return useContext(ProtectedThemeContext);
}
