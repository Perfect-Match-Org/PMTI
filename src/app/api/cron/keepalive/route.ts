import { sql } from "@/server/db";

// Daily Vercel cron: free Supabase projects pause after 7 days without activity.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  await sql`select 1`;
  return Response.json({ ok: true });
}
