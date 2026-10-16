"use client";

import type { Note, Tag } from "@/lib/db";
import { cn } from "@/lib/utils";
import { tagColor } from "./tag-colors";

// AND logic: a note is kept only if it has every selected tag. No selected tags keeps every note.
export function filterNotesByTags(notes: Note[], tagIds: Set<number>): Note[] {
  if (!tagIds.size) return notes;
  return notes.filter((note) => {
    const noteTagIds = new Set(note.tags.map((tag) => tag.id));
    return [...tagIds].every((id) => noteTagIds.has(id));
  });
}

export function TagFilter({
  tags,
  selected,
  onToggle,
  onClear,
}: {
  tags: Tag[];
  selected: Set<number>;
  onToggle: (tagId: number) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-2 pb-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Filter by tags
        </span>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Clear
          </button>
        )}
      </div>
      {tags.length ? (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => {
            const isSelected = selected.has(tag.id);
            const color = tagColor(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggle(tag.id)}
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs transition-colors",
                  isSelected
                    ? cn(color.pill, color.border, "font-medium")
                    : "hover:bg-accent",
                )}
              >
                <span
                  aria-hidden
                  className={cn("size-2 shrink-0 rounded-full", color.dot)}
                />
                {tag.name}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No tags yet. Add tags to a note to filter by them.
        </p>
      )}
    </div>
  );
}
