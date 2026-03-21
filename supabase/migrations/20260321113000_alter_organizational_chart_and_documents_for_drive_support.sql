alter table public.organizational_chart_entries
  add column if not exists attachment_drive_file_id text,
  add column if not exists attachment_uploaded_at timestamptz,
  add column if not exists attachment_type text;

alter table public.documents
  add column if not exists source_module text,
  add column if not exists source_record_type text,
  add column if not exists source_record_id bigint,
  add column if not exists source_section text;

create index if not exists documents_source_module_record_idx
  on public.documents (source_module, source_record_id);
