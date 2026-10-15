-- Anyone (signed in or not) can read notes. Creating, editing and deleting stay blocked.
grant select on public.notes to anon, authenticated;

create policy "Anyone can read notes"
  on public.notes for select
  to anon, authenticated
  using (true);
