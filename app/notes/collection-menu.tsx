"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Collection } from "@/lib/db";
import { deleteCollectionAction, renameCollectionAction } from "./actions";

export function CollectionMenu({
  collection,
  onRename,
  onError,
}: {
  collection: Collection;
  onRename: () => void;
  onError: (message: string | null) => void;
}) {
  const [isDeleting, startDeleting] = useTransition();

  function handleDelete() {
    if (
      !confirm(
        `Delete the collection "${collection.name}"? Its notes are kept and move to Uncollected.`,
      )
    ) {
      return;
    }

    onError(null);
    startDeleting(async () => {
      const result = await deleteCollectionAction(collection.id);
      if (result.error) onError(result.error);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          disabled={isDeleting}
          aria-label={`Options for ${collection.name}`}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onRename}>
          <Pencil />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleDelete} className="text-destructive">
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RenameCollectionForm({
  collection,
  onDone,
}: {
  collection: Collection;
  onDone: () => void;
}) {
  const [name, setName] = useState(collection.name);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim() === collection.name) {
      onDone();
      return;
    }

    startSaving(async () => {
      const result = await renameCollectionAction(collection.id, name);
      if (result.error) setError(result.error);
      else onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1 px-1 py-1">
      <Input
        aria-label="Collection name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onDone();
        }}
        autoFocus
        required
        disabled={isSaving}
        className="h-8"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
