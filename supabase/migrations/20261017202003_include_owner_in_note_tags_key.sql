-- The Data API only treats note_tags as the link between notes and tags (so notes can be loaded
-- with their tags) when the link's foreign keys are part of note_tags' primary key.
-- Since the previous migration, those foreign keys are (note_id, user_id) and (tag_id, user_id),
-- so user_id joins the primary key.
--
-- This doesn't loosen the "same tag only once per note" rule: a note has exactly one owner,
-- so for a given note_id there is only one possible user_id, and (note_id, tag_id) stays unique.
alter table public.note_tags drop constraint note_tags_pkey;
alter table public.note_tags add primary key (note_id, tag_id, user_id);
