-- The sidebar no longer loads every note with its full body. It loads one page of short note summaries,
-- the number of notes per collection, and the tags that are on at least one note.
-- Adding a tag to a note becomes one database call instead of several.

-- 1. The start of the body, for the sidebar's one-line preview, so the list doesn't need the full body.
--    The column is generated, so Postgres keeps it up to date whenever the body changes.
alter table public.notes
  add column body_preview text generated always as (left(body, 200)) stored;

-- 2. The sidebar shows the most recently edited notes first, one page at a time.
--    This index matches that order, so a page reads only its own rows instead of sorting every note.
--    It starts with user_id, so it also covers lookups by owner and replaces notes_user_id_idx.
create index notes_user_id_updated_at_idx
  on public.notes (user_id, updated_at desc, id desc);
drop index public.notes_user_id_idx;

-- 3. How many notes are in each collection (collection_id null: not in a collection).
--    security_invoker makes the view apply the row-level security of public.notes,
--    so each user only counts their own notes.
create view public.note_counts
  with (security_invoker = true)
  as
  select collection_id, count(*)::int as note_count
  from public.notes
  group by collection_id;

revoke all on public.note_counts from anon, authenticated;
grant select on public.note_counts to authenticated;

-- 4. Adds a tag to a note: reuses the user's tag with this name (ignoring case and spaces at either end)
--    or creates it, then links it. Adding a tag the note already has does nothing.
--    The lookup uses tags_user_id_name_unique_idx. security invoker keeps row-level security in force.
create function public.add_tag_to_note(p_note_id bigint, p_tag_name text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_tag_id bigint;
begin
  -- Check the note first, so a note that was deleted (or isn't the user's) doesn't leave a new, unused tag behind.
  perform 1 from public.notes where id = p_note_id;
  if not found then
    raise exception 'This note no longer exists.' using errcode = 'P0002';
  end if;

  insert into public.tags (name)
  values (btrim(p_tag_name))
  on conflict (user_id, lower(btrim(name))) do nothing
  returning id into v_tag_id;

  -- The tag already exists (or was just created from another tab): use that one.
  if v_tag_id is null then
    select id into v_tag_id
    from public.tags
    where user_id = (select auth.uid())
      and lower(btrim(name)) = lower(btrim(p_tag_name));
  end if;

  insert into public.note_tags (note_id, tag_id)
  values (p_note_id, v_tag_id)
  on conflict do nothing;
end;
$$;

-- Postgres lets everyone run a new function by default. Only signed-in users may run this one.
revoke execute on function public.add_tag_to_note(bigint, text) from public, anon;
grant execute on function public.add_tag_to_note(bigint, text) to authenticated;
