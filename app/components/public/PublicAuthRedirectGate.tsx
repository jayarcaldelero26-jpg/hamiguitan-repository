"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  clearBrowserTabDenied,
  getBrowserTabSessionId,
  hasConflictingTabSession,
  hasActiveBrowserSessionMarker,
  hasDeniedBrowserTabAccess,
  markBrowserSessionActive,
} from "@/app/lib/authSession";

export default function PublicAuthRedirectGate() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const redirectIfAllowed = async () => {
      if (hasDeniedBrowserTabAccess()) {
        return;
      }

      const hasSessionMarker = hasActiveBrowserSessionMarker();
      const tabSessionId = getBrowserTabSessionId();

      if (!hasSessionMarker || !tabSessionId) {
        return;
      }

      try {
        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!active || !res.ok) return;

        const hasConflict = await hasConflictingTabSession(tabSessionId);

        if (!active || hasConflict) return;

        clearBrowserTabDenied();
        markBrowserSessionActive();
        router.replace("/dashboard");
      } catch {}
    };

    void redirectIfAllowed();

    return () => {
      active = false;
    };
  }, [router]);

  return null;
}
