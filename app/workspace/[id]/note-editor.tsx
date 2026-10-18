"use client";

import { useActionState, useState, useTransition } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import type { Collection, Note, Tag } from "@/lib/db";
import { cn } from "@/lib/utils";
import { tagColor } from "../tag-colors";
import {
  addTagToNoteAction,
  assignNoteToCollectionAction,
  deleteNoteAction,
  removeTagFromNoteAction,
  updateNoteAction,
  type SaveNoteState,
} from "../actions";

const initialState: SaveNoteState = {};

function CollectionPicker({
  note,
  collections,
}: {
  note: Note;
  collections: Collection[];
}) {
  // Local value so the dropdown shows the new choice straight away while it saves.
  const [collectionId, setCollectionId] = useState(note.collection_id);
  const [error, setError] = useState<string | null>(null);
  const [isMoving, startMoving] = useTransition();

  // Follow changes made elsewhere, for example when this note's collection is deleted from the sidebar.
  const [savedCollectionId, setSavedCollectionId] = useState(note.collection_id);
  if (note.collection_id !== savedCollectionId) {
    setSavedCollectionId(note.collection_id);
    setCollectionId(note.collection_id);
  }

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextId = event.target.value ? Number(event.target.value) : null;
    const previousId = collectionId;
    setCollectionId(nextId);
    setError(null);

    startMoving(async () => {
      const result = await assignNoteToCollectionAction(note.id, nextId);
      if (result.error) {
        setCollectionId(previousId);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label htmlFor="collection">Collection</Label>
      <select
        id="collection"
        value={collectionId ?? ""}
        onChange={handleChange}
        disabled={isMoving}
        className="h-9 rounded-md border border-input bg-card px-3 text-base md:text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
      >
        <option value="">No collection</option>
        {collections.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.name}
          </option>
        ))}
      </select>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {isMoving ? "Moving…" : error && <span className="text-destructive">{error}</span>}
      </p>
    </div>
  );
}

function TagEditor({ note, allTags }: { note: Note; allTags: Tag[] }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  // Suggest existing tags the note doesn't have yet.
  const suggestions = allTags.filter(
    (tag) => !note.tags.some((noteTag) => noteTag.id === tag.id),
  );

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setError(null);

    startSaving(async () => {
      const result = await addTagToNoteAction(note.id, name);
      if (result.error) setError(result.error);
      else setName("");
    });
  }

  function handleRemove(tag: Tag) {
    setError(null);
    startSaving(async () => {
      const result = await removeTagFromNoteAction(note.id, tag.id);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Tags</span>
        {note.tags.length ? (
          <ul className="flex flex-wrap gap-1">
            {note.tags.map((tag) => (
              <li key={tag.id}>
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1 border-transparent pr-1 font-normal",
                    tagColor(tag.id).pill,
                  )}
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => handleRemove(tag)}
                    disabled={isSaving}
                    aria-label={`Remove tag ${tag.name}`}
                    className="-my-1 grid size-6 place-items-center rounded-sm opacity-60 transition-opacity hover:opacity-100 disabled:opacity-30"
                  >
                    <X className="size-3.5" />
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-sm text-muted-foreground">No tags yet.</span>
        )}
      </div>
      <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
        <Label htmlFor="new-tag" className="sr-only">
          Add a tag
        </Label>
        <Input
          id="new-tag"
          list="tag-suggestions"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Add a tag…"
          disabled={isSaving}
          className="h-9 w-full sm:h-8 sm:w-48"
        />
        <datalist id="tag-suggestions">
          {suggestions.map((tag) => (
            <option key={tag.id} value={tag.name} />
          ))}
        </datalist>
        <Button type="submit" size="sm" variant="outline" disabled={isSaving || !name.trim()}>
          Add
        </Button>
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {isSaving ? "Saving…" : error && <span className="text-destructive">{error}</span>}
        </p>
      </form>
    </div>
  );
}

export function NoteEditor({
  note,
  collections,
  allTags,
}: {
  note: Note;
  collections: Collection[];
  allTags: Tag[];
}) {
  const [state, formAction, pending] = useActionState(
    updateNoteAction,
    initialState,
  );
  // Controlled fields, so React's automatic form reset after an action doesn't wipe the text.
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body ?? "");

  const hasUnsavedChanges = title !== note.title || body !== (note.body ?? "");

  let status: React.ReactNode = null;
  if (pending) status = "Saving…";
  else if (state.error) status = <span className="text-destructive">{state.error}</span>;
  else if (hasUnsavedChanges) status = "Unsaved changes";
  else if (state.savedAt) status = "Saved";

  return (
    <div className="flex max-w-3xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button type="submit" form="note-form" disabled={pending}>
            Save
          </Button>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {status}
          </p>
        </div>
        <form
          action={deleteNoteAction}
          onSubmit={(event) => {
            if (!confirm("Delete this note? This can't be undone.")) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={note.id} />
          <SubmitButton variant="outline" pendingText="Deleting…">
            Delete
          </SubmitButton>
        </form>
      </div>

      <CollectionPicker note={note} collections={collections} />
      <TagEditor note={note} allTags={allTags} />

      <form id="note-form" action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={note.id} />
        <Label htmlFor="title" className="sr-only">
          Title
        </Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          placeholder="Title"
          className="h-14 text-2xl font-semibold tracking-tight md:text-2xl"
        />
        <Label htmlFor="body" className="sr-only">
          Note
        </Label>
        <textarea
          id="body"
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={18}
          placeholder="Write your note…"
          className="w-full resize-y rounded-md border border-input bg-card px-4 py-3 leading-relaxed text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
        />
      </form>
    </div>
  );
}
