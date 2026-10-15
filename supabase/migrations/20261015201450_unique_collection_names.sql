-- Collection names are unique, ignoring case and spaces at either end ("Work", "work" and " Work " count as the same name).
-- A unique index on an expression enforces this; a duplicate insert or rename fails with error code 23505.
create unique index collections_name_unique_idx
  on public.collections (lower(btrim(name)));
