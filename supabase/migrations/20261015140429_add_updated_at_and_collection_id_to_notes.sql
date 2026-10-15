-- updated_at: when the note last changed. Existing notes start at their created time.
alter table public.notes
  add column updated_at timestamptz not null default now();

update public.notes set updated_at = created_at;

-- Refresh updated_at on every change to a note.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.set_updated_at();

-- collection_id: the collection a note belongs to, or null for none.
-- The foreign key to collections is added once that table exists.
alter table public.notes
  add column collection_id bigint;
