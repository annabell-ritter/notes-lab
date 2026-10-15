import { createClient } from "@/lib/supabase/server";

// All database reads and writes go through this module.
// Pages, components and Server Actions call these functions and never use the Supabase client directly.

export type Note = {
  id: number;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
  collection_id: number | null;
};

export type NoteInput = {
  title: string;
  body: string | null;
};

const NOTE_COLUMNS = "id, title, body, created_at, updated_at, collection_id";

export async function getNotes(): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw new Error(`Could not load notes: ${error.message}`);
  return data;
}

export async function getNote(id: number): Promise<Note | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load note: ${error.message}`);
  return data;
}

export async function createNote(input: NoteInput): Promise<Note> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .insert(input)
    .select(NOTE_COLUMNS)
    .single();

  if (error) throw new Error(`Could not create note: ${error.message}`);
  return data;
}

export async function updateNote(id: number, input: NoteInput): Promise<Note> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .update(input)
    .eq("id", id)
    .select(NOTE_COLUMNS)
    .single();

  if (error) throw new Error(`Could not save note: ${error.message}`);
  return data;
}

export async function deleteNote(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) throw new Error(`Could not delete note: ${error.message}`);
}
