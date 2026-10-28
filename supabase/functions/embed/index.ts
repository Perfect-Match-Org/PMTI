import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Built-in model: 384-dim, English, free on every plan. Created once per worker.
const session = new Supabase.ai.Session("gte-small");
const MAX_TEXTS = 4;
const MAX_CHARS = 500;

Deno.serve(async (req) => {
  const secret = Deno.env.get("EMBED_SECRET");
  if (!secret || req.headers.get("x-embed-secret") !== secret) {
    return new Response("Forbidden", { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const texts: unknown = body?.texts;
  if (
    !Array.isArray(texts) ||
    texts.length < 1 ||
    texts.length > MAX_TEXTS ||
    !texts.every((t) => typeof t === "string" && t.length > 0 && t.length <= MAX_CHARS)
  ) {
    return new Response("Bad request", { status: 400 });
  }
  const embeddings: number[][] = [];
  for (const text of texts as string[]) {
    const vector = await session.run(text, { mean_pool: true, normalize: true });
    embeddings.push(Array.from(vector as ArrayLike<number>));
  }
  return Response.json({ embeddings });
});
