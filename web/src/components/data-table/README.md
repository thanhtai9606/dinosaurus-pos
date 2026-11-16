# Data grid & modals

## AppModal (`components/common/AppModal.tsx`)

Generic dialog with `size`: `sm` | `md` | `lg` | `xl` | `full`, click-outside to close (`dismissible`, default true).

## DialogContent (`components/ui/dialog.tsx`)

Use `size` and `dismissible` on any raw `Dialog` instead of hand-rolled `max-w-*`.

## Helpers

- `applyClientFilters.ts` — shared row filtering for column quick-filters.

## DataGrid (`components/data-table/DataGrid.tsx`)

- Column icons + sort (client or server via `server.onSortChange`)
- Show/hide columns (optional `storageKey` for localStorage)
- **Client pagination** (default `enableClientPagination`, `defaultPageSize`) via `ListPagination`
- **Server pagination** via `server.pagination` + `onPageChange` (client pagination disabled for slicing; column filters still apply to the current page rows)
- **Page search (preferred)**: use `ListSearchToolbar` + API `search` for server-paginated lists. Column filters only see the current page.
- **Per-column quick filters (opt-in)**: set `enableColumnFilters` on `DataGrid` and `filterable: true` on columns — for small client-only grids.

Example server mode is on the Users list page.
