"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import PublicAuthRedirectGate from "@/app/components/public/PublicAuthRedirectGate";

export default function DeferredPublicAuthRedirectGate() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (pathname === "/login") {
      return;
    }

    const win = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const timeoutId = window.setTimeout(() => {
      setEnabled(true);
    }, 1200);

    const idleId = win.requestIdleCallback?.(() => {
      window.clearTimeout(timeoutId);
      setEnabled(true);
    }, { timeout: 2000 });

    return () => {
      window.clearTimeout(timeoutId);
      if (idleId !== undefined) {
        win.cancelIdleCallback?.(idleId);
      }
    };
  }, [pathname]);

  return enabled ? <PublicAuthRedirectGate /> : null;
}
