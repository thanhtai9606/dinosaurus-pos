# Agent instructions (dinosaurus-pos)

Human-oriented onboarding: see `docs/CONTEXT.md` and `Makefile` (`make help`).

## Agent skills

### Issue tracker

Work items live on GitLab for this project (`devops/dinosaurus-pos`); custom tracker notes may apply. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context repo: **`docs/CONTEXT.md`** is the glossary; ADRs under `docs/adr/`. See `docs/agents/domain.md`.

### Cursor rules

Always-on project rules: `.cursor/rules/*.mdc` (Zustand list state, DataGrid, Go GET cache, domain context).

### Conventions

- **Commits / push:** only when the user asks explicitly.
- **Scope:** match existing patterns in `internal/` and `web/`; i18n vi/en/id for UI strings.
- **Verify:** `go build ./cmd/app/...`, `pnpm run build` in `web/` before claiming done.
