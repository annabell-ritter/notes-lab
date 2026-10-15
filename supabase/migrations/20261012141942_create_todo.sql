create table public.todo (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 500),
  is_complete boolean not null default false,
  created_at timestamptz not null default now()
);

create index todo_user_id_idx on public.todo (user_id);

alter table public.todo enable row level security;

create policy "Users can view their own todos"
  on public.todo for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own todos"
  on public.todo for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own todos"
  on public.todo for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own todos"
  on public.todo for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Expose the table to signed-in users through the Data API; RLS limits them to their own rows.
grant select, insert, update, delete on public.todo to authenticated;
