import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LogOut, Plus } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { getCollections, getNotes } from "@/lib/db";
import { signOutAction } from "../(auth)/actions";
import { createNoteAction } from "./actions";
import { CollectionGroups } from "./collection-groups";
import { NewCollectionForm } from "./new-collection-form";
import { NotesFilterProvider } from "./notes-filter-context";
import { SearchInput } from "./search-input";

export const metadata: Metadata = {
  title: "Notes Lab",
};

async function UserMenu() {
  const user = await requireUser();

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
      <form action={signOutAction}>
        <SubmitButton variant="outline" size="sm" pendingText="Signing out…">
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
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <Link href="/workspace" className="font-semibold">
          Notes Lab
        </Link>
        <Suspense>
          <UserMenu />
        </Suspense>
      </header>
      <NotesFilterProvider>
        <div className="flex min-h-0 flex-1">
          <aside className="flex w-72 shrink-0 flex-col border-r">
            <div className="flex flex-col gap-2 border-b p-3">
              <form action={createNoteAction}>
                <SubmitButton className="w-full" pendingText="Creating…">
                  <Plus />
                  New note
                </SubmitButton>
              </form>
              <NewCollectionForm />
            </div>
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
          <main className="flex min-w-0 flex-1 flex-col">
            <div className="shrink-0 border-b p-3">
              <SearchInput />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </main>
        </div>
      </NotesFilterProvider>
    </div>
  );
}
