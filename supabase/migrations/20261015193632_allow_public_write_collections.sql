-- No user accounts yet: anyone (signed in or not) can create, rename and delete collections.
-- Reading is already allowed by "Anyone can read collections".
-- Deleting a collection keeps its notes: notes.collection_id is set to null by the foreign key (on delete set null).
-- Moving a note between collections only updates notes.collection_id, which "Anyone can edit notes" already allows.
grant insert, update, delete on public.collections to anon, authenticated;

create policy "Anyone can create collections"
  on public.collections for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can rename collections"
  on public.collections for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Anyone can delete collections"
  on public.collections for delete
  to anon, authenticated
  using (true);
