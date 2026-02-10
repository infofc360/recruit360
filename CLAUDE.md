# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Recruit360 is a college soccer recruiting database built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and Supabase PostgreSQL. It provides an interactive Leaflet map and filtering interface for browsing ~450 college soccer programs across NCAA D1/D2/D3 divisions.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (eslint-config-next with core web vitals + TypeScript)
```

Data processing scripts (run from project root):
```bash
npx tsx scripts/process-data.ts       # Merge CSV data into colleges.json/conferences.json
node scripts/addD2Colleges.js         # Add D2 colleges from CSV
node supabase/seed.js > supabase/seed.sql  # Generate SQL seed from colleges.json
```

## Architecture

### Data Flow
All state lives in `src/app/page.tsx` (client component) and is passed down via props. The page fetches from `/api/colleges` on mount, then all filtering happens client-side with `useMemo`. There is no client-side router state or URL-based filtering.

### Fallback Pattern
API routes (`src/app/api/colleges/route.ts`, `src/app/api/conferences/route.ts`) first try Supabase, then fall back to local JSON files in `data/`. The app works fully offline without Supabase configured.

### Key Modules
- **`src/app/page.tsx`** — Main entry point; owns all state (colleges, selectedId, hoveredId, filters) and filtering logic
- **`src/components/sidebar/FilterPanel.tsx`** — Multi-select filter UI (divisions, regions, states, conferences, search)
- **`src/components/sidebar/CollegeList.tsx`** + **CollegeCard.tsx** — Scrollable college list with expandable coaching staff details
- **`src/components/map/CollegeMap.tsx`** — Leaflet map with circle markers; dynamically imported (client-only) to avoid SSR/hydration issues
- **`src/lib/supabase.ts`** — Supabase client initialization and database type definitions
- **`src/types/college.ts`** — Core interfaces: `College`, `Coach`, `Region`, `CollegeFilters`

### Database (Supabase PostgreSQL)
Schema in `supabase/schema.sql`. Two tables:
- **colleges** — id (text PK), name, division (D1/D2/D3), conference, city, state, region, lat/lng, website
- **coaches** — id (serial PK), college_id (FK → colleges), name, title, email, phone

RLS is enabled with public read-only access. No authentication required.

### Filtering Order
Filters cascade: Division → Conference → Region (clears states) → State → Search text. Regions map to predefined state lists. Conferences are dynamically filtered based on selected divisions/regions/states.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Both are public/client-safe. If unset, the app falls back to local JSON data.

## Conventions

- Path alias: `@/*` maps to `src/*`
- Components use PascalCase filenames, grouped by feature (`sidebar/`, `map/`)
- All interactive components use `'use client'` directive
- Tailwind v4 with PostCSS (no tailwind.config — uses CSS-based config in `globals.css`)
- Leaflet CSS overrides are in `src/app/globals.css`
