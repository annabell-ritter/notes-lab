"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { Collection, Note, Tag } from "@/lib/db";
import { cn } from "@/lib/utils";
import { CollectionMenu, RenameCollectionForm } from "./collection-menu";
import { NoteList } from "./note-list";
import { filterNotesByTags, TagFilter } from "./tag-filter";

const UNCOLLECTED = "uncollected";

function groupKey(collectionId: number | null) {
  return collectionId === null ? UNCOLLECTED : String(collectionId);
}

export function CollectionGroups({
  notes,
  collections,
}: {
  notes: Note[];
  collections: Collection[];
}) {
  const pathname = usePathname();
  const activeNoteId = Number(pathname.match(/^\/notes\/(\d+)$/)?.[1]);
  const activeNote = notes.find((note) => note.id === activeNoteId);
  const activeGroup = activeNote ? groupKey(activeNote.collection_id) : null;

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(activeGroup ? [activeGroup] : []),
  );

  // Open the group of the note being viewed whenever that changes,
  // for example after opening another note or moving this one to a different collection.
  const [lastActiveGroup, setLastActiveGroup] = useState(activeGroup);
  if (activeGroup !== lastActiveGroup) {
    setLastActiveGroup(activeGroup);
    if (activeGroup && !expanded.has(activeGroup)) {
      setExpanded(new Set(expanded).add(activeGroup));
    }
  }

  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [groupError, setGroupError] = useState<{
    key: string;
    message: string;
  } | null>(null);

  function toggle(key: string) {
    const next = new Set(expanded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpanded(next);
  }

  // The filter offers the tags that are on at least one note, sorted by name.
  const tagsById = new Map<number, Tag>();
  for (const note of notes) {
    for (const tag of note.tags) tagsById.set(tag.id, tag);
  }
  const filterTags = [...tagsById.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(
    () => new Set(),
  );
  // Ignore a selected tag once it's on no note any more, so it can't hide every note invisibly.
  const activeTagIds = new Set(
    [...selectedTagIds].filter((id) => tagsById.has(id)),
  );
  const isFiltering = activeTagIds.size > 0;
  const visibleNotes = filterNotesByTags(notes, activeTagIds);

  function toggleTag(tagId: number) {
    const next = new Set(activeTagIds);
    if (next.has(tagId)) next.delete(tagId);
    else next.add(tagId);
    setSelectedTagIds(next);

    // Open every group that contains a matching note, so the results are visible straight away.
    if (next.size) {
      const matchingGroups = filterNotesByTags(notes, next).map((note) =>
        groupKey(note.collection_id),
      );
      setExpanded(new Set([...expanded, ...matchingGroups]));
    }
  }

  const groups = [
    ...collections.map((collection) => ({
      key: groupKey(collection.id),
      name: collection.name,
      collection,
      emptyText: "No notes in this collection yet.",
    })),
    {
      key: UNCOLLECTED,
      name: "Uncollected",
      collection: null,
      emptyText: notes.length
        ? "Every note is in a collection."
        : "No notes yet.",
    },
  ];

  return (
    <div className="flex flex-col gap-1">
      {!notes.length && (
        <p className="p-2 text-sm text-muted-foreground">
          No notes yet. Create your first one with &ldquo;New note&rdquo;.
        </p>
      )}
      {notes.length > 0 && (
        <TagFilter
          tags={filterTags}
          selected={activeTagIds}
          onToggle={toggleTag}
          onClear={() => setSelectedTagIds(new Set())}
        />
      )}
      {isFiltering && !visibleNotes.length && (
        <p className="p-2 text-sm text-muted-foreground">
          No notes have all the selected tags.
        </p>
      )}
      {groups.map((group) => {
        const groupNotes = visibleNotes.filter(
          (note) => groupKey(note.collection_id) === group.key,
        );
        // While filtering, hide groups without a matching note.
        if (isFiltering && !groupNotes.length) return null;
        const isOpen = expanded.has(group.key);

        return (
          <section key={group.key}>
            {group.collection && renamingKey === group.key ? (
              <RenameCollectionForm
                collection={group.collection}
                onDone={() => setRenamingKey(null)}
              />
            ) : (
              <div className="flex items-center gap-1 rounded-md hover:bg-accent">
                <button
                  type="button"
                  onClick={() => toggle(group.key)}
                  aria-expanded={isOpen}
                  className="flex min-w-0 flex-1 items-center gap-1 px-2 py-1.5 text-left text-sm font-medium"
                >
                  <ChevronRight
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-90",
                    )}
                  />
                  <span className="truncate">{group.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {groupNotes.length}
                  </span>
                </button>
                {group.collection && (
                  <CollectionMenu
                    collection={group.collection}
                    onRename={() => setRenamingKey(group.key)}
                    onError={(message) =>
                      setGroupError(message ? { key: group.key, message } : null)
                    }
                  />
                )}
              </div>
            )}
            {groupError?.key === group.key && (
              <p className="px-3 py-1 text-xs text-destructive">
                {groupError.message}
              </p>
            )}
            {isOpen && (
              <div className="pb-1 pl-4">
                {groupNotes.length ? (
                  <NoteList notes={groupNotes} />
                ) : (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    {group.emptyText}
                  </p>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
