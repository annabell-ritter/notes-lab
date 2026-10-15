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
