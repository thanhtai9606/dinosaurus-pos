# Data grid & modals

## AppModal (`components/common/AppModal.tsx`)

Generic dialog with `size`: `sm` | `md` | `lg` | `xl` | `full`, click-outside to close (`dismissible`, default true).

## DialogContent (`components/ui/dialog.tsx`)

Use `size` and `dismissible` on any raw `Dialog` instead of hand-rolled `max-w-*`.

## DataGrid (`components/data-table/DataGrid.tsx`)

- Column icons + sort (client or server via `server.onSortChange`)
- Show/hide columns (optional `storageKey` for localStorage)
- Server pagination via `server.pagination` + `ListPagination`

Example server mode is on the Users list page.
