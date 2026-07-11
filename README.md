# Stamina Timer

A privacy-focused training timer with guided sessions, progress analytics, goals, and an optional AI coach. Built as a production Next.js application backed by Supabase.

[Live application](https://staminatimer.com)

## Features

- Guided training and program timers
- Detailed analytics and progress tracking
- Expiring, opaque-ID sharing
- Installable PWA with offline support
- Server-side AI coach with authentication, CSRF protection, and rate limiting
- Responsive and accessible light/dark interfaces

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Supabase
- Chart.js
- shadcn/ui

## Architecture

```text
Next.js App Router
├── public pages and PWA shell
├── authenticated dashboard and training flows
├── server API routes for AI and share creation
└── Supabase
    ├── authentication
    ├── PostgreSQL with row-level security
    └── migrations and RPCs
```

The browser uses the public Supabase key, so authorization is enforced by row-level security rather than by treating that key as a secret. Public share links never receive table-level read access: the share page calls a narrow RPC with one unguessable UUID, and the RPC returns only that non-expired payload.

## Getting Started

```bash
# Clone the repository
git clone https://github.com/carterlasalle/staminatimer.git
cd staminatimer

# Install the pinned Yarn release and dependencies
corepack enable
yarn install --immutable

# Set up environment variables
cp .env.example .env.local

# Start development server
yarn dev
```

## Environment Variables

See [`.env.example`](.env.example) for the full list. The minimum configuration is:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_server_only_key
CSRF_SECRET=your_random_32_byte_secret
```

Never prefix `GEMINI_API_KEY` or `CSRF_SECRET` with `NEXT_PUBLIC_`.

## Database Setup

For a new database, apply `supabase/schema.sql`. Existing environments should apply every file under `supabase/migrations/` in timestamp order. The migration `20260711000000_secure_shared_sessions.sql` is required before deploying the RPC-based public share page.

After running the schema, seed your achievements as needed and ensure RLS is enabled. The app relies on Supabase Realtime for some updates.

Optional seed for achievements: run `supabase/seed_achievements.sql` in your Supabase SQL editor.

## PWA

- Offline support via service worker (`public/sw.js`)
- Manifest at `public/manifest.json`
- Robots and sitemap in `public/`

## Scripts

- `yarn dev` – Start dev server
- `yarn build` – Production build
- `yarn start` – Start production server
- `yarn lint` – ESLint checks
- `yarn typecheck` – TypeScript type checks
- `yarn test` – Unit tests
- `yarn test:watch` – Unit tests in watch mode
- `yarn format` / `yarn format:check` – Prettier formatting

## CI

GitHub Actions installs from the immutable lockfile, then runs lint, type checking, unit tests, and a production build on pull requests and pushes to `main`.

## Privacy and security

- Training records are scoped to the authenticated user with PostgreSQL RLS.
- Public shares contain copied session data, use random UUIDs, and can expire.
- Anonymous clients cannot list `shared_sessions`; retrieval is limited to the single ID passed to `get_shared_session`.
- AI requests are authenticated, origin checked, CSRF protected, size limited, and rate limited.
- Microsoft Clarity is optional and is enabled only when its public project ID is configured.

Report vulnerabilities using the private process in [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the local checks and database-change requirements.

## License

MIT License - see LICENSE for details
