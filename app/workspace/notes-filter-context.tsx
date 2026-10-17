"use client";

import { createContext, useContext, useState } from "react";

// The search text and the selected tags, shared by the search input in the workspace
// and the note list in the sidebar.
type NotesFilter = {
  searchText: string;
  setSearchText: (text: string) => void;
  selectedTagIds: Set<number>;
  setSelectedTagIds: (tagIds: Set<number>) => void;
};

const NotesFilterContext = createContext<NotesFilter | null>(null);

export function NotesFilterProvider({ children }: { children: React.ReactNode }) {
  const [searchText, setSearchText] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(
    () => new Set(),
  );

  return (
    <NotesFilterContext.Provider
      value={{ searchText, setSearchText, selectedTagIds, setSelectedTagIds }}
    >
      {children}
    </NotesFilterContext.Provider>
  );
}

export function useNotesFilter(): NotesFilter {
  const filter = useContext(NotesFilterContext);
  if (!filter) throw new Error("useNotesFilter must be used inside NotesFilterProvider");
  return filter;
}
