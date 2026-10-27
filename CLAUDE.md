@AGENTS.md

# Notes Lab

A notes app with collections, tags and search, backed by Supabase. The full requirements are in `PROJECT_BRIEF.md`. Read it before starting a feature.

## Commands

- `npm run dev`: run the app locally (the app is not deployed)

## Stack

- Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI components in `components/ui/`
- Supabase through `@supabase/ssr` / `supabase-js`. The clients are in `lib/supabase/`: `server.ts` for Server Components, Server Actions and Route Handlers, `client.ts` for the browser. The app itself only uses the server client; `client.ts` is not imported anywhere.
- Sign-in lives in `app/(auth)/` (`/login`, `/signup`, `/forgot-password`, and their Server Actions in `actions.ts`), with all Supabase Auth calls in `lib/auth.ts`. The set-new-password page is `app/reset-password/`. The private area is `app/workspace/`.
- The project started from the Supabase Next.js starter. These parts are leftovers: `app/auth/error/page.tsx` and the tutorial components. `app/auth/confirm/route.ts` is used by the sign-up confirmation email. Don't build on the leftovers or remove them unless asked.
- `proxy.ts` → `lib/supabase/proxy.ts` refreshes the session and sends signed-out visitors to `/login` from every route except `/`, `/login`, `/signup`, `/forgot-password`, `/auth/confirm` and `/auth/error`. A new public route has to be added to those exceptions. The proxy is only a first gate: every private page and Server Action still checks the user itself (see Authentication).

## Rules

### Data access
- All data reads and writes go through `lib/db.ts`. Components, pages and Server Actions never import the Supabase client and never call `.from()` or `.rpc()` directly.
- A new kind of database action means a new function in `db.ts`, such as `getNotes`, `assignNoteToCollection` or `addTagToNote`.
- All Supabase Auth calls go through `lib/auth.ts` (`getCurrentUser`, `requireUser`, `requireRecoverySession`, `signIn`, `signUp`, `signOut`, `confirmEmail`, `requestPasswordReset`, `updatePassword`), the same way data goes through `db.ts`.

### Database
- Change the schema only through new migration files in `supabase/migrations/`, created with the Supabase CLI (`npx supabase migration new <name>`, `npx supabase db push`).
- Never edit or delete a migration that has already been applied. Never drop or recreate `public.notes`, and keep its existing rows. Add what's missing with `alter table`.
- Do **not** use the Supabase MCP server.
- Load the `supabase` and `supabase-postgres-best-practices` skills before any schema or query work.
- **Every row belongs to one user.** Each table has a `user_id uuid not null default auth.uid()` that references `auth.users (id) on delete cascade` and is indexed. New rows get the signed-in user as owner through that default.
- **RLS is enabled on every table.** `anon` (signed-out visitors) has no grants and no policies on any table. Policies are `to authenticated` and use `(select auth.uid()) = user_id`. Update policies have both `using` and `with check`, so a row can't be handed to another user. Grant `authenticated` only the operations the app uses.
- **Links between a user's rows** use two-column foreign keys on `(id, user_id)`, so both sides must have the same owner (a note's collection, a note's tags). A link table's primary key must include those foreign-key columns (`note_tags` uses `(note_id, tag_id, user_id)`). Otherwise the Data API can't load notes with their tags.
- **Unique names are unique per user** (tags, collections): different users can use the same name, but one user can't use it twice.

### Behaviour rules
- **Tag filter** uses AND logic. A note must have every selected tag.
- **Search** covers all of the signed-in user's notes (title and body), ignores the open collection, and respects the active tag filter. Use one function that applies search and tags together. Debounce the input.
- **Empty states:** always show a clear message, never a blank screen: empty collection, no search results, no tags matching, no notes at all.

### Authentication
- Use Supabase Auth for all sign-in and session handling. Never build custom auth or store passwords yourself.
- Every page under `/workspace` requires a signed-in user. Check this on the server with `requireUser()` from `lib/auth.ts`, which redirects signed-out visitors to `/login`. Every private page and every Server Action calls it. Don't rely on the proxy alone.
- `requireUser()` verifies the session with `getClaims()`. Never trust the cookie as it is, and never use `getSession()` for this check.
- After sign-in, redirect to `/workspace`. Signed-in users who open `/login` or `/signup` are also sent to `/workspace`.
- The sign-up confirmation email links to `/auth/confirm`, which signs the user in and opens `/workspace`.
- Password reset: `/forgot-password` sends the email through `requestPasswordReset()`, with the link built from `SITE_URL`. It opens `/auth/confirm`, then `/reset-password`. Only a session from a reset link opened in the last 15 minutes may set a new password (`requireRecoverySession()`). A normal session can't. After the change, the user's other sessions are signed out.
- After sign-out, redirect to `/login`.
- Never keep user data in the browser's local or session storage. The session lives in cookies that the server checks.
- A UI preference such as the theme may be kept in local storage; notes, tags, collections and account data may not.
- The old `/notes` URLs forward to `/workspace` (redirects in `next.config.ts`).

## Workflow

- The database structure is set up directly on `main` before any feature work. After that, build one feature per branch with one pull request per branch, in the order given in `PROJECT_BRIEF.md`. Don't commit features to `main` directly.
- Each pull request is reviewed before merging. Running `/comprehensive-review:full-review` or `/code-review` on the branch is optional: mention them as an option before merging, but don't run them or treat them as required unless asked.
- Commit messages follow Conventional Commits, with a description in plain words, such as `feat(collections): add collections table and link notes to it` or `docs: add authentication rules to CLAUDE.md`. Never use "updates", "stuff" or similar.
- Never commit `.env.local` or secrets.
