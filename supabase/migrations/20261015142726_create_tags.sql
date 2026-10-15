-- Tag names are unique.
create table public.tags (
  id bigint generated always as identity primary key,
  name text not null unique check (char_length(name) > 0)
);

-- Match notes and collections: anyone (signed in or not) can read tags. Creating, editing and deleting stay blocked.
-- Revoking everything first also removes the default truncate, references and trigger privileges.
alter table public.tags enable row level security;

revoke all on public.tags from anon, authenticated;

grant select on public.tags to anon, authenticated;

create policy "Anyone can read tags"
  on public.tags for select
  to anon, authenticated
  using (true);
