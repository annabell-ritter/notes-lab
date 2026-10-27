"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Collection, NoteCount, NoteSummary, Tag } from "@/lib/db";
import { cn } from "@/lib/utils";
import { loadNotesAction } from "./actions";
import { CollectionMenu, RenameCollectionForm } from "./collection-menu";
import { NOTES_MAX, NOTES_PAGE_SIZE } from "./note-paging";
import { NoteList } from "./note-list";
import { useNotesFilter } from "./notes-filter-context";
import { TagFilter } from "./tag-filter";

const UNCOLLECTED = "uncollected";

function groupKey(collectionId: number | null) {
  return collectionId === null ? UNCOLLECTED : String(collectionId);
}

export function CollectionGroups({
  notes,
  hasMoreNotes,
  noteCounts,
  collections,
  filterTags,
}: {
  // The first page of notes, most recently edited first, and whether there are more.
  notes: NoteSummary[];
  hasMoreNotes: boolean;
  // How many notes each collection has in total, loaded or not.
  noteCounts: NoteCount[];
  collections: Collection[];
  // The tags that are on at least one note, sorted by name.
  filterTags: Tag[];
}) {
  const pathname = usePathname();
  const { searchText, selectedTagIds, setSelectedTagIds } = useNotesFilter();

  // Ignore a selected tag once it's on no note any more, so it can't hide every note invisibly.
  const filterTagIds = new Set(filterTags.map((tag) => tag.id));
  const activeTagIds = new Set(
    [...selectedTagIds].filter((id) => filterTagIds.has(id)),
  );
  const isFiltering = activeTagIds.size > 0;
  const isSearching = searchText !== "";
  const isNarrowed = isFiltering || isSearching;

  // How many notes the list shows: one page at first, one more with each "Load more notes",
  // and back to one page whenever the search or the selected tags change.
  const tagKey = [...activeTagIds].sort((a, b) => a - b).join(",");
  const filterKey = `${tagKey}|${searchText}`;
  const [limit, setLimit] = useState(NOTES_PAGE_SIZE);
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setLimit(NOTES_PAGE_SIZE);
  }

  // The first page comes with the page itself. A search, selected tags or more than one page are loaded
  // from the database, which applies search and tags together (getNoteSummaries).
  // That list loads again when the notes change, for example after an edit.
  const usesFirstPage = !isNarrowed && limit === NOTES_PAGE_SIZE;
  const queryKey = `${filterKey}|${limit}`;
  const [loaded, setLoaded] = useState<{
    key: string;
    notes: NoteSummary[];
    hasMore: boolean;
    error?: string;
  } | null>(null);
  if (usesFirstPage && loaded) setLoaded(null);

  // While a new list loads, the previous one stays visible instead of an empty list.
  const isPending = !usesFirstPage && loaded?.key !== queryKey;
  const loadError = !usesFirstPage && !isPending ? loaded?.error : undefined;
  const visibleNotes = usesFirstPage
    ? notes
    : (loaded?.notes ?? (isNarrowed ? [] : notes));
  const hasMore = usesFirstPage ? hasMoreNotes : (loaded?.hasMore ?? false);
  const canLoadMore = hasMore && limit < NOTES_MAX;

  const activeNoteId = Number(pathname.match(/^\/workspace\/(\d+)$/)?.[1]);
  const activeNote = [...visibleNotes, ...notes].find((note) => note.id === activeNoteId);
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

  useEffect(() => {
    if (usesFirstPage) return;
    const tagIds = tagKey ? tagKey.split(",").map(Number) : [];
    // Ignore the answer if the list changed while it was on its way.
    let isLatest = true;

    loadNotesAction({ text: searchText, tagIds }, limit).then((result) => {
      if (!isLatest) return;
      setLoaded((current) => ({
        key: `${tagKey}|${searchText}|${limit}`,
        notes: result.notes ?? current?.notes ?? [],
        hasMore: result.hasMore ?? false,
        error: result.error,
      }));

      // Open every group that contains a result, so search and filter results are visible straight away.
      if (searchText || tagIds.length) {
        const groupsWithResults = (result.notes ?? []).map((note) =>
          groupKey(note.collection_id),
        );
        setExpanded((current) => new Set([...current, ...groupsWithResults]));
      }
    });

    return () => {
      isLatest = false;
    };
  }, [usesFirstPage, searchText, tagKey, limit, notes]);

  function toggle(key: string) {
    const next = new Set(expanded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpanded(next);
  }

  function toggleTag(tagId: number) {
    const next = new Set(activeTagIds);
    if (next.has(tagId)) next.delete(tagId);
    else next.add(tagId);
    setSelectedTagIds(next);
  }

  function loadMore() {
    setLimit(Math.min(limit + NOTES_PAGE_SIZE, NOTES_MAX));
  }

  const countByGroup = new Map(
    noteCounts.map((count) => [groupKey(count.collection_id), count.note_count]),
  );
  const totalNotes = noteCounts.reduce((sum, count) => sum + count.note_count, 0);

  // The message above the groups when nothing (or nothing yet) can be shown.
  let listMessage: React.ReactNode = null;
  if (loadError) {
    listMessage = <span className="text-destructive">{loadError}</span>;
  } else if (!visibleNotes.length && isPending) {
    listMessage = isSearching ? "Searching…" : "Loading…";
  } else if (!visibleNotes.length && isSearching) {
    listMessage = isFiltering
      ? `No notes match “${searchText}” and have all the selected tags.`
      : `No notes match “${searchText}”.`;
  } else if (!visibleNotes.length && isFiltering) {
    listMessage = "No notes have all the selected tags.";
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
      emptyText: totalNotes
        ? "Every note is in a collection."
        : "No notes yet.",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {!totalNotes && (
        <p className="p-2 text-sm text-muted-foreground">
          No notes yet. Create your first one with &ldquo;New note&rdquo;.
        </p>
      )}
      {totalNotes > 0 && (
        <TagFilter
          tags={filterTags}
          selected={activeTagIds}
          onToggle={toggleTag}
          onClear={() => setSelectedTagIds(new Set())}
        />
      )}
      {totalNotes > 0 && (
        <p aria-live="polite" className="px-2 text-sm text-muted-foreground empty:hidden">
          {listMessage}
        </p>
      )}
      {groups.map((group) => {
        const groupNotes = visibleNotes.filter(
          (note) => groupKey(note.collection_id) === group.key,
        );
        // While filtering or searching, hide groups without a matching note.
        if (isNarrowed && !groupNotes.length) return null;
        // Without a search or tag filter, the count includes the group's notes that aren't loaded yet.
        const groupCount = isNarrowed
          ? groupNotes.length
          : Math.max(countByGroup.get(group.key) ?? 0, groupNotes.length);
        const notLoadedCount = groupCount - groupNotes.length;
        const isOpen = expanded.has(group.key);

        return (
          <section key={group.key}>
            {group.collection && renamingKey === group.key ? (
              <RenameCollectionForm
                collection={group.collection}
                onDone={() => setRenamingKey(null)}
              />
            ) : (
              <div className="flex items-center gap-1 rounded-md transition-colors hover:bg-accent">
                <button
                  type="button"
                  onClick={() => toggle(group.key)}
                  aria-expanded={isOpen}
                  className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-sm font-medium"
                >
                  <ChevronRight
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-90",
                    )}
                  />
                  <span className="truncate">{group.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {groupCount}
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
              <div className="pb-2 pl-4 pt-1">
                {groupNotes.length > 0 && <NoteList notes={groupNotes} />}
                {notLoadedCount > 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    {notLoadedCount} older {notLoadedCount === 1 ? "note isn’t" : "notes aren’t"}{" "}
                    loaded yet.{" "}
                    {canLoadMore
                      ? "Use “Load more notes” below."
                      : "Search or filter by tags to find them."}
                  </p>
                )}
                {!groupCount && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    {group.emptyText}
                  </p>
                )}
              </div>
            )}
          </section>
        );
      })}
      {canLoadMore && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1 text-muted-foreground"
          onClick={loadMore}
          disabled={isPending}
        >
          {isPending ? "Loading…" : "Load more notes"}
        </Button>
      )}
      {hasMore && !canLoadMore && (
        <p className="px-2 text-xs text-muted-foreground">
          {isNarrowed
            ? `Showing the ${NOTES_MAX} most recently edited matches. Narrow the search or add tags to find the rest.`
            : `Showing the ${NOTES_MAX} most recently edited notes. Search or filter by tags to find older ones.`}
        </p>
      )}
    </div>
  );
}
