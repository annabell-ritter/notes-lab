"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addTagToNote,
  assignNoteToCollection,
  createCollection,
  createNote,
  deleteCollection,
  deleteNote,
  removeTagFromNote,
  renameCollection,
  updateNote,
} from "@/lib/db";

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

export async function createNoteAction() {
  const note = await createNote({ title: "Untitled note", body: null });
  revalidatePath("/notes", "layout");
  redirect(`/notes/${note.id}`);
}

export async function updateNoteAction(
  _prevState: SaveNoteState,
  formData: FormData,
): Promise<SaveNoteState> {
  const id = readNoteId(formData);
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");

  if (!title) return { error: "The title can't be empty." };

  try {
    const note = await updateNote(id, { title, body: body || null });
    revalidatePath("/notes", "layout");
    return { savedAt: note.updated_at };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save note." };
  }
}

export async function deleteNoteAction(formData: FormData) {
  const id = readNoteId(formData);
  await deleteNote(id);
  revalidatePath("/notes", "layout");
  redirect("/notes");
}

export async function createCollectionAction(
  _prevState: CreateCollectionState,
  formData: FormData,
): Promise<CreateCollectionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "The name can't be empty." };

  try {
    await createCollection(name);
    revalidatePath("/notes", "layout");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create collection." };
  }
}

function isValidId(id: number) {
  return Number.isInteger(id) && id > 0;
}

export async function renameCollectionAction(
  collectionId: number,
  name: string,
): Promise<{ error?: string }> {
  const trimmedName = name.trim();
  if (!isValidId(collectionId)) return { error: "Invalid collection." };
  if (!trimmedName) return { error: "The name can't be empty." };

  try {
    await renameCollection(collectionId, trimmedName);
    revalidatePath("/notes", "layout");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not rename collection." };
  }
}

export async function deleteCollectionAction(
  collectionId: number,
): Promise<{ error?: string }> {
  if (!isValidId(collectionId)) return { error: "Invalid collection." };

  try {
    await deleteCollection(collectionId);
    revalidatePath("/notes", "layout");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete collection." };
  }
}

export async function assignNoteToCollectionAction(
  noteId: number,
  collectionId: number | null,
): Promise<{ error?: string }> {
  if (!isValidId(noteId) || (collectionId !== null && !isValidId(collectionId))) {
    return { error: "Invalid note or collection." };
  }

  try {
    await assignNoteToCollection(noteId, collectionId);
    revalidatePath("/notes", "layout");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not move note." };
  }
}

export async function addTagToNoteAction(
  noteId: number,
  name: string,
): Promise<{ error?: string }> {
  const tagName = name.trim();
  if (!isValidId(noteId)) return { error: "Invalid note." };
  if (!tagName) return { error: "The tag can't be empty." };

  try {
    await addTagToNote(noteId, tagName);
    revalidatePath("/notes", "layout");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not add tag." };
  }
}

export async function removeTagFromNoteAction(
  noteId: number,
  tagId: number,
): Promise<{ error?: string }> {
  if (!isValidId(noteId) || !isValidId(tagId)) return { error: "Invalid note or tag." };

  try {
    await removeTagFromNote(noteId, tagId);
    revalidatePath("/notes", "layout");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not remove tag." };
  }
}
