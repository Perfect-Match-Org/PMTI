import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Gabarito } from "next/font/google";
import "./globals.css";

const gabarito = Gabarito({ subsets: ["latin"], variable: "--font-gabarito" });
// Only the "&" and "vs." in pair names use it.
const bodoni = Bodoni_Moda({ subsets: ["latin"], style: "italic", weight: "500", variable: "--font-bodoni" });

export const metadata: Metadata = {
  title: "PMTI · Perfect Match Type Indicator",
  description: "A two-player game for Cornell duos. Play one Cornell day together and find out what kind of pair you are.",
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${gabarito.variable} ${bodoni.variable}`}>
      <body>{children}</body>
    </html>
  );
}
