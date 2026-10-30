// The longest text the workspace accepts. The inputs stop at these lengths, and the Server Actions
// reject anything longer, because an action can also be called directly with any value.
export const TITLE_MAX_LENGTH = 200;
export const BODY_MAX_LENGTH = 100_000;
export const NAME_MAX_LENGTH = 50; // collection and tag names
export const SEARCH_MAX_LENGTH = 200;

// The most tags the tag filter accepts at once. Each selected tag adds a join to the notes query.
export const FILTER_TAGS_MAX = 20;
