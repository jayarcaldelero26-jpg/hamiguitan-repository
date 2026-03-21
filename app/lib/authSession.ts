"use client";

export const AUTH_SESSION_MARKER_KEY = "mhrws_auth_session_marker";
export const AUTH_LAST_ACTIVITY_KEY = "mhrws_auth_last_activity";
export const AUTH_TAB_SESSION_ID_KEY = "mhrws_auth_tab_session_id";
export const AUTH_TAB_DENIED_KEY = "mhrws_auth_tab_denied";
export const AUTH_INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
export const AUTH_WARNING_LEAD_MS = 60 * 1000;
const AUTH_TAB_CHANNEL_NAME = "mhrws_auth_tab_gate";
const AUTH_TAB_PROBE_TIMEOUT_MS = 120;

type TabProbeMessage = {
  type: "probe";
  probeId: string;
  tabSessionId: string;
  instanceId: string;
};

type TabProbeAckMessage = {
  type: "probe_ack";
  probeId: string;
  tabSessionId: string;
  instanceId: string;
};

let runtimeInstanceId: string | null = null;

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function canUseBroadcastChannel() {
  return typeof window !== "undefined" && typeof window.BroadcastChannel !== "undefined";
}

function createRandomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function getRuntimeInstanceId() {
  if (!runtimeInstanceId) {
    runtimeInstanceId = createRandomId();
  }

  return runtimeInstanceId;
}

export function hasActiveBrowserSessionMarker() {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(AUTH_SESSION_MARKER_KEY) === "1";
}

export function getBrowserTabSessionId() {
  if (!canUseSessionStorage()) return null;
  return window.sessionStorage.getItem(AUTH_TAB_SESSION_ID_KEY);
}

export function hasDeniedBrowserTabAccess() {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(AUTH_TAB_DENIED_KEY) === "1";
}

export function getLastActivityAt() {
  if (!canUseSessionStorage()) return null;
  const raw = window.sessionStorage.getItem(AUTH_LAST_ACTIVITY_KEY);
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function markBrowserSessionActive(
  at = Date.now(),
  options: {
    regenerateTabId?: boolean;
  } = {}
) {
  if (!canUseSessionStorage()) return;
  const currentTabSessionId = getBrowserTabSessionId();
  const nextTabSessionId =
    options.regenerateTabId || !currentTabSessionId ? createRandomId() : currentTabSessionId;
  window.sessionStorage.setItem(AUTH_SESSION_MARKER_KEY, "1");
  window.sessionStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(at));
  window.sessionStorage.setItem(AUTH_TAB_SESSION_ID_KEY, nextTabSessionId);
  window.sessionStorage.removeItem(AUTH_TAB_DENIED_KEY);
}

export function recordBrowserSessionActivity(at = Date.now()) {
  if (!canUseSessionStorage() || !hasActiveBrowserSessionMarker()) return;
  window.sessionStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(at));
}

export function clearBrowserSessionState() {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(AUTH_SESSION_MARKER_KEY);
  window.sessionStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
  window.sessionStorage.removeItem(AUTH_TAB_SESSION_ID_KEY);
}

export function markBrowserTabDenied() {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(AUTH_TAB_DENIED_KEY, "1");
}

export function clearBrowserTabDenied() {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(AUTH_TAB_DENIED_KEY);
}

export function isBrowserSessionExpired(now = Date.now()) {
  const lastActivityAt = getLastActivityAt();
  if (!lastActivityAt) return true;
  return now - lastActivityAt >= AUTH_INACTIVITY_TIMEOUT_MS;
}

export function attachTabSessionResponder(tabSessionId: string) {
  if (!canUseBroadcastChannel()) {
    return () => {};
  }

  const instanceId = getRuntimeInstanceId();
  const channel = new window.BroadcastChannel(AUTH_TAB_CHANNEL_NAME);

  channel.onmessage = (event: MessageEvent<TabProbeMessage | TabProbeAckMessage>) => {
    const data = event.data;

    if (!data || data.type !== "probe") return;
    if (data.tabSessionId !== tabSessionId) return;
    if (data.instanceId === instanceId) return;

    channel.postMessage({
      type: "probe_ack",
      probeId: data.probeId,
      tabSessionId,
      instanceId,
    } satisfies TabProbeAckMessage);
  };

  return () => {
    channel.close();
  };
}

export async function hasConflictingTabSession(tabSessionId: string) {
  if (!canUseBroadcastChannel()) {
    return false;
  }

  const instanceId = getRuntimeInstanceId();
  const probeId = createRandomId();
  const channel = new window.BroadcastChannel(AUTH_TAB_CHANNEL_NAME);

  return await new Promise<boolean>((resolve) => {
    let settled = false;

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      channel.close();
      resolve(value);
    };

    const timeoutId = window.setTimeout(() => {
      finish(false);
    }, AUTH_TAB_PROBE_TIMEOUT_MS);

    channel.onmessage = (event: MessageEvent<TabProbeMessage | TabProbeAckMessage>) => {
      const data = event.data;

      if (!data || data.type !== "probe_ack") return;
      if (data.probeId !== probeId) return;
      if (data.tabSessionId !== tabSessionId) return;
      if (data.instanceId === instanceId) return;

      finish(true);
    };

    channel.postMessage({
      type: "probe",
      probeId,
      tabSessionId,
      instanceId,
    } satisfies TabProbeMessage);
  });
}
