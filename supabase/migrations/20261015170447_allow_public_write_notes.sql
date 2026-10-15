-- No user accounts yet: anyone (signed in or not) can create, edit and delete notes.
-- Reading is already allowed by "Anyone can read notes".
grant insert, update, delete on public.notes to anon, authenticated;

create policy "Anyone can create notes"
  on public.notes for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can edit notes"
  on public.notes for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Anyone can delete notes"
  on public.notes for delete
  to anon, authenticated
  using (true);
