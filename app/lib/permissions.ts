export function canAccessSettings(role?: string) {
  return role === "admin";
}

export function canAccessRegisterStaff(role?: string) {
  return role === "admin";
}

export function canManageUsers(role?: string) {
  return role === "admin";
}

export function canViewUsers(role?: string) {
  return role === "admin" || role === "co_admin";
}

export function canUpload(role?: string) {
  return role === "admin" || role === "co_admin";
}

export function canDownload(role?: string) {
  return role === "admin" || role === "co_admin" || role === "staff";
}

export function canViewDocuments(role?: string) {
  return role === "admin" || role === "co_admin" || role === "staff";
}

export function canDeleteDocuments(role?: string) {
  return role === "admin";
}