import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getCollections, getNote, getTags } from "@/lib/db";
import { NoteEditor } from "./note-editor";

async function NoteLoader({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();

  const { id } = await params;
  const noteId = Number(id);
  if (!Number.isInteger(noteId) || noteId <= 0) notFound();

  const [note, collections, allTags] = await Promise.all([
    getNote(noteId),
    getCollections(),
    getTags(),
  ]);
  if (!note) notFound();

  return (
    <NoteEditor
      key={note.id}
      note={note}
      collections={collections}
      allTags={allTags}
    />
  );
}

export default function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<p className="p-6 text-sm text-muted-foreground">Loading note…</p>}
    >
      <NoteLoader params={params} />
    </Suspense>
  );
}
