"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNotesFilter } from "./notes-filter-context";

// Wait this long after the last keystroke before searching.
const DEBOUNCE_MS = 300;

export function SearchInput() {
  const { searchText, setSearchText } = useNotesFilter();
  const [value, setValue] = useState(searchText);

  useEffect(() => {
    const timeout = setTimeout(() => setSearchText(value.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [value, setSearchText]);

  function clear() {
    setValue("");
    setSearchText("");
  }

  return (
    <div className="relative max-w-xl">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        aria-label="Search notes"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") clear();
        }}
        placeholder="Search all notes…"
        className="pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
