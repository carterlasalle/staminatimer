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
```

Add or update tests when changing calculations, validation, security helpers, or API behavior. Format the files you change with `yarn prettier --write <paths>`.

## Database changes

Keep `supabase/schema.sql` representative of a fresh installation. Every production change must also have a forward-only, timestamped file under `supabase/migrations/` so an existing environment can be upgraded safely.

Never weaken row-level security to make a browser query work. Prefer an authenticated server route or a narrow RPC that returns only the minimum required data.

## Pull requests

Keep changes focused. Describe the user impact, security or migration implications, and the commands used to validate the change. Do not include credentials, production exports, or personal training data in fixtures or screenshots.
