function normalizeRole(role?: string) {
  return (role || "").trim().toLowerCase();
}

export function canAccessSettings(role?: string) {
  const r = normalizeRole(role);
  return r === "admin" || r === "co_admin" || r === "staff";
}

export function canAccessRegisterStaff(role?: string) {
  const r = normalizeRole(role);
  return r === "admin";
}

export function canManageUsers(role?: string) {
  const r = normalizeRole(role);
  return r === "admin";
}

export function canViewUsers(role?: string) {
  const r = normalizeRole(role);
  return r === "admin" || r === "co_admin";
}

export function canUpload(role?: string) {
  const r = normalizeRole(role);
  return r === "admin" || r === "co_admin";
}

export function canDownload(role?: string) {
  const r = normalizeRole(role);
  return r === "admin" || r === "co_admin" || r === "staff";
}

export function canViewDocuments(role?: string) {
  const r = normalizeRole(role);
  return r === "admin" || r === "co_admin" || r === "staff";
}

export function canDeleteDocuments(role?: string) {
  const r = normalizeRole(role);
  return r === "admin";
}