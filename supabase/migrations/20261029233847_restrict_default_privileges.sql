-- Default privileges decide what a new table or function grants before any migration says so.
-- Existing tables and functions keep their grants; this only changes what new ones start with.

-- New tables in public gave anon and authenticated TRUNCATE, REFERENCES, TRIGGER and MAINTAIN.
-- TRUNCATE ignores RLS. Every migration revokes these by hand; this stops them being granted at all.
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain on tables from anon, authenticated;

-- Postgres lets everyone (PUBLIC) run a new function, so a new function in public was callable
-- through the Data API by anon. That is how public.rls_auto_enable() was exposed: the dashboard setting
-- that creates it could do the same again if it is turned off and on. New functions now need an
-- explicit grant, such as grant execute on function ... to authenticated.
alter default privileges for role postgres revoke execute on functions from public;
