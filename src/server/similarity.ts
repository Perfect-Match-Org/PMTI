import "server-only";
import type { Db } from "./db";

const POOL_SIZE = 200;
const MIN_POOL = 10;

/**
 * Daily: a game answer's vector is only needed while it's among the latest POOL_SIZE distinct answers
 * to its prompt, the pool that new answers are compared against. Older ones are cleared once their
 * round is scored (both players answered; a game can pause for days); the text and its score stay,
 * and the seed answers (no room) are always kept.
 */
export async function pruneEmbeddings(db: Db): Promise<number> {
  const rows = await db`
    with latest as (
           select distinct on (prompt_id, lower(trim(body))) id, prompt_id, created_at from texts
           where embedding is not null
           order by prompt_id, lower(trim(body)), created_at desc),
         kept as (
           select id from (
             select id, row_number() over (partition by prompt_id order by created_at desc) as rank from latest
           ) ranked
           where rank <= ${POOL_SIZE})
    update texts t set embedding = null
    where t.embedding is not null
      and t.room_id is not null
      and exists (select 1 from texts o where o.room_id = t.room_id and o.round = t.round and o.player_id <> t.player_id)
      and t.id not in (select id from kept)
    returning id`;
  return rows.length;
}

export type TextRef = { id: string; body: string; promptId: string; hasEmbedding: boolean };

/** Same words regardless of case, punctuation or order: "Funny, warm!" matches "warm funny". */
export function sameWords(a: string, b: string): boolean {
  const bag = (s: string) =>
    s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean).sort().join(" ");
  return bag(a) === bag(b);
}

// gte-small puts the same dish at 0.94-0.98 ("mac and cheese" ~ "mac n cheese" is 0.94) and an
// unrelated one at 0.76-0.80, measured against the comfort-order pool.
const NEAR_IDENTICAL = 0.95;

/**
 * How close `candidate` is to `anchor`, 0-100: how far it rises above a typical answer to the same
 * prompt toward a near-identical one. The typical answer is the pool's median similarity to the
 * anchor, which absorbs gte-small's high floor that differs per prompt. Rank alone was too kind: with
 * few close answers in the pool, "pizza" for "pineapple pasta" outranked nearly everything and scored
 * 90. Curved (^0.7) so a related answer reads as close ("spaghetti" 63) and a different dish fails ("pizza" 28).
 */
export async function vibeMatch(db: Db, anchor: TextRef, candidate: TextRef, roomId: string): Promise<number | null> {
  if (sameWords(anchor.body, candidate.body)) return 100;
  if (!anchor.hasEmbedding || !candidate.hasEmbedding) return null;
  const [row] = await db<{ n: number; typical: number | null; sim: number | null }[]>`
    with x as (select embedding from texts where id = ${anchor.id}),
         c as (select embedding from texts where id = ${candidate.id}),
         -- Each distinct answer once: a popular answer repeated by many players would otherwise
         -- become "typical" and score everyone who wrote something like it as no match at all.
         distinct_answers as (
           select distinct on (lower(trim(body))) embedding, created_at from texts
           where prompt_id = ${candidate.promptId}
             and embedding is not null
             and room_id is distinct from ${roomId}
           order by lower(trim(body)), created_at desc),
         pool as (select embedding from distinct_answers order by created_at desc limit ${POOL_SIZE}),
         sims as (select 1 - (pool.embedding <=> x.embedding) as s from pool, x)
    select (select count(*) from sims)::int as n,
           (select percentile_cont(0.5) within group (order by s) from sims) as typical,
           (select 1 - (c.embedding <=> x.embedding) from c, x) as sim`;
  if (!row || row.n < MIN_POOL || row.typical == null || row.sim == null) return null;
  const lift = (row.sim - row.typical) / Math.max(NEAR_IDENTICAL - row.typical, 0.01);
  return Math.round(Math.min(1, Math.max(0, lift)) ** 0.7 * 100);
}
