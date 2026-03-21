import "server-only";

import { createHash } from "crypto";

type SignatureParams = Record<string, string | number | boolean | undefined | null>;

function requireCloudinaryEnv(name: string) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

export function getCloudinaryConfig() {
  return {
    cloudName: requireCloudinaryEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: requireCloudinaryEnv("CLOUDINARY_API_KEY"),
    apiSecret: requireCloudinaryEnv("CLOUDINARY_API_SECRET"),
    organizationalChartFolder:
      process.env.CLOUDINARY_ORG_CHART_FOLDER?.trim() || "organizational-chart",
  };
}

function buildSignaturePayload(params: SignatureParams) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

export function signCloudinaryParams(params: SignatureParams) {
  const { apiSecret } = getCloudinaryConfig();
  const payload = buildSignaturePayload(params);
  return createHash("sha1")
    .update(`${payload}${apiSecret}`)
    .digest("hex");
}

export function getOrganizationalChartCloudinaryFolder(
  section: string,
  assetKind: "attachments" | "photos" = "attachments"
) {
  return `${getCloudinaryConfig().organizationalChartFolder}/${section}/${assetKind}`;
}

export function getCloudinaryUploadUrl(resourceType: "raw" | "image" | "video" = "raw") {
  return `https://api.cloudinary.com/v1_1/${getCloudinaryConfig().cloudName}/${resourceType}/upload`;
}

export function getCloudinaryDestroyUrl(resourceType: "raw" | "image" | "video" = "raw") {
  return `https://api.cloudinary.com/v1_1/${getCloudinaryConfig().cloudName}/${resourceType}/destroy`;
}
