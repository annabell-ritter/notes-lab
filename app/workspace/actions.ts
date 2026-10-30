"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  addTagToNote,
  assignNoteToCollection,
  createCollection,
  createNote,
  deleteCollection,
  deleteNote,
  getNoteSummaries,
  removeTagFromNote,
  renameCollection,
  updateNote,
  type NoteFilter,
  type NoteSummary,
} from "@/lib/db";
import { NOTES_MAX } from "./note-paging";
import {
  BODY_MAX_LENGTH,
  FILTER_TAGS_MAX,
  NAME_MAX_LENGTH,
  SEARCH_MAX_LENGTH,
  TITLE_MAX_LENGTH,
} from "./input-limits";

export type SaveNoteState = {
  error?: string;
  savedAt?: string;
};

export type CreateCollectionState = {
  error?: string;
};

function readNoteId(formData: FormData): number {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Invalid note id");
  return id;
}

function isValidId(id: unknown): id is number {
  return Number.isInteger(id) && (id as number) > 0;
}

// The types of an action's arguments aren't checked when it is called directly, so text from the
// browser is checked here: the trimmed text, or null if it isn't text or is longer than maxLength.
function readText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length <= maxLength ? text : null;
}

export async function createNoteAction() {
  await requireUser();

  const note = await createNote({ title: "Untitled note", body: null });
  revalidatePath("/workspace", "layout");
  redirect(`/workspace/${note.id}`);
}

export async function updateNoteAction(
  _prevState: SaveNoteState,
  formData: FormData,
): Promise<SaveNoteState> {
  await requireUser();

  const id = readNoteId(formData);
  const title = readText(formData.get("title") ?? "", TITLE_MAX_LENGTH);
  // The body isn't trimmed: spaces and blank lines at its start or end are part of the note.
  const body = formData.get("body") ?? "";

  if (title === null) {
    return { error: `The title can be at most ${TITLE_MAX_LENGTH} characters.` };
  }
  if (!title) return { error: "The title can't be empty." };
  if (typeof body !== "string") return { error: "The note text is invalid." };
  if (body.length > BODY_MAX_LENGTH) {
    return { error: `The note can be at most ${BODY_MAX_LENGTH.toLocaleString("en-US")} characters.` };
  }

  try {
    const note = await updateNote(id, { title, body: body || null });
    revalidatePath("/workspace", "layout");
    return { savedAt: note.updated_at };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save note." };
  }
}

export async function deleteNoteAction(formData: FormData) {
  await requireUser();

  const id = readNoteId(formData);
  await deleteNote(id);
  revalidatePath("/workspace", "layout");
  redirect("/workspace");
}

export async function createCollectionAction(
  _prevState: CreateCollectionState,
  formData: FormData,
): Promise<CreateCollectionState> {
  await requireUser();

  const name = readText(formData.get("name") ?? "", NAME_MAX_LENGTH);
  if (name === null) return { error: `The name can be at most ${NAME_MAX_LENGTH} characters.` };
  if (!name) return { error: "The name can't be empty." };

  try {
    await createCollection(name);
    revalidatePath("/workspace", "layout");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create collection." };
  }
}

export async function renameCollectionAction(
  collectionId: number,
  name: string,
): Promise<{ error?: string }> {
  await requireUser();

  const trimmedName = readText(name, NAME_MAX_LENGTH);
  if (!isValidId(collectionId)) return { error: "Invalid collection." };
  if (trimmedName === null) {
    return { error: `The name can be at most ${NAME_MAX_LENGTH} characters.` };
  }
  if (!trimmedName) return { error: "The name can't be empty." };

  try {
    await renameCollection(collectionId, trimmedName);
    revalidatePath("/workspace", "layout");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not rename collection." };
  }
}

export async function deleteCollectionAction(
  collectionId: number,
): Promise<{ error?: string }> {
  await requireUser();

  if (!isValidId(collectionId)) return { error: "Invalid collection." };

  try {
    await deleteCollection(collectionId);
    revalidatePath("/workspace", "layout");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete collection." };
  }
}

export async function assignNoteToCollectionAction(
  noteId: number,
  collectionId: number | null,
): Promise<{ error?: string }> {
  await requireUser();

  if (!isValidId(noteId) || (collectionId !== null && !isValidId(collectionId))) {
    return { error: "Invalid note or collection." };
  }

  try {
    await assignNoteToCollection(noteId, collectionId);
    revalidatePath("/workspace", "layout");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not move note." };
  }
}

export async function addTagToNoteAction(
  noteId: number,
  name: string,
): Promise<{ error?: string }> {
  await requireUser();

  const tagName = readText(name, NAME_MAX_LENGTH);
  if (!isValidId(noteId)) return { error: "Invalid note." };
  if (tagName === null) return { error: `The tag can be at most ${NAME_MAX_LENGTH} characters.` };
  if (!tagName) return { error: "The tag can't be empty." };

  try {
    await addTagToNote(noteId, tagName);
    revalidatePath("/workspace", "layout");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not add tag." };
  }
}

export async function removeTagFromNoteAction(
  noteId: number,
  tagId: number,
): Promise<{ error?: string }> {
  await requireUser();

  if (!isValidId(noteId) || !isValidId(tagId)) return { error: "Invalid note or tag." };

  try {
    await removeTagFromNote(noteId, tagId);
    revalidatePath("/workspace", "layout");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not remove tag." };
  }
}

// Loads the sidebar list when it is searched, filtered by tags, or extended with "Load more notes".
export async function loadNotesAction(
  filter: NoteFilter,
  limit: number,
): Promise<{ notes?: NoteSummary[]; hasMore?: boolean; error?: string }> {
  await requireUser();

  if (typeof filter !== "object" || filter === null) return { error: "Invalid filter." };
  const { tagIds } = filter;
  const text = readText(filter.text, SEARCH_MAX_LENGTH);
  if (text === null) {
    return { error: `The search can be at most ${SEARCH_MAX_LENGTH} characters.` };
  }
  if (!Array.isArray(tagIds) || !tagIds.every(isValidId)) return { error: "Invalid tag." };
  if (tagIds.length > FILTER_TAGS_MAX) {
    return { error: `Select at most ${FILTER_TAGS_MAX} tags.` };
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > NOTES_MAX) {
    return { error: "Invalid number of notes." };
  }

  try {
    return await getNoteSummaries({ text, tagIds }, limit);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not load notes." };
  }
}
