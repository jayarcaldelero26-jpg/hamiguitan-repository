"use client";

export const AUTH_SESSION_MARKER_KEY = "mhrws_auth_session_marker";
export const AUTH_LAST_ACTIVITY_KEY = "mhrws_auth_last_activity";
export const AUTH_INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
export const AUTH_WARNING_LEAD_MS = 60 * 1000;

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function hasActiveBrowserSessionMarker() {
  if (!canUseSessionStorage()) return false;
  return window.sessionStorage.getItem(AUTH_SESSION_MARKER_KEY) === "1";
}

export function getLastActivityAt() {
  if (!canUseSessionStorage()) return null;
  const raw = window.sessionStorage.getItem(AUTH_LAST_ACTIVITY_KEY);
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function markBrowserSessionActive(at = Date.now()) {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(AUTH_SESSION_MARKER_KEY, "1");
  window.sessionStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(at));
}

export function recordBrowserSessionActivity(at = Date.now()) {
  if (!canUseSessionStorage() || !hasActiveBrowserSessionMarker()) return;
  window.sessionStorage.setItem(AUTH_LAST_ACTIVITY_KEY, String(at));
}

export function clearBrowserSessionState() {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(AUTH_SESSION_MARKER_KEY);
  window.sessionStorage.removeItem(AUTH_LAST_ACTIVITY_KEY);
}

export function isBrowserSessionExpired(now = Date.now()) {
  const lastActivityAt = getLastActivityAt();
  if (!lastActivityAt) return true;
  return now - lastActivityAt >= AUTH_INACTIVITY_TIMEOUT_MS;
}
