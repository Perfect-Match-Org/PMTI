import { invitation } from "@/server/rooms";
import { shareImage } from "@/components/share-image";

export const alt = "An invitation to a Cornell day for two, a two-player game by Cornell Perfect Match";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const invite = await invitation((await params).code.toUpperCase());
  return shareImage("closed" in invite ? undefined : invite.host.name);
}
