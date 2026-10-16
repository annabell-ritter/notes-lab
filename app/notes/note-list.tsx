"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Note } from "@/lib/db";
import { cn } from "@/lib/utils";

export function NoteList({ notes }: { notes: Note[] }) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-1">
      {notes.map((note) => {
        const href = `/notes/${note.id}`;
        const isActive = pathname === href;

        return (
          <li key={note.id}>
            <Link
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-2 hover:bg-accent",
                isActive && "bg-accent",
              )}
            >
              <span className="block truncate text-sm font-medium">
                {note.title}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {note.body || "No content"}
              </span>
              {note.tags.length > 0 && (
                <span className="mt-1 flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded bg-secondary px-1.5 py-0.5 text-[11px] leading-none text-secondary-foreground"
                    >
                      {tag.name}
                    </span>
                  ))}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
