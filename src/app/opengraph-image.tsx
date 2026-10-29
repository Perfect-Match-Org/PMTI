import { shareImage } from "@/server/share-image";

export const alt = "A Cornell day for two: a two-player game by Cornell Perfect Match";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return shareImage();
}
