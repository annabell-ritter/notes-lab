https://supabase.com/docs/reference/javascript/using-filters-textsearch

# supabase-js: `textSearch`

Reference copied from the official Supabase JavaScript client documentation (source URL above).

## Signature

```ts
textSearch(column, query, options?)
```

## Description

Only relevant for `text` and `tsvector` columns. Match only rows where `column` matches the query string in `query`.

For more information, see [Postgres full text search](https://supabase.com/docs/guides/database/full-text-search).

## Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `column` | `ColumnName` or `string` | yes | The text or tsvector column to filter on |
| `query` | `string` | yes | The query text to match with |
| `options` | `object` | no | Named parameters |

## Return type

`this` (the filter builder, so further filters can be chained).
