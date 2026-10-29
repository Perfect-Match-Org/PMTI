import type { Metadata, Viewport } from "next";
import { Gabarito } from "next/font/google";
import "./globals.css";

const gabarito = Gabarito({ subsets: ["latin"], variable: "--font-gabarito" });

export const metadata: Metadata = {
  title: "PMTI · Perfect Match Type Indicator",
  description: "A two-player game for Cornell duos. Play one Cornell day together and find out what kind of pair you are.",
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={gabarito.variable}>
      <body>{children}</body>
    </html>
  );
}
