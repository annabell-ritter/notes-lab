@AGENTS.md

# Notes Lab

A notes app with collections, tags and search, backed by Supabase. The full requirements are in `PROJECT_BRIEF.md`. Read it before starting a feature.

## Commands

- `npm run dev`: run the app locally (the app is not deployed)

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI components in `components/ui/`
- Supabase through `@supabase/ssr` / `supabase-js`. The clients are in `lib/supabase/`: `server.ts` for Server Components and Server Actions, `client.ts` for the browser.
- The project started from the Supabase Next.js starter. The auth pages and components (`app/protected/`, `components/*-form.tsx`, tutorial components) are leftovers. Login is out of scope for now, so don't build on them or remove them unless asked.
- `proxy.ts` → `lib/supabase/proxy.ts` redirects signed-out users to `/login`. Any new public route (such as `/notes`) has to be added to the exceptions there.

## Rules

### Data access
- All data reads and writes go through `lib/db.ts`. Components, pages and Server Actions never import the Supabase client and never call `.from()` or `.rpc()` directly.
- A new kind of database action means a new function in `db.ts`, such as `getNotes`, `assignNoteToCollection` or `addTagToNote`.
- `app/notes/page.tsx` currently queries Supabase directly. Move that query into `db.ts`.

### Database
- Change the schema only through new migration files in `supabase/migrations/`, created with the Supabase CLI (`npx supabase migration new <name>`, `npx supabase db push`).
- Never edit or delete a migration that has already been applied. Never drop or recreate `public.notes`, and keep its existing rows. Add what's missing with `alter table`.
- Do **not** use the Supabase MCP server.
- Every table has RLS enabled. There are no user accounts yet, so a table the app reads or writes needs explicit grants and policies for `anon`. At the moment `notes` only allows public reads.
- Load the `supabase` and `supabase-postgres-best-practices` skills before any schema or query work.

### Behaviour rules
- **Tag filter** uses AND logic. A note must have every selected tag.
- **Search** covers all notes (title and body), ignores the open collection, and respects the active tag filter. Use one function that applies search and tags together. Debounce the input.
- **Empty states:** always show a clear message, never a blank screen: empty collection, no search results, no tags matching, no notes at all.

## Workflow

- The database structure is set up directly on `main` before any feature work. After that, build one feature per branch with one pull request per branch, in the order given in `PROJECT_BRIEF.md`. Don't commit features to `main` directly.
- Each pull request is reviewed before merging. Running `/comprehensive-review:full-review` or `/code-review` on the branch is optional: mention them as an option before merging, but don't run them or treat them as required unless asked.
- Commit messages describe the change in plain words, such as "Add collections table and link notes to it". Never use "updates", "stuff" or similar.
- Never commit `.env.local` or secrets.
