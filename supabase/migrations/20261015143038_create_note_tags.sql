-- Links notes and tags. The primary key stops the same tag being added to the same note twice.
-- Deleting a note or a tag removes its links.
create table public.note_tags (
  note_id bigint not null references public.notes (id) on delete cascade,
  tag_id bigint not null references public.tags (id) on delete cascade,
  primary key (note_id, tag_id)
);

-- The primary key covers lookups by note_id. This index covers lookups by tag_id, used by the tag filter.
create index note_tags_tag_id_idx on public.note_tags (tag_id);

-- Match the other tables: anyone (signed in or not) can read links. Creating and deleting stay blocked.
-- Revoking everything first also removes the default truncate, references and trigger privileges.
alter table public.note_tags enable row level security;

revoke all on public.note_tags from anon, authenticated;

grant select on public.note_tags to anon, authenticated;

create policy "Anyone can read note tags"
  on public.note_tags for select
  to anon, authenticated
  using (true);
