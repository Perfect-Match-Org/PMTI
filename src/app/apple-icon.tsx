import { ImageResponse } from "next/og";
import { BRAND } from "@/brand";
import { PmLogo } from "@/components/ui/pm-logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND.navy }}>
      <PmLogo gap={BRAND.navy} width={124} height={87} style={{ color: "white" }} />
    </div>,
    size
  );
}
