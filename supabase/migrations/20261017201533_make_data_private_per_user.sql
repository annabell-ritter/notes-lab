-- Every note, collection and tag now belongs to exactly one user, and each user can only see and change their own.
-- This replaces the temporary "anyone can ..." access, which let signed-out visitors read and change everything.

-- 1. Owner columns. New rows get the signed-in user as owner automatically.
--    note_tags gets one too, so the database itself can check that a note and a tag
--    being linked belong to the same user (see step 4).
alter table public.notes add column user_id uuid default auth.uid();
alter table public.collections add column user_id uuid default auth.uid();
alter table public.tags add column user_id uuid default auth.uid();
alter table public.note_tags add column user_id uuid default auth.uid();

-- 2. The existing rows were created before there were accounts. They go to the only user
--    who exists. If there is not exactly one user, stop rather than guess.
do $$
declare
  user_count int;
  owner_id uuid;
begin
  if exists (select 1 from public.notes)
     or exists (select 1 from public.collections)
     or exists (select 1 from public.tags) then
    select count(*) into user_count from auth.users;
    if user_count <> 1 then
      raise exception 'Expected exactly one user to own the existing data, found %', user_count;
    end if;

    select id into owner_id from auth.users;
    update public.notes set user_id = owner_id;
    update public.collections set user_id = owner_id;
    update public.tags set user_id = owner_id;
  end if;

  update public.note_tags as nt
  set user_id = n.user_id
  from public.notes as n
  where n.id = nt.note_id;
end;
$$;

alter table public.notes alter column user_id set not null;
alter table public.collections alter column user_id set not null;
alter table public.tags alter column user_id set not null;
alter table public.note_tags alter column user_id set not null;

-- Deleting a user account deletes their data. note_tags rows go with their note.
alter table public.notes
  add constraint notes_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;
alter table public.collections
  add constraint collections_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;
alter table public.tags
  add constraint tags_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

-- 3. A note can only be in one of its owner's own collections.
--    (id, user_id) is unique anyway because id is; the constraint lets other tables reference the pair.
alter table public.collections
  add constraint collections_id_user_id_key unique (id, user_id);

alter table public.notes drop constraint notes_collection_id_fkey;
alter table public.notes
  add constraint notes_collection_id_fkey
  foreign key (collection_id, user_id) references public.collections (id, user_id)
  on delete set null (collection_id);

-- 4. A note can only be linked to a tag of the same owner.
--    note_tags.user_id has to match both the note's owner and the tag's owner.
alter table public.notes
  add constraint notes_id_user_id_key unique (id, user_id);
alter table public.tags
  add constraint tags_id_user_id_key unique (id, user_id);

alter table public.note_tags drop constraint note_tags_note_id_fkey;
alter table public.note_tags drop constraint note_tags_tag_id_fkey;
alter table public.note_tags
  add constraint note_tags_note_id_fkey
  foreign key (note_id, user_id) references public.notes (id, user_id)
  on delete cascade;
alter table public.note_tags
  add constraint note_tags_tag_id_fkey
  foreign key (tag_id, user_id) references public.tags (id, user_id)
  on delete cascade;

-- 5. Names are unique per user, not across everyone: two users can both have a "Work" tag
--    or collection, but one user can't have it twice (still ignoring case and spaces at either end).
alter table public.tags drop constraint tags_name_key;
drop index public.tags_name_unique_idx;
create unique index tags_user_id_name_unique_idx
  on public.tags (user_id, lower(btrim(name)));

drop index public.collections_name_unique_idx;
create unique index collections_user_id_name_unique_idx
  on public.collections (user_id, lower(btrim(name)));

-- 6. Indexes for the ownership checks. The unique indexes above already start with user_id
--    for collections and tags; notes and note_tags need their own.
create index notes_user_id_idx on public.notes (user_id);
create index note_tags_user_id_idx on public.note_tags (user_id);

-- 7. Remove the temporary open access.
drop policy "Anyone can read notes" on public.notes;
drop policy "Anyone can create notes" on public.notes;
drop policy "Anyone can edit notes" on public.notes;
drop policy "Anyone can delete notes" on public.notes;

drop policy "Anyone can read collections" on public.collections;
drop policy "Anyone can create collections" on public.collections;
drop policy "Anyone can rename collections" on public.collections;
drop policy "Anyone can delete collections" on public.collections;

drop policy "Anyone can read tags" on public.tags;
drop policy "Anyone can create tags" on public.tags;

drop policy "Anyone can read note tags" on public.note_tags;
drop policy "Anyone can add tags to notes" on public.note_tags;
drop policy "Anyone can remove tags from notes" on public.note_tags;

-- Signed-out visitors (anon) get no access at all. Signed-in users only get what the app uses:
-- tags are never renamed or deleted in the app, and links are only added or removed.
revoke all on public.notes, public.collections, public.tags, public.note_tags from anon, authenticated;

grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.collections to authenticated;
grant select, insert on public.tags to authenticated;
grant select, insert, delete on public.note_tags to authenticated;

-- 8. Row-level security: every row is visible and changeable only by its owner.
--    Updates check the owner before and after, so a row can't be handed to another user.
--    (select auth.uid()) is evaluated once per query instead of once per row.
alter table public.notes enable row level security;
alter table public.collections enable row level security;
alter table public.tags enable row level security;
alter table public.note_tags enable row level security;

create policy "Users can read their own notes"
  on public.notes for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own notes"
  on public.notes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can edit their own notes"
  on public.notes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own collections"
  on public.collections for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own collections"
  on public.collections for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can rename their own collections"
  on public.collections for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own collections"
  on public.collections for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own tags"
  on public.tags for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own tags"
  on public.tags for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- The foreign keys in step 4 make sure the note and the tag both belong to this same user.
create policy "Users can read their own note tags"
  on public.note_tags for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can link their own notes and tags"
  on public.note_tags for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can unlink their own notes and tags"
  on public.note_tags for delete
  to authenticated
  using ((select auth.uid()) = user_id);
