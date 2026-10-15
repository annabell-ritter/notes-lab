"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNote, deleteNote, updateNote } from "@/lib/db";

export type SaveNoteState = {
  error?: string;
  savedAt?: string;
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
