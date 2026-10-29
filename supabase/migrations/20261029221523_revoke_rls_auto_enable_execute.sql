-- public.rls_auto_enable() comes from the Supabase setting that turns on row-level security for every
-- new table in public. It was created in the dashboard, not in a migration, and it runs as SECURITY DEFINER.
-- Postgres lets everyone run a new function by default, so the Data API offered it at /rest/v1/rpc/rls_auto_enable.
-- A direct call fails (it only works as an event trigger), but nobody needs to call it through the API.
-- The ensure_rls event trigger still runs it whenever a table is created: event triggers don't check EXECUTE.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
