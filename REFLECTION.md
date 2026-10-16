# Reflection

## PR #1: App shell and notes CRUD

**Command:** `/comprehensive-review:full-review` (wshobson `comprehensive-review` plugin), run on the branch `app-shell-and-notes-CRUD` compared to `main`. Phases 1–2 (code quality, architecture, security, performance) were completed.

**Finding: double-clicking "New note" creates duplicate notes (Medium)**

The "New note" button in the sidebar (`app/notes/layout.tsx`) and the "Delete" button in the editor (`app/notes/[id]/note-editor.tsx`) don't show that they are busy, and they stay clickable while the request is running. Next.js queues Server Actions one after another instead of dropping repeated ones, so a quick double click, or a second click on a slow connection, runs `createNoteAction` twice. That inserts two "Untitled note" rows: the user lands on the second one, and the first is left behind in the list. A double click on "Delete" runs the delete twice, which is harmless but wastes a request.

The "Save" button doesn't have this problem, because it's disabled while saving (`pending` from `useActionState`).

The finding came up in three of the four review areas: code quality, architecture context, and performance.

**Why it matters:** the project brief is about notes reliably saving and loading. Silent duplicates make the list untidy, and users can't tell which note is the real one.

**Fix (on the same branch):** a small client `SubmitButton` (`components/submit-button.tsx`) uses `useFormStatus` to disable itself while its form's action runs. While busy, it shows "Creating…" or "Deleting…". It replaces the plain buttons for "New note" and "Delete", so each click now creates or deletes exactly one note.

## Collections interface

**Review:** a manual review of the staged diff on the branch `collections-interface`, before the first commit. No third-party command was used.

**Finding 1: contradictory empty states when there are no notes (bug)**

When there were no notes at all, the sidebar showed "No notes yet. Create your first one with 'New note'". At the same time, the "Uncollected" group said "Every note is in a collection." Both messages can't be true, and the second one is misleading. The project rule asks for a clear message for every empty state.

**Fix:** the "Uncollected" group now says "No notes yet." when there are no notes. It only says "Every note is in a collection." when notes exist and all of them are in a collection (`app/notes/collection-groups.tsx`).

**Finding 2: hook order in the collection dropdown (readability)**

In `CollectionPicker` (`app/notes/[id]/note-editor.tsx`), `useTransition` was called after the block that syncs the dropdown with changes made elsewhere. It worked, but the hooks weren't grouped together at the top as usual.

**Fix:** moved `useTransition` up next to the other hooks. Behaviour is unchanged.

**Finding 3: two collections could have the same name**

Nothing stopped you from creating two collections called "Work". The sidebar then showed two identical groups, and the note's Collection dropdown listed "Work" twice, with no way to tell which was which. The brief only requires unique names for tags, so this wasn't covered at first.

**Fix:**
- A new migration (`20261015201450_unique_collection_names.sql`) adds a unique index on `lower(btrim(name))`. Names are now unique ignoring case and spaces at either end, so "Work", "work" and " Work " count as the same.
- Before adding it, I checked the existing collections for duplicates. There were none.
- `createCollection` and `renameCollection` in `lib/db.ts` turn the database's duplicate error (code `23505`) into a clear message: "A collection with this name already exists." The message is shown in the "New collection" form or the rename field.
- Renaming a collection to a different capitalisation of its own name (for example "work" → "Work") still works.

**Left as they are (small):** the two remaining points from this review were confirmed by `/code-review` and fixed below (Findings 4 and 6).

### `/code-review` on pull request #2

**Command:** `/code-review` (Claude Code's built-in review), run on the branch `collections-interface` after opening pull request #2. It reported 10 findings. One was a false positive: it said the data module should be `lib/data/`, but `CLAUDE.md` names `lib/db.ts`. Three were fixed on the branch:

**Finding 4: the rename field didn't get focus**

Choosing "Rename" in a collection's ⋯ menu replaces the menu button with the rename field. When the menu closed, it moved focus back to its button, which no longer existed. Focus ended up nowhere: typing did nothing and Escape didn't cancel until you clicked into the field.

**Fix:** the menu remembers that "Rename" was chosen and, in that case, doesn't move focus when it closes, so the field keeps its focus (`app/notes/collection-menu.tsx`). For "Delete" and for closing the menu without choosing anything, focus still goes back to the button as usual.

**Finding 5: moving a note counted as editing it**

The database trigger refreshed `updated_at` on every change to a note, including a change of `collection_id`. The sidebar sorts by `updated_at`, so moving an old note to another collection made it jump to the top as if it had just been edited. Deleting a collection did the same to all of its notes at once, because the database sets their `collection_id` to empty.

**Fix:** a new migration (`20261015203251_only_refresh_updated_at_on_content_change.sql`) recreates the trigger so it only fires when the title or body actually changes (`before update of title, body … when (old.title is distinct from new.title or old.body is distinct from new.body)`). Moving a note or deleting its collection no longer changes the note's `updated_at` or its position in the list. As a side effect, clicking Save without changing anything doesn't count as an edit either.

**Finding 6: an old error came back in the "New collection" form**

Cancel and Escape only hid the form. The last error (for example "A collection with this name already exists.") and the typed name stayed in memory and showed again the next time the form was opened, before anything was submitted.

**Fix:** the name field, its error and the form's state now live in a separate component that only exists while the form is open (`app/notes/new-collection-form.tsx`). Closing the form removes it, so it always opens empty and without an error.

**Not fixed (small):** technical database errors can still reach the screen in rare cases, for example when moving a note to a collection that was deleted in another tab. There's also one shared error slot for all collections in the sidebar, collections are loaded twice on a note page, the "No notes yet" message appears twice when there are no notes, and the dropdown can show "No collection" during a race with a deletion. Notes are also filtered once per group, which only matters with many notes.

## Tag system

### Approach for the tag filter ("all selected tags")

**The requirement:** when one or more tags are selected, the sidebar shows only the notes that have **all** of them (AND logic). Selecting no tags shows every note. The filter has to work together with the collection groups.

**Why the obvious Supabase filters don't work:**
- Tags aren't a column on `notes`. They live in the `note_tags` join table, one row per note and tag, so `.contains()` on a column isn't an option.
- `.in("note_tags.tag_id", [...])` keeps a note if it has *any* of the selected tags (OR logic), not all of them.
- The `!inner` join from the Supabase docs (`note_tags!inner(tag_id)` with `.eq("note_tags.tag_id", id)`) works for one tag. Adding a second `.eq()` on the same joined table doesn't mean "has both". Both conditions are checked against the same `note_tags` row, and one row only holds one tag, so nothing matches.

**What I chose: filter in the app, on notes that are already loaded**
- `getNotes()` in `lib/db.ts` already loads every note with its tags (`tags(id, name)`, which Supabase follows through `note_tags`), because the sidebar shows the tags on each note card anyway.
- `filterNotesByTags(notes, tagIds)` in `app/notes/tag-filter.tsx` keeps a note only if **every** selected tag id is among the note's tag ids (`[...tagIds].every(...)`). With no tags selected, it returns all notes.
- `CollectionGroups` (`app/notes/collection-groups.tsx`) runs the filter first and then splits the result into the collection groups as before. While a filter is active:
  - groups without a matching note are hidden
  - groups with matches open automatically
  - the counts only include matching notes
  - "No notes have all the selected tags." is shown if nothing matches

**Why this approach:**
- **Simple and correct.** The AND check is one line of plain code, easy to read and test, and doesn't depend on how Supabase combines filters.
- **No extra database calls.** The data is already loaded for the note cards, so selecting a tag updates the sidebar instantly.
- **Fits how the app is built.** The sidebar lives in the layout, and in Next.js a layout can't read the URL's search params. Filtering on the server would have needed a more complicated setup.
- **Still follows the `lib/db.ts` rule.** The filter doesn't talk to the database. It only works on data that `getNotes()` returned.
- **Ready for search.** `CLAUDE.md` asks for one function that applies search and tags together. `filterNotesByTags` is that single place, and the search branch can extend it.

**When this should change:** if there were thousands of notes, loading all of them would get slow. Then the filter should move into the database, as a function in `lib/db.ts` that calls a SQL function using `group by note_id having count(distinct tag_id) = <number of selected tags>`. That returns only notes linked to every selected tag. For a personal notes app, that isn't needed yet.

### Database changes

The `tags` and `note_tags` tables already existed and were not recreated. I checked the live database first:
- `tags.name` was already unique.
- The `note_tags` primary key `(note_id, tag_id)` already stops the same tag being added to a note twice.
- Both foreign keys already use `on delete cascade`.

Only write access was missing. The new migration (`20261016092235_allow_public_write_tags.sql`):
- lets `anon` create tags and add or remove tags on notes (renaming and deleting tags stay blocked)
- adds a unique index on `lower(btrim(name))`, so, like collection names, "Work" and "work" are the same tag

When you add a tag in the note view, `addTagToNote` reuses an existing tag with that name, ignoring case, or creates a new one.

## Search

### Approach

**The requirement:** a search input at the top of the workspace searches note titles and bodies across all notes, whichever collection is open. Results update while typing, with the input debounced. An active tag filter still applies (all selected tags), the collection groups keep working, and a clear message appears when nothing matches.

**Database:** `notes` had no search column. The migration `20261016121612_add_search_vector_to_notes.sql` adds `search_vector`, a generated `tsvector` column built from title and body together, plus a GIN index. Postgres keeps the column up to date whenever a note's title or body changes. The table and its rows were kept.

**Search and tags in one query:** `searchNoteIds(text, tagIds)` in `lib/db.ts` chains `textSearch` with the tag filter on the same supabase-js query:
- `.textSearch("search_vector", query, { config: "english" })` matches title and body.
- Each selected tag gets its own inner join on `note_tags`: `t0:note_tags!inner(tag_id)`, `t1:note_tags!inner(tag_id)`, and so on, filtered with `.eq("t0.tag_id", a)`, `.eq("t1.tag_id", b)`.
- A note is only returned if every join finds a row, so it must have **all** selected tags.
- As in the tag system section, a single join can't do this: one `note_tags` row only holds one tag.

I tested this against the real data, temporarily giving one note two tags and removing the extra link afterwards. With `review` + `planning` selected, only the note with both tags came back. Searching `milk` with both tags returned nothing.

**How this fits with the tag filter:** when the search box is empty, the sidebar keeps the instant tag filter from the tag system (`filterNotesByTags`, no database call). As soon as there is search text, the database applies search and tags together. I planned in the tag system section to extend `filterNotesByTags` for search, but full text search has to run in the database, so the combined search and tag filter lives in `searchNoteIds` instead.

### Partial words while typing

Full text search matches whole words by default. I compared three options on the text "Team meetings about the budget":

| Typed | `websearch` | English prefix (`:*`) | English + simple prefix |
|---|---|---|---|
| `budg` | no match | match | match |
| `meeti` / `meetin` | no match | no match | match |
| `meeting` / `meetings` | match | match | match |

- `websearch` (`type: "websearch"`) only matched finished words, so results disappeared while typing.
- A prefix query (`word:*`) with only `english` failed for `meetin`, because English stores "meeting" as its base form `meet`, and `meetin` is not a prefix of `meet`.

**What I chose:**
- The column holds the words twice: `to_tsvector('english', …)` for word forms ("meetings" matches "meeting") and `to_tsvector('simple', …)` for the words as written (so `meetin` matches "meeting").
- What the user types becomes a prefix query: `team meetin` → `team:* & meetin:*`. Every word must match, and the last one can still be unfinished.
- The query uses `textSearch` without a `type`, so it goes to `to_tsquery`, which supports `:*`. `websearch` doesn't support prefixes.
- Only letters and digits are taken from the input, so characters with a special meaning in a search query (`& | ! : ( )`) can't cause errors.

**Limit:** a search made up only of very common English words, such as `the`, finds nothing, because English search ignores them.

### App side

- **Shared state:** the search input sits in the workspace and the results show in the sidebar. A small provider in the layout, `NotesFilterProvider` in `app/notes/notes-filter-context.tsx`, holds the search text and the selected tags for both. The tag selection moved there from `CollectionGroups`.
- **Debounce:** `SearchInput` (`app/notes/search-input.tsx`) waits 300 ms after the last keystroke before updating the search text. The × button and Escape clear it at once.
- **Fetching results:** `CollectionGroups` calls the Server Action `searchNotesAction`, which calls `searchNoteIds`. All database access still goes through `lib/db.ts`.
  - An answer that arrives after the search has changed is ignored.
  - While a new search runs, the previous results stay visible instead of an empty list.
  - The search runs again when the notes change, so a note edited so it no longer matches drops out.
- **Sidebar:** while searching, the results are split into the collection groups. Groups without results are hidden, and groups with results open automatically.
- **Messages:** "Searching…" until the first results arrive, `No notes match "x".`, or `No notes match "x" and have all the selected tags.` when tags are selected.
