create table public.collections (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) > 0),
  created_at timestamptz not null default now()
);

-- Link notes to collections. Deleting a collection keeps its notes; they become uncollected.
alter table public.notes
  add constraint notes_collection_id_fkey
  foreign key (collection_id) references public.collections (id)
  on delete set null;

-- Postgres doesn't index foreign key columns automatically. This keeps loading a collection's notes fast.
create index notes_collection_id_idx on public.notes (collection_id);

-- No user accounts yet: anyone can read, create and delete collections.
alter table public.collections enable row level security;

grant select, insert, delete on public.collections to anon, authenticated;

create policy "Anyone can read collections"
  on public.collections for select
  to anon, authenticated
  using (true);

create policy "Anyone can create collections"
  on public.collections for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can delete collections"
  on public.collections for delete
  to anon, authenticated
  using (true);
