# PMTI · Perfect Match Type Indicator

A live two-player game for Cornell duos. Each player uses their own phone. You play one Cornell day
of quick rounds together, with secret picks and synchronized reveals. At the end you get a
Cornell-themed duo type, such as _Lynah & Lindseth_ or _Olin & Uris_, with a role for each of you.

Stack: Next.js 16 (App Router, Vercel) · Supabase (Postgres, Auth, Realtime, Edge Functions).

## Local setup

Requires Node 22+, pnpm, and Docker. The Supabase CLI comes with the dev dependencies.

1. `pnpm i`
2. Create `supabase/.env` (git-ignored):
   ```
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=...
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=...
   EMBED_SECRET=<any random string>
   ```
3. Create `.env.development.local` (git-ignored). The keys come from `pnpm db:status`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
   NEXT_PUBLIC_DEV_LOGIN=1
   EMBED_URL=http://127.0.0.1:54321/functions/v1/embed
   EMBED_SECRET=<same as above>
   ```
4. `pnpm db:start`, then `pnpm db:reset` (applies migrations), then `pnpm db:seed-pool` (seeds the
   free-text scoring pool; rerun it after every reset).
5. `pnpm dev`, then open http://localhost:3000. Use the dev sign-in with any `@cornell.edu` address.
   Two browser profiles make two players.

## Google sign-in

The Google button sends players to Google through Supabase and back to `/auth/callback`, which
returns them to the page they started on. It needs the Google client ID and secret in Supabase:

- **Google Cloud console**, on the OAuth client: add these as authorized redirect URIs:
  `http://127.0.0.1:54321/auth/v1/callback` (local) and `https://<project-ref>.supabase.co/auth/v1/callback` (hosted).
- **Local:** `supabase/.env` (above) holds the ID and secret; `supabase/config.toml` already allows
  redirects back to `localhost:3000`. Restart Supabase after changing either.
- **Hosted Supabase dashboard:** under Authentication → Providers → Google, enter the client ID and secret.
  Under URL Configuration, set the Site URL to the production address, and add
  `https://<production-domain>/**` (plus `https://*-<vercel-team>.vercel.app/**` for preview deploys) to Redirect URLs.

## Checks

- `pnpm typecheck` · `pnpm lint`
- `pnpm test`: engine, scoring, and a type-distribution simulation (4,000 simulated couples).
- `pnpm exec playwright test`: browser tests, including two players playing a full game in sync.

## Layout

- `src/game/`: pure game logic, with no I/O.
  - `engine.ts`: progress is derived from the move log, plus the sanitized per-player view.
  - `scoring.ts`: turns a finished game into a duo type.
  - `types.ts`: the 14 duo types.
  - `decks/`: the content. Decks are immutable once shipped; new content gets a new id.
- `src/server/`: rooms (locked transactions), auth, embeddings and free-text similarity.
- `src/client/useRoom.ts`: keeps a player in sync (realtime ping, refetch, polling fallback).
- `supabase/`: migrations, the `embed` Edge Function, and local config.

## Contact

perfectmatch@cornell.edu
