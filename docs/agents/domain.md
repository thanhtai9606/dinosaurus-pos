# Domain docs

How engineering skills should consume domain documentation in **dinosaurus-pos**.

## Before exploring, read these

- **`docs/CONTEXT.md`** — primary glossary and architecture map for this repo (Vietnamese; keep in sync when adding major modules).
- **`.cursor/rules/project-domain-context.mdc`** — short agent rules mirroring CONTEXT (always applied in Cursor).
- **`docs/adr/`** — architecture decision records (create when resolving non-trivial design choices).

Matt Pocock skills often refer to `GLOSSARY.md`; in this project **`docs/CONTEXT.md` is the glossary**. Do not require a root `GLOSSARY.md` unless the team later adds one.

If `docs/adr/` is empty, proceed silently. ADRs are added lazily when decisions are made (e.g. via `/grill-with-docs` or `/domain-modeling`).

## Layout (single-context)

```
/
├── docs/
│   ├── CONTEXT.md          ← glossary + module map (source of truth)
│   └── adr/                ← numbered ADRs
├── .cursor/rules/          ← Cursor rules (lists, DataGrid, cache, …)
└── web/ + internal/        ← implementation
```

This is **not** a pnpm monorepo; one shared CONTEXT covers backend and frontend.

## Use the project's vocabulary

When naming domain concepts (issues, tests, UI copy keys), align with terms in `docs/CONTEXT.md` (e.g. stock receipt, customer debt, `order_no`, tenant, shift).

Avoid synonyms the CONTEXT explicitly rejects.

## Flag ADR conflicts

If a proposal contradicts an ADR under `docs/adr/`, say so explicitly, e.g.:

> Contradicts ADR-0003 (…), but worth reopening because …
