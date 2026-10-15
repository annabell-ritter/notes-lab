import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNotes } from "@/lib/db";
import { createNoteAction } from "./actions";
import { NoteList } from "./note-list";

export const metadata: Metadata = {
  title: "Notes Lab",
};

async function NotesSidebar() {
  let notes;
  try {
    notes = await getNotes();
  } catch {
    return (
      <p className="p-2 text-sm text-destructive">
        Notes could not be loaded. Check your connection and reload the page.
      </p>
    );
  }

  if (!notes.length) {
    return (
      <p className="p-2 text-sm text-muted-foreground">
        No notes yet. Create your first one with &ldquo;New note&rdquo;.
      </p>
    );
  }

  return <NoteList notes={notes} />;
}

export default function NotesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center border-b px-4">
        <Link href="/notes" className="font-semibold">
          Notes Lab
        </Link>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-72 shrink-0 flex-col border-r">
          <form action={createNoteAction} className="border-b p-3">
            <Button type="submit" className="w-full">
              <Plus />
              New note
            </Button>
          </form>
          <nav aria-label="Notes" className="flex-1 overflow-y-auto p-2">
            <Suspense
              fallback={
                <p className="p-2 text-sm text-muted-foreground">
                  Loading notes…
                </p>
              }
            >
              <NotesSidebar />
            </Suspense>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
