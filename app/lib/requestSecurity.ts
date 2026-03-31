import "server-only";

export class InvalidOriginError extends Error {
  constructor(message = "Invalid request origin.") {
    super(message);
    this.name = "InvalidOriginError";
  }
}

function getRequestOrigin(req: Request) {
  const origin = String(req.headers.get("origin") || "").trim();
  if (origin) return origin;

  const referer = String(req.headers.get("referer") || "").trim();
  if (!referer) return "";

  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
}

function getExpectedOrigin(req: Request) {
  const host = String(
    req.headers.get("x-forwarded-host") || req.headers.get("host") || ""
  ).trim();

  if (!host) {
    throw new InvalidOriginError("Missing request host.");
  }

  const forwardedProto = String(req.headers.get("x-forwarded-proto") || "").trim();
  const protocol =
    forwardedProto || (process.env.NODE_ENV === "production" ? "https" : "http");

  return `${protocol}://${host}`;
}

export function assertTrustedOrigin(req: Request) {
  const requestOrigin = getRequestOrigin(req);
  if (!requestOrigin) {
    throw new InvalidOriginError("Missing request origin.");
  }

  const expectedOrigin = getExpectedOrigin(req);
  if (requestOrigin !== expectedOrigin) {
    throw new InvalidOriginError("Origin does not match host.");
  }
}

export function isInvalidOriginError(error: unknown) {
  return error instanceof InvalidOriginError;
}
