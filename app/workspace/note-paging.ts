// How many notes the sidebar loads at first, and how many more each "Load more notes" adds.
export const NOTES_PAGE_SIZE = 50;

// The most notes the sidebar loads in total. Supabase returns at most 1000 rows per request,
// so this stays well below that. Past it, search and the tag filter still reach every note.
export const NOTES_MAX = 500;
