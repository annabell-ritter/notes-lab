create table public.notes (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) > 0),
  body text,
  created_at timestamptz not null default now()
);

-- Locked down until access rules are decided: RLS on with no policies, and no Data API access.
alter table public.notes enable row level security;

revoke all on public.notes from anon, authenticated;
