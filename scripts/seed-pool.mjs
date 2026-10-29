// Seeds the free-text scoring pool (texts rows without a room) from supabase/seed-pool.json.
// Idempotent. Run against local: pnpm db:seed-pool. Against another DB: pass its env file:
//   node --env-file=<file with DATABASE_URL, EMBED_URL, EMBED_SECRET> scripts/seed-pool.mjs
import { readFileSync } from "node:fs";
import postgres from "postgres";

const { DATABASE_URL, EMBED_URL, EMBED_SECRET } = process.env;
if (!DATABASE_URL || !EMBED_URL || !EMBED_SECRET) throw new Error("Missing DATABASE_URL, EMBED_URL or EMBED_SECRET");

const pool = JSON.parse(readFileSync(new URL("../supabase/seed-pool.json", import.meta.url), "utf8"));
const sql = postgres(DATABASE_URL, { prepare: false, max: 1 });

async function embed(texts) {
  const res = await fetch(EMBED_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "x-embed-secret": EMBED_SECRET },
    body: JSON.stringify({ texts }),
  });
  if (!res.ok) throw new Error(`embed HTTP ${res.status}`);
  return (await res.json()).embeddings;
}

for (const [promptId, texts] of Object.entries(pool)) {
  const have = new Set(
    (await sql`select body from texts where room_id is null and prompt_id = ${promptId}`).map((r) => r.body)
  );
  const todo = texts.filter((t) => !have.has(t));
  for (let i = 0; i < todo.length; i += 4) {
    const batch = todo.slice(i, i + 4);
    const vectors = await embed(batch);
    for (const [j, body] of batch.entries()) {
      await sql`insert into texts (prompt_id, body, embedding)
                values (${promptId}, ${body}, ${`[${vectors[j].join(",")}]`}::extensions.halfvec)`;
    }
  }
  console.log(`${promptId}: ${todo.length} added, ${have.size} already there`);
}
await sql.end();
