import { createClient } from "@/lib/supabase/server";

// All database reads and writes go through this module.
// Pages, components and Server Actions call these functions and never use the Supabase client directly.

export type Tag = {
  id: number;
  name: string;
};

export type Note = {
  id: number;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
  collection_id: number | null;
  tags: Tag[];
};

export type NoteInput = {
  title: string;
  body: string | null;
};

export type Collection = {
  id: number;
  name: string;
  created_at: string;
};

// tags(...) follows the note_tags links, so each note comes with its tags.
const NOTE_COLUMNS =
  "id, title, body, created_at, updated_at, collection_id, tags(id, name)";
const COLLECTION_COLUMNS = "id, name, created_at";
const TAG_COLUMNS = "id, name";

// Postgres error code for a unique constraint violation.
const UNIQUE_VIOLATION = "23505";
const DUPLICATE_COLLECTION_MESSAGE = "A collection with this name already exists.";

export async function getNotes(): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .order("name", { referencedTable: "tags" });

  if (error) throw new Error(`Could not load notes: ${error.message}`);
  return data;
}

export async function getNote(id: number): Promise<Note | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("id", id)
    .order("name", { referencedTable: "tags" })
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

export async function assignNoteToCollection(
  noteId: number,
  collectionId: number | null,
): Promise<Note> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .update({ collection_id: collectionId })
    .eq("id", noteId)
    .select(NOTE_COLUMNS)
    .single();

  if (error) throw new Error(`Could not move note: ${error.message}`);
  return data;
}

export async function getCollections(): Promise<Collection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select(COLLECTION_COLUMNS)
    .order("name", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw new Error(`Could not load collections: ${error.message}`);
  return data;
}

export async function createCollection(name: string): Promise<Collection> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .insert({ name })
    .select(COLLECTION_COLUMNS)
    .single();

  if (error?.code === UNIQUE_VIOLATION) throw new Error(DUPLICATE_COLLECTION_MESSAGE);
  if (error) throw new Error(`Could not create collection: ${error.message}`);
  return data;
}

export async function renameCollection(
  id: number,
  name: string,
): Promise<Collection> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .update({ name })
    .eq("id", id)
    .select(COLLECTION_COLUMNS)
    .single();

  if (error?.code === UNIQUE_VIOLATION) throw new Error(DUPLICATE_COLLECTION_MESSAGE);
  if (error) throw new Error(`Could not rename collection: ${error.message}`);
  return data;
}

// The collection's notes are kept and become uncollected (on delete set null).
export async function deleteCollection(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("collections").delete().eq("id", id);

  if (error) throw new Error(`Could not delete collection: ${error.message}`);
}

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select(TAG_COLUMNS)
    .order("name", { ascending: true });

  if (error) throw new Error(`Could not load tags: ${error.message}`);
  return data;
}

// Reuses the tag if one with this name exists (ignoring case and spaces at either end), otherwise creates it.
// Adding a tag the note already has does nothing.
export async function addTagToNote(noteId: number, name: string): Promise<void> {
  const supabase = await createClient();
  const tagName = name.trim();
  const sameName = (tag: Tag) =>
    tag.name.trim().toLowerCase() === tagName.toLowerCase();

  let tag = (await getTags()).find(sameName);
  if (!tag) {
    const { data, error } = await supabase
      .from("tags")
      .insert({ name: tagName })
      .select(TAG_COLUMNS)
      .single();

    // Someone else created the same tag in the meantime: use theirs.
    if (error?.code === UNIQUE_VIOLATION) tag = (await getTags()).find(sameName);
    else if (error) throw new Error(`Could not create tag: ${error.message}`);
    else tag = data;
  }
  if (!tag) throw new Error("Could not create tag.");

  const { error } = await supabase
    .from("note_tags")
    .insert({ note_id: noteId, tag_id: tag.id });

  if (error && error.code !== UNIQUE_VIOLATION) {
    throw new Error(`Could not add tag: ${error.message}`);
  }
}

export async function removeTagFromNote(noteId: number, tagId: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("note_tags")
    .delete()
    .eq("note_id", noteId)
    .eq("tag_id", tagId);

  if (error) throw new Error(`Could not remove tag: ${error.message}`);
}

// Turns what the user typed into a prefix query: "team meetin" becomes "team:* & meetin:*".
// Every word must match, and the last one can still be unfinished. Only letters and digits are kept,
// so characters with a special meaning in a search query (& | ! : ( )) can't cause errors.
function toPrefixQuery(text: string): string {
  const words = text.match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.map((word) => `${word}:*`).join(" & ");
}

// Search and tag filter in one query: returns the ids of notes whose title or body matches `text`
// and that have every tag in `tagIds` (AND logic).
// Each selected tag gets its own inner join on note_tags (t0, t1, …). One join row only holds one tag,
// so a single join can't check "has tag A and tag B"; separate joins can.
export async function searchNoteIds(text: string, tagIds: number[]): Promise<number[]> {
  const query = toPrefixQuery(text);
  if (!query) return [];

  const supabase = await createClient();
  const tagJoins = tagIds.map((_, i) => `t${i}:note_tags!inner(tag_id)`);
  let request = supabase
    .from("notes")
    .select(["id", ...tagJoins].join(", "))
    .textSearch("search_vector", query, { config: "english" });
  tagIds.forEach((tagId, i) => {
    request = request.eq(`t${i}.tag_id`, tagId);
  });

  const { data, error } = await request;
  if (error) throw new Error(`Could not search notes: ${error.message}`);
  return (data as unknown as { id: number }[]).map((note) => note.id);
}
