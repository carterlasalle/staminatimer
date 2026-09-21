# Contributing

## Local setup

1. Enable Corepack: `corepack enable`.
2. Install the pinned dependency graph: `yarn install --immutable`.
3. Copy `.env.example` to `.env.local` and add development credentials.
4. Start the application with `yarn dev`.

## Required checks

Run these before opening a pull request:

```bash
yarn lint
yarn typecheck
yarn test
yarn build
yarn format:check
```

Add or update tests when changing calculations, validation, security helpers, or API behavior. Format the files you change with `yarn prettier --write <paths>`.

## Linting and formatting policy

`yarn lint` runs ESLint and then `oxlint` (the vendored `anti-slop` rule set under `tools/oxlint/anti-slop/`).

Prettier owns line layout; `yarn format:check` is the authority for it. The `anti-slop/require-readable-spacing` rule is therefore configured as a **warning**: it wants certain statements expanded onto their own line, which Prettier collapses back onto a single line, so the two rules can never both be satisfied. Prettier wins because it has the repository's own gate.

Severity is otherwise meaningful:

- **Errors** block `yarn lint`. Every rule is an error by default, so new code anywhere is held to the full rule set.
- **Warnings** are advisory and do not block. They stay visible on every `yarn lint` run.

`.oxlintrc.json` contains one `overrides` entry listing pre-existing files whose findings are downgraded to warnings. Those findings predate this rule set and live in modules that are not part of the Guided Program V2 work. The list is deliberately explicit so the scope is auditable: remove a path from the list once that file is clean, and do not add new paths to it. Fix findings in the code you are already touching rather than growing that list.

## Database changes

Keep `supabase/schema.sql` representative of a fresh installation. Every production change must also have a forward-only, timestamped file under `supabase/migrations/` so an existing environment can be upgraded safely.

Never weaken row-level security to make a browser query work. Prefer an authenticated server route or a narrow RPC that returns only the minimum required data.

Private per-user tables are read-only to clients: revoke table privileges from `anon` and `authenticated`, grant only `SELECT`, and route every write through a `SECURITY DEFINER` RPC that re-establishes ownership from `auth.uid()`. `program_v2_*` follows this pattern; copy it for new private tables.

## Pull requests

Keep changes focused. Describe the user impact, security or migration implications, and the commands used to validate the change. Do not include credentials, production exports, or personal training data in fixtures or screenshots.
