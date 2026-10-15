# Project brief: Notes app with collections, tags and search

## Goal

A notes app that stores all its data in Supabase, so notes stay available across devices. Notes can be grouped into collections, labelled with tags, and searched. The app runs locally with `npm run dev`. It is not deployed.

## Tools

- Next.js (App Router), TypeScript, Tailwind CSS
- Supabase, used through the `supabase-js` client
- Do **not** use the Supabase MCP server. That comes later in the sprint.

## Out of scope for now

- Login and user accounts (later in the sprint)
- Deployment and a live URL (later in the sprint)

## How the data fits together

- A note has a title, a body, a created time and an updated time. The updated time refreshes whenever the note changes.
- A note can belong to one collection, or to none.
- A collection has a name and a created time. A collection can contain many notes.
- Deleting a collection keeps its notes. They simply become uncollected.
- A note can have many tags, and a tag can be on many notes.
- The same tag cannot be added to the same note twice.
- Tag names are unique.
- Deleting a note removes its links to tags. Deleting a tag removes its links to notes.
- Notes must be searchable by title and body together.

**Decision on the existing notes table:**
> Build on the existing notes table and add what is missing. Do not drop or recreate it, and keep the notes already stored in it. Check what the table already has against the data description above, then add only the missing pieces as a new change to the database structure.

## How the code is organised

Keep all database reading and writing in one central place. Pages and components never talk to the database themselves. They ask that central place for what they need. Whenever a feature needs a new kind of database action, add a new function there.

## What the app must do

1. All reading and writing of data goes through the central place described above.
2. Notes, collections, tags and the links between notes and tags are stored in Supabase as described in the data section.
3. **Notes:** the user can create, view, edit and delete notes.
4. **Sidebar:** collections are shown as groups the user can expand. Selecting a collection expands it and shows its notes. Notes without a collection appear in an "Uncollected" group.
5. **New collection:** a control in the sidebar asks the user for a name and adds the collection immediately.
6. **Assigning a collection:** when viewing a note, the user can choose a collection from a dropdown. The change is saved in the database. The user can also choose "no collection".
7. **Tags on a note:** when viewing a note, the user can add and remove tags. Tags are shown on the note card in the sidebar.
8. **Tag filter:** the sidebar has a tag filter. When one or more tags are selected, only notes that have **all** selected tags are shown.
9. **Search:** a search input at the top of the workspace searches titles and body text across all notes, regardless of which collection is open. Results update as the user types. Any active tag filter still applies to the results.
10. **Clear messages instead of blank screens** for each of these cases:
   - a collection is empty
   - a search finds nothing
   - no notes match the selected tags
   - there are no notes at all

## How we work

- Build one part at a time.
- First, set up the database structure (all tables, links and permissions described in the data section) directly on `main`.
- After that, one feature per branch, and one pull request per branch. Each pull request is reviewed before merging.
- Planned feature branches, in order:
  1. app shell and notes CRUD (this branch also creates the central place for data access)
  2. collections interface
  3. tag system
  4. search
  5. optional task
- Commit messages describe the change in plain words. Never "updates" or "stuff".
- Follow the rules in `CLAUDE.md`.
