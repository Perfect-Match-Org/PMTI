import "server-only";

const TIMEOUT_MS = 10_000;

/**
 * Embeds texts via the Supabase Edge Function (built-in gte-small). Returns null on any failure:
 * free-text scoring is a bonus, so a slow or broken embedder must never block the game.
 */
export async function embed(texts: string[]): Promise<number[][] | null> {
  const url = process.env.EMBED_URL;
  const secret = process.env.EMBED_SECRET;
  if (!url || !secret || texts.length === 0) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-embed-secret": secret },
      body: JSON.stringify({ texts }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[embed] HTTP ${res.status}`);
      return null;
    }
    const { embeddings } = (await res.json()) as { embeddings?: number[][] };
    return Array.isArray(embeddings) && embeddings.length === texts.length ? embeddings : null;
  } catch (error) {
    console.warn("[embed] failed", error);
    return null;
  }
}

/** pgvector text format. */
export const toVector = (values: number[]) => `[${values.join(",")}]`;
