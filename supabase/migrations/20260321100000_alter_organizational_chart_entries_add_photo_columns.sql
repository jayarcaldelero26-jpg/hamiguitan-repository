alter table public.organizational_chart_entries
  add column if not exists photo_public_id text,
  add column if not exists photo_url text,
  add column if not exists photo_original_name text,
  add column if not exists photo_width integer,
  add column if not exists photo_height integer,
  add column if not exists photo_format text,
  add column if not exists photo_uploaded_at timestamptz;
