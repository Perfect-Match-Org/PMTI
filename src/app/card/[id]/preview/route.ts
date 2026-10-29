import { cardImage } from "@/server/card-image";
import { cardFor } from "@/server/rooms";

/** The card as a link preview. The page points here with the current name choices in the address. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const card = await cardFor((await params).id);
  if (!card) return new Response("Not found", { status: 404 });
  return cardImage(card, "wide", new URL(request.url).host);
}
