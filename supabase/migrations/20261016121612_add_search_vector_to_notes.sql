-- Full text search over a note's title and body together.
-- The column is generated, so Postgres keeps it up to date whenever the title or body changes.
-- It holds the words twice:
--   'english' reduces words to their base form, so "meetings" also matches "meeting".
--   'simple' keeps the words as written, so a word that is still being typed ("meetin") matches "meeting" as a prefix.
--     With 'english' alone this fails, because "meeting" is stored as "meet".
alter table public.notes
  add column search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
    || to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored;

-- GIN index so searching doesn't have to read every note.
create index notes_search_vector_idx on public.notes using gin (search_vector);
