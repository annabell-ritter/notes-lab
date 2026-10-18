import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, LogOut, Plus } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { getCollections, getNotes } from "@/lib/db";
import { signOutAction } from "../(auth)/actions";
import { createNoteAction } from "./actions";
import { CollectionGroups } from "./collection-groups";
import { NewCollectionForm } from "./new-collection-form";
import { NoteViewFlag } from "./note-view-flag";
import { NotesFilterProvider } from "./notes-filter-context";
import { SearchInput } from "./search-input";

export const metadata: Metadata = {
  title: "Notes Lab",
};

async function UserMenu() {
  const user = await requireUser();

  return (
    <div className="flex items-center gap-4">
      <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
      <form action={signOutAction}>
        <SubmitButton variant="ghost" size="sm" pendingText="Signing out…">
          <LogOut />
          Sign out
        </SubmitButton>
      </form>
    </div>
  );
}

async function NotesSidebar() {
  await requireUser();

  let notes, collections;
  try {
    [notes, collections] = await Promise.all([getNotes(), getCollections()]);
  } catch {
    return (
      <p className="p-2 text-sm text-destructive">
        Notes could not be loaded. Check your connection and reload the page.
      </p>
    );
  }

  return <CollectionGroups notes={notes} collections={collections} />;
}

export default function NotesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
        <Link
          href="/workspace"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight transition-opacity hover:opacity-70"
        >
          <span aria-hidden className="size-2.5 rounded-full bg-primary" />
          Notes Lab
        </Link>
        <Suspense>
          <UserMenu />
        </Suspense>
      </header>
      <NotesFilterProvider>
        {/* Phones show one screen at a time: search and the note list, or the open note (marked by NoteViewFlag).
            From tablet width up, the sidebar sits on the left and search and the note share the right column. */}
        <div className="group/workspace grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[18rem_minmax(0,1fr)] lg:grid-cols-[20rem_minmax(0,1fr)]">
          <Suspense>
            <NoteViewFlag />
          </Suspense>
          <div className="row-start-1 px-4 pt-4 md:col-start-2 md:px-8 md:pt-6 max-md:group-has-[[data-note-view]]/workspace:hidden">
            <SearchInput />
          </div>
          <aside className="row-start-2 flex min-h-0 flex-col md:col-start-1 md:row-span-2 md:row-start-1 md:border-r max-md:group-has-[[data-note-view]]/workspace:hidden">
            <div className="flex flex-col gap-3 p-4 pb-2 md:p-5 md:pb-2">
              <form action={createNoteAction}>
                <SubmitButton className="w-full" pendingText="Creating…">
                  <Plus />
                  New note
                </SubmitButton>
              </form>
              <NewCollectionForm />
            </div>
            <nav aria-label="Notes" className="flex-1 overflow-y-auto px-2 py-4 md:px-3 md:py-5">
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
          <main className="row-start-2 overflow-y-auto md:col-start-2 max-md:hidden max-md:group-has-[[data-note-view]]/workspace:block">
            <Link
              href="/workspace"
              className="inline-flex items-center gap-1 px-4 pt-4 text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
            >
              <ChevronLeft className="size-4" />
              All notes
            </Link>
            {children}
          </main>
        </div>
      </NotesFilterProvider>
    </div>
  );
}
