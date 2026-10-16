https://supabase.com/docs/reference/javascript/using-filters

# supabase-js: Using Filters

Reference from the official Supabase JavaScript client documentation (source URL above), as cited in the tag system prompt.

Filters restrict a query to rows matching conditions, and they work on `select()`, `update()`, `upsert()` and `delete()`. The docs also show how to filter on a referenced (joined) table by adding `!inner` to the select, which keeps only parent rows that have a matching child row.

Example adapted to this project:

```js
const { data, error } = await supabase
  .from('notes')
  .select(`
    id,
    title,
    note_tags!inner (
      tag_id
    )
  `)
  .eq('note_tags.tag_id', tagId)
```
