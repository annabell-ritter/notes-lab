-- No user accounts yet: anyone (signed in or not) can create tags and add or remove them on notes.
-- Reading is already allowed by "Anyone can read tags" and "Anyone can read note tags".
-- Tags are never renamed or deleted from the app, so update and delete on tags stay blocked.
-- The same tag can't be added to a note twice: the note_tags primary key (note_id, tag_id) already enforces this.
grant insert on public.tags to anon, authenticated;

create policy "Anyone can create tags"
  on public.tags for insert
  to anon, authenticated
  with check (true);

grant insert, delete on public.note_tags to anon, authenticated;

create policy "Anyone can add tags to notes"
  on public.note_tags for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can remove tags from notes"
  on public.note_tags for delete
  to anon, authenticated
  using (true);

-- Like collection names, tag names are unique ignoring case and spaces at either end
-- ("Work", "work" and " Work " are the same tag). A duplicate insert fails with error code 23505.
create unique index tags_name_unique_idx
  on public.tags (lower(btrim(name)));
