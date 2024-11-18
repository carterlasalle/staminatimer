# Stamina Training Timer

A Next.js application for tracking and improving personal endurance metrics through timed intervals and data analysis.

## Features

- Multiple synchronized timers
- Detailed analytics and progress tracking
- Historical data visualization
- Dark mode support
- Mobile responsive design

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- Chart.js
- Shadcn/UI

## Getting Started

  ```bash
  # Clone the repository
  git clone https://github.com/yourusername/staminatimer.git

  # Install dependencies
  npm install

  # Set up environment variables
  cp .env.example .env.local

  # Start development server
  npm run dev
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
  -- Enable UUID extension
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Create required tables
  -- See schema.sql for full database setup
  ```

## Contributing

Contributions welcome! Please read the contributing guidelines first.

## License

MIT License - see LICENSE for details