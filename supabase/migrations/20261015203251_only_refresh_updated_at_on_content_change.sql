-- updated_at should mean "the note's content last changed".
-- Before: the trigger fired on every update, so moving a note to another collection
-- (or deleting its collection, which sets collection_id to null) counted as an edit
-- and moved the note to the top of the sidebar.
-- Now: it only fires when the title or body actually changes.
drop trigger notes_set_updated_at on public.notes;

create trigger notes_set_updated_at
  before update of title, body on public.notes
  for each row
  when (old.title is distinct from new.title or old.body is distinct from new.body)
  execute function public.set_updated_at();
