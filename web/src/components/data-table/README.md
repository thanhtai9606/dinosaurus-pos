# Data grid & modals

## AppModal (`components/common/AppModal.tsx`)

Generic dialog with `size`: `sm` | `md` | `lg` | `xl` | `full`, click-outside to close (`dismissible`, default true).

## DialogContent (`components/ui/dialog.tsx`)

Use `size` and `dismissible` on any raw `Dialog` instead of hand-rolled `max-w-*`.

## DataGrid (`components/data-table/DataGrid.tsx`)

- Column icons + sort (client or server via `server.onSortChange`)
- Show/hide columns (optional `storageKey` for localStorage)
- **Client pagination** (default `enableClientPagination`, `defaultPageSize`) via `ListPagination`
- **Server pagination** via `server.pagination` + `onPageChange` (client pagination disabled for slicing; column filters still apply to the current page rows)
- **Per-column quick filters**: set `filterable: true` on a column; optional `filterType` (`text` | `select`), `filterOptions`, `filterAccessor` (when the cell value differs from the filter string)

Example server mode is on the Users list page.
