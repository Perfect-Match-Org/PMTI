import { headers } from "next/headers";
import { cardImage } from "@/server/card-image";
import { cardFor } from "@/server/rooms";

export const alt = "A duo result from PMTI, a Cornell day for two";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const card = await cardFor((await params).id);
  if (!card) return new Response("Not found", { status: 404 });
  return cardImage(card, "wide", (await headers()).get("host") ?? "PMTI");
}
