"use client";

import { useSelectedLayoutSegment } from "next/navigation";

// Marks that a note is open, so on phones the workspace layout shows the note instead of the list.
// It reads the URL rather than the page content, because Next.js keeps visited pages in the DOM (hidden) after navigating away.
export function NoteViewFlag() {
  const segment = useSelectedLayoutSegment();
  return segment ? <span data-note-view hidden /> : null;
}
