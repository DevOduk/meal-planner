# Meal Planner

A React + Vite meal planning application with Supabase authentication, onboarding, and daily meal generation.

## Features

- Email/password user authentication via Supabase
- Onboarding flow for user preferences and starter meals
- Daily meal planner with breakfast, lunch, supper, and fruit selections
- Calendar view that displays meals for each day
- Add and remove custom foods
- Account page with profile details and logout
- Responsive bottom navigation for mobile and desktop

## Tech stack

- React 19
- Vite
- Supabase JS
- Material UI
- Bootstrap
- Tailwind CSS support

## Project structure

- `src/App.jsx` — main app logic and UI
- `src/supabaseClient.js` — Supabase client initialization
- `src/main.jsx` — React entry point
- `src/index.css` — global styling

## Setup

1. Install dependencies

```bash
npm install
```

2. Create a `.env` file at the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

3. Start the development server

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Preview production build

```bash
npm run preview
```

## Linting

```bash
npm run lint
```

## Supabase notes

- `src/supabaseClient.js` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from env variables.
- `planner_profiles` stores app-specific user data such as meals, onboarding state, and profile values.
- Use Supabase auth data for authoritative fields like `email`, `email_confirmed_at`, `created_at`, and `last_sign_in_at`.

## Recommended improvements

- Separate UI into reusable components
- Add explicit loading and error states
- Improve Supabase RLS policies for secure profile access
- Sync auth user data and app profile data more reliably

## License

This repository has no license configured yet. Add one if you want to share it publicly.
