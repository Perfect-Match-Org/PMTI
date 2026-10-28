import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PMTI · Perfect Match Type Indicator",
  description: "A two-player game for Cornell duos. Find out what kind of pair you are.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
