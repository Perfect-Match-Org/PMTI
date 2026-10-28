import "server-only";
import type { Db } from "./db";

const POOL_SIZE = 200;
const MIN_POOL = 10;

export type TextRef = { id: string; body: string; promptId: string; hasEmbedding: boolean };

/** Same words regardless of case, punctuation or order: "Funny, warm!" matches "warm funny". */
export function sameWords(a: string, b: string): boolean {
  const bag = (s: string) =>
    s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean).sort().join(" ");
  return bag(a) === bag(b);
}

/**
 * How close `candidate` is to `anchor`, ranked against other people's answers to the candidate's
 * prompt. Ranking sidesteps gte-small's high baseline similarity, which differs per prompt.
 * The rank is curved (squared) so a random answer (~50th percentile) shows as ~25%, not ~50%,
 * while real matches stay near 100%.
 */
export async function matchPercentile(
  db: Db,
  anchor: TextRef,
  candidate: TextRef,
  roomId: string
): Promise<number | null> {
  if (sameWords(anchor.body, candidate.body)) return 100;
  if (!anchor.hasEmbedding || !candidate.hasEmbedding) return null;
  const [row] = await db<{ n: number; beaten: number }[]>`
    with x as (select embedding from texts where id = ${anchor.id}),
         c as (select embedding from texts where id = ${candidate.id}),
         pool as (
           select embedding from texts
           where prompt_id = ${candidate.promptId}
             and embedding is not null
             and room_id is distinct from ${roomId}
           order by created_at desc
           limit ${POOL_SIZE})
    select count(*)::int as n,
           (count(*) filter (where (pool.embedding <=> x.embedding) > (c.embedding <=> x.embedding)))::int as beaten
    from pool, x, c`;
  if (!row || row.n < MIN_POOL) return null;
  return Math.round((row.beaten / row.n) ** 2 * 100);
}
