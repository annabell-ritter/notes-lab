import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCollections, getNote } from "@/lib/db";
import { NoteEditor } from "./note-editor";

async function NoteLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const noteId = Number(id);
  if (!Number.isInteger(noteId) || noteId <= 0) notFound();

  const [note, collections] = await Promise.all([
    getNote(noteId),
    getCollections(),
  ]);
  if (!note) notFound();

  return <NoteEditor key={note.id} note={note} collections={collections} />;
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
