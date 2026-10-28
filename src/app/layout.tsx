import type { Metadata, Viewport } from "next";
import { Dela_Gothic_One, Work_Sans } from "next/font/google";
import "./globals.css";

const dela = Dela_Gothic_One({ weight: "400", subsets: ["latin"], variable: "--font-dela" });
const work = Work_Sans({ subsets: ["latin"], variable: "--font-work" });

export const metadata: Metadata = {
  title: "PMTI · Perfect Match Type Indicator",
  description: "A two-player game for Cornell duos. Play one Cornell day together and find out what kind of pair you are.",
};

export const viewport: Viewport = { themeColor: "#24438d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dela.variable} ${work.variable}`}>
      <body>{children}</body>
    </html>
  );
}
