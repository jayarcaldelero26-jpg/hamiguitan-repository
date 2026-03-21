alter table public.organizational_chart_entries
  add column if not exists attachment_url text,
  add column if not exists attachment_mime_type text;
