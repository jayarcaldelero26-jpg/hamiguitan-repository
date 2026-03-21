function requirePublicValue(name: string, value: string | undefined) {
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}. Supabase public clients require NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.`
    );
  }

  return value.trim();
}

function requireSupabaseUrl(name: string, value: string | undefined) {
  const url = requirePublicValue(name, value);

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      `Invalid ${name}: expected a full Supabase project URL like https://<project-ref>.supabase.co, received "${url}".`
    );
  }

  const hostname = parsed.hostname.toLowerCase();
  const isSupabaseHosted = /^[a-z0-9-]+\.supabase\.(co|in)$/.test(hostname);
  const isLocalDev = hostname === "localhost" || hostname === "127.0.0.1";

  if (!isSupabaseHosted && !isLocalDev) {
    throw new Error(
      `Invalid ${name}: expected your Supabase project host like https://<project-ref>.supabase.co, received "${url}".`
    );
  }

  return url;
}

export const publicEnv = {
  supabaseUrl: requireSupabaseUrl(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ),
  supabaseAnonKey: requirePublicValue(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
};
