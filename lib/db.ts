import { createClient } from "@/lib/supabase/server";

// All database reads and writes go through this module.
// Pages, components and Server Actions call these functions and never use the Supabase client directly.
// Every row belongs to one user. New rows get the signed-in user as owner through the user_id column default,
// and row-level security limits every query here to that user's own rows.

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

// A note as the sidebar lists it: the start of the body instead of the full body.
export type NoteSummary = Omit<Note, "body" | "created_at"> & {
  body_preview: string | null;
};

// What the sidebar list is narrowed to. Empty text and no tags means every note.
export type NoteFilter = {
  text: string;
  tagIds: number[];
};

// How many of the user's notes are in a collection (collection_id null: not in a collection).
export type NoteCount = {
  collection_id: number | null;
  note_count: number;
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
const NOTE_SUMMARY_COLUMNS =
  "id, title, body_preview, updated_at, collection_id, tags(id, name)";
const COLLECTION_COLUMNS = "id, name, created_at";
const TAG_COLUMNS = "id, name";

// Postgres error codes for a unique constraint violation, a foreign key violation,
// and the "no data found" error that add_tag_to_note raises for a missing note.
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";
const NO_DATA_FOUND = "P0002";
const DUPLICATE_COLLECTION_MESSAGE = "A collection with this name already exists.";

// Turns what the user typed into a prefix query: "team meetin" becomes "team:* & meetin:*".
// Every word must match, and the last one can still be unfinished. Only letters and digits are kept,
// so characters with a special meaning in a search query (& | ! : ( )) can't cause errors.
function toPrefixQuery(text: string): string {
  const words = text.match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.map((word) => `${word}:*`).join(" & ");
}

// The one query behind the sidebar list, Load more, search and the tag filter: the user's most recently
// edited notes whose title or body matches `text` (if any) and that have every tag in `tagIds` (AND logic).
// Returns at most `limit` notes, and whether there are more.
// Each selected tag gets its own inner join on note_tags (t0, t1, …). One join row only holds one tag,
// so a single join can't check "has tag A and tag B"; separate joins can.
export async function getNoteSummaries(
  { text, tagIds }: NoteFilter,
  limit: number,
): Promise<{ notes: NoteSummary[]; hasMore: boolean }> {
  const query = toPrefixQuery(text);
  // Text with no letters or digits (only punctuation, for example) matches nothing.
  if (text && !query) return { notes: [], hasMore: false };

  const supabase = await createClient();
  const tagJoins = tagIds.map((_, i) => `t${i}:note_tags!inner()`);
  let request = supabase
    .from("notes")
    .select([NOTE_SUMMARY_COLUMNS, ...tagJoins].join(", "));
  if (query) request = request.textSearch("search_vector", query, { config: "english" });
  tagIds.forEach((tagId, i) => {
    request = request.eq(`t${i}.tag_id`, tagId);
  });

  // One extra row tells whether there are more notes than `limit`.
  const { data, error } = await request
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .order("name", { referencedTable: "tags" })
    .limit(limit + 1);

  if (error) throw new Error(`Could not load notes: ${error.message}`);
  const notes = data as unknown as NoteSummary[];
  return { notes: notes.slice(0, limit), hasMore: notes.length > limit };
}

export async function getNoteCounts(): Promise<NoteCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("note_counts")
    .select("collection_id, note_count");

  if (error) throw new Error(`Could not count notes: ${error.message}`);
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

// The tags that are on at least one note, for the tag filter.
// note_tags!inner() keeps only tags with a link; limit 1 stops it from reading every link of a tag.
export async function getTagsInUse(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select(`${TAG_COLUMNS}, note_tags!inner()`)
    .limit(1, { referencedTable: "note_tags" })
    .order("name", { ascending: true });

  if (error) throw new Error(`Could not load tags: ${error.message}`);
  return data.map(({ id, name }) => ({ id, name }));
}

// Reuses the user's tag if one with this name exists (ignoring case and spaces at either end), otherwise creates it.
// Adding a tag the note already has does nothing. The database does all of this in one call (add_tag_to_note).
export async function addTagToNote(noteId: number, name: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_tag_to_note", {
    p_note_id: noteId,
    p_tag_name: name.trim(),
  });

  // The note was deleted (or isn't the user's), either before the call or while it ran.
  if (error?.code === NO_DATA_FOUND || error?.code === FOREIGN_KEY_VIOLATION) {
    throw new Error("This note no longer exists.");
  }
  if (error) throw new Error(`Could not add tag: ${error.message}`);
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
