import { cardImage } from "@/server/card-image";
import { cardFor } from "@/server/rooms";

/** The share card as a tall image to save and post as a story. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const card = await cardFor((await params).id);
  if (!card) return new Response("Not found", { status: 404 });
  const image = await cardImage(card, "story", new URL(request.url).host);
  image.headers.set("content-disposition", 'attachment; filename="pmti-card.png"');
  return image;
}
