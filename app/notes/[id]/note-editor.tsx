"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import type { Collection, Note } from "@/lib/db";
import {
  assignNoteToCollectionAction,
  deleteNoteAction,
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
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
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

export function NoteEditor({
  note,
  collections,
}: {
  note: Note;
  collections: Collection[];
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
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
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
          className="h-11 text-lg font-semibold md:text-lg"
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
          className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
        />
      </form>
    </div>
  );
}
