import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getNote } from "@/lib/db";
import { NoteEditor } from "./note-editor";

async function NoteLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const noteId = Number(id);
  if (!Number.isInteger(noteId) || noteId <= 0) notFound();

  const note = await getNote(noteId);
  if (!note) notFound();

  return <NoteEditor key={note.id} note={note} />;
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
