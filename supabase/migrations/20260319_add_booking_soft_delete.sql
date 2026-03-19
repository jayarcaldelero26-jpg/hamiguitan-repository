alter table public.bookings
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by int8;

create index if not exists bookings_deleted_at_idx
  on public.bookings (deleted_at);
