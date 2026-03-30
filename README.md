# Stamina Training Timer

A production-ready Next.js application for tracking and improving personal endurance metrics through timed intervals and data analysis.

## Features

- Multiple synchronized timers
- Detailed analytics and progress tracking
- Historical data visualization
- Dark mode support
- Mobile responsive design

## Tech Stack

- Next.js 16
- TypeScript
- Tailwind CSS
- Supabase
- Chart.js
- ShadCn/UI

## Getting Started

  ```bash
  # Clone the repository
  git clone https://github.com/yourusername/staminatimer.git

  # Install dependencies
  corepack enable
  yarn install --immutable

  # Set up environment variables
  cp .env.example .env.local

  # Start development server
  yarn dev
  ```

## Environment Variables

Required environment variables:

  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```

## Database Setup

Run the SQL schema in your Supabase project:

  ```sql
  -- Create required tables & RLS policies
  -- See supabase/schema.sql for full database setup
  ```

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
- `yarn format` / `yarn format:check` – Prettier formatting

## CI

GitHub Actions workflow runs lint, typecheck, and build on PRs and pushes to `main`/`master`.

## Contributing

Contributions welcome! Please read the contributing guidelines first.

## License

MIT License - see LICENSE for details
