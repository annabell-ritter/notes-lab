-- Like notes, collections and tags, note_tags.user_id now references auth.users directly.
-- Before, it was only tied to an account through the (note_id, user_id) and (tag_id, user_id)
-- foreign keys. That already kept it valid, but the direct link matches the rule for every
-- table and keeps holding if those foreign keys ever change.
-- No rows change. The index on note_tags.user_id already exists (note_tags_user_id_idx).
alter table public.note_tags
  add constraint note_tags_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;
