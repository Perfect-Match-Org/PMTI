import { sql } from "@/server/db";
import { deleteAbandonedRooms } from "@/server/rooms";
import { pruneEmbeddings } from "@/server/similarity";

// Daily Vercel cron: keeps the free Supabase project awake (it pauses after 7 idle days), and keeps the
// database well under the free plan's 500 MB.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  await sql`select 1`;
  const prunedVectors = await pruneEmbeddings(sql);
  const deletedRooms = await deleteAbandonedRooms();
  return Response.json({ ok: true, prunedVectors, deletedRooms });
}
