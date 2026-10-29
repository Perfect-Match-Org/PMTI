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
5. `pnpm dev`, then open http://localhost:3000. The dev sign-in takes any name (`Bob` signs in as
   `bob@cornell.edu`; nothing is checked, no Google needed). For the second player, open
   http://127.0.0.1:3000 in another tab of the same browser: a different address keeps a separate
   sign-in, so you can watch both screens sync side by side. A full address such as
   `someone@gmail.com` works too.

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

## Deploy

Production is a hosted Supabase project plus a Vercel project. Do the Supabase steps first, because
the Vercel variables come from them.

1. **Supabase project.** Create one, then link the CLI to it and apply the migrations:
   ```
   pnpm exec supabase link --project-ref <project-ref>
   pnpm exec supabase db push
   ```
   `supabase/migrations/` creates the tables, the `vector` extension and the realtime policies.
2. **Edge Function.** Pick a random string for `EMBED_SECRET`, then set it and deploy:
   ```
   pnpm exec supabase secrets set EMBED_SECRET=<random string>
   pnpm exec supabase functions deploy embed
   ```
   The function answers 403 unless the request's `x-embed-secret` header matches. `config.toml` turns
   JWT checking off for it, because our server sends that header instead of a user token. Use the same
   string for `EMBED_SECRET` on Vercel.
3. **Providers.** Set up Google as in [Google sign-in](#google-sign-in). Then, under Authentication →
   Providers, turn **Email** off. The dev sign-in uses email and password without checking the
   address, so with Email on, anyone could create an account under someone else's email.
4. **Vercel environment variables.** Set these for Production. The two `NEXT_PUBLIC_` ones are baked
   in at build time, so changing them needs a redeploy.
   - `DATABASE_URL`: the Supabase transaction pooler connection string. `src/server/db.ts` turns
     prepared statements off because it expects the transaction pooler. Every room read and write uses it.
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://<project-ref>.supabase.co`.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key (`sb_publishable_...`). The
     browser, the server and `src/proxy.ts` use these two for sign-in and realtime.
   - `EMBED_URL`: `https://<project-ref>.supabase.co/functions/v1/embed`, the function from step 2.
   - `EMBED_SECRET`: the same string as in step 2. If `EMBED_URL` or `EMBED_SECRET` is missing, the
     game still plays, but free-text rounds get no vibe match.
   - `CRON_SECRET`: any random string. `vercel.json` calls `/api/cron/keepalive` daily at 15:00 UTC.
     The route runs `select 1` and returns 401 unless its `Authorization: Bearer` header equals
     `CRON_SECRET` (Vercel sends that header once the variable exists). Without the variable every
     call gets 401, the database sees no traffic from it, and a free Supabase project pauses after
     about 7 idle days.
   - Do **not** set `NEXT_PUBLIC_DEV_LOGIN`. It shows the dev sign-in form, and that form's password
     is in the client code.
5. **Seed the free-text pool.** `pnpm db:seed-pool` reads `.env.development.local`, so it targets
   local. For hosted, put `DATABASE_URL`, `EMBED_URL` and `EMBED_SECRET` (the values from step 4) in a
   git-ignored file such as `.env.hosted`, then run:
   ```
   node --env-file=.env.hosted scripts/seed-pool.mjs
   ```
   It needs steps 1 and 2 done first, and it is safe to rerun: it skips texts already there. Until a
   prompt has 10 other answers, its free-text round has no vibe match.
6. **Deploy, then check the keepalive.** `curl -H "Authorization: Bearer <CRON_SECRET>"
   https://<production-domain>/api/cron/keepalive` should return `{"ok":true,...}` with counts of
   what it cleaned up. A 401 means `CRON_SECRET` is missing or different on Vercel.

## Checks

- `pnpm typecheck` · `pnpm lint`
- `pnpm test`: engine, scoring, deck checks, and a type-distribution simulation (4,000 simulated couples).
- `pnpm exec playwright test`: browser tests, including two players playing a full game in sync.

## Layout

- `src/game/`: pure game logic, with no I/O.
  - `engine.ts`: progress is derived from the move log, plus the sanitized per-player view.
  - `scoring.ts`: turns a finished game into a duo type.
  - `types.ts`: the 14 duo types.
  - `decks/`: the questions. See [Editing questions](#editing-questions).
- `src/server/`: rooms (locked transactions), auth, embeddings and free-text similarity.
- `src/client/useRoom.ts`: keeps a player in sync (realtime ping, refetch, polling fallback).
- `supabase/`: migrations, the `embed` Edge Function, and local config.

## Editing questions

The questions are in `src/game/decks/cornell-day-1.ts`. Each game remembers which deck it started
with and saves answers as positions ("round 0, option 0"). Its pages are rebuilt from that deck every
time they open, finished games included.

- **Rewording** a scene, prompt or option: edit it in place. Every game, old ones too, shows the new
  words.
- **Adding, removing or reordering** rounds, options or items: copy the file under a new `id`
  (`cornell-day@2`), register it in `decks/index.ts` and point `CURRENT_DECK` at it. New games get
  the new deck and earlier games keep theirs, so never delete a deck that games have used. Before
  launch, editing in place and resetting the database is fine.
- **Changing weights** (`w`, `nudge`) shifts how often each duo type comes up. `pnpm test` fails if
  any type falls outside 4–15% of simulated games.
- **A new free-text question** needs at least 10 seed answers per box in `supabase/seed-pool.json`
  under its `poolKey`, then the seed script run against each database.

`pnpm test` also fails if a landing sample no longer fits the deck, a branch names a round that isn't
earlier in it, or two rounds share an id.

## Contact

cornell.perfectmatch@gmail.com
