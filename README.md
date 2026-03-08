# Release-Parliament (Canada)

A Next.js 15 full-stack app for exploring Canadian parliamentary legislation with OpenParliament data, bill vote transparency, and simulated citizen voting.

## Project goals
- Expose federal bill and vote data in a public-friendly interface.
- Start with a robust **OpenParliament bill list endpoint** as the first core feature.
- Add a basic sign-in flow so user votes can be associated to identities.
- Persist user votes using a database-table-compatible schema.

## Feature list
- **OpenParliament bill list endpoint (first feature):** `GET /api/openparliament/bills`
  - Supports: `limit`, `offset`, `introduced__gte`, `q`, `status_code`, `sponsor_politician`, `law`, `number`.
  - Uses server-side fetch with `revalidate: 3600`.
- **Bill browser UI:** SSR list + search and status filtering.
- **Bill detail page:** summary, status, and vote breakdown chart.
- **Basic authentication flow:**
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
  - Login page at `/login`.
- **User voting API:** `GET/POST /api/bills/:id/user-vote` (auth required).
- **Database table design included:** migration for `user_votes` table.

## Technology stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Zod validation
- Simple cookie-session auth (extendable to Clerk/NextAuth)
- JSON file persistence for local dev + SQL migration for production table

## API data sources
### Primary source: OpenParliament
- Bills: `https://api.openparliament.ca/bills/`
- Votes: `https://api.openparliament.ca/votes/`
- Politicians: `https://api.openparliament.ca/politicians/`
- Example: `https://api.openparliament.ca/votes/?date__gte=2025-01-01`

### Supplementary official sources
- LEGISinfo (bill text/status)
- House of Commons votes
- Senate votes

## Folder structure

```text
Release-Parliament/
├── app/
├── components/
├── lib/
├── types/
├── db/
│   └── migrations/001_create_user_votes.sql
├── public/
├── .env.example
├── package.json
└── README.md
```

## Local setup
1. Clone:
   ```bash
   git clone <repo-url>
   cd Release-Parliament
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure env:
   ```bash
   cp .env.example .env.local
   ```
4. (Optional) configure demo users for basic auth:
   ```env
   BASIC_AUTH_USERS=alice@example.com:password123:Alice,bob@example.com:password456:Bob
   ```
   If omitted, default demo credentials are:
   - `demo@releaseparliament.ca`
   - `demo1234`
5. Start dev server:
   ```bash
   npm run dev
   ```

## Database table
Production table migration is provided:
- `db/migrations/001_create_user_votes.sql`

Table columns:
- `id` (UUID, PK)
- `user_id` (TEXT)
- `bill_id` (TEXT)
- `vote` (`Yea|Nay|Abstain`)
- `created_at` (TIMESTAMPTZ)

## Notes
- Local development currently writes votes to `db/user_votes.json` for zero-setup testing.
- For production, execute the SQL migration and swap `lib/db.ts` to your Postgres/Supabase/Neon adapter.
