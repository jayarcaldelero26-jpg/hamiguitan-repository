import "server-only";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function requireNumberEnv(name: string) {
  const value = Number(requireEnv(name));

  if (!Number.isFinite(value)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }

  return value;
}

function requireBooleanEnv(name: string) {
  const value = requireEnv(name).toLowerCase();

  if (value !== "true" && value !== "false") {
    throw new Error(`Environment variable ${name} must be "true" or "false"`);
  }

  return value === "true";
}

export const serverEnv = {
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  jwtSecret: requireEnv("JWT_SECRET"),
  googleClientId: requireEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
  googleRedirectUri: requireEnv("GOOGLE_REDIRECT_URI"),
  googleRefreshToken: requireEnv("GOOGLE_REFRESH_TOKEN"),
  driveRootFolderId: requireEnv("DRIVE_ROOT_FOLDER_ID"),
  driveAcademeFolderId: requireEnv("DRIVE_ACADEME_FOLDER_ID"),
  driveStakeholdersFolderId: requireEnv("DRIVE_STAKEHOLDERS_FOLDER_ID"),
  drivePamoFolderId: requireEnv("DRIVE_PAMO_FOLDER_ID"),
  smtpHost: requireEnv("SMTP_HOST"),
  smtpPort: requireNumberEnv("SMTP_PORT"),
  smtpSecure: requireBooleanEnv("SMTP_SECURE"),
  smtpUser: requireEnv("SMTP_USER"),
  smtpPass: requireEnv("SMTP_PASS"),
  smtpFrom: requireEnv("SMTP_FROM"),
  tempUploadsBucket: process.env.TEMP_UPLOADS_BUCKET?.trim() || "temp-uploads",
};
