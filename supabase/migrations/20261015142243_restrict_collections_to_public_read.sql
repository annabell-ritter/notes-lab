-- Match notes: anyone (signed in or not) can read collections. Creating, editing and deleting stay blocked.
-- Revoking everything first also removes the default truncate, references and trigger privileges.
revoke all on public.collections from anon, authenticated;

grant select on public.collections to anon, authenticated;

drop policy "Anyone can create collections" on public.collections;
drop policy "Anyone can delete collections" on public.collections;
