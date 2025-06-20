"use client";

import { DesktopNavbar } from "./desktop";
import { MobileNavbar } from "./mobile";

export function Navbar() {
  return (
    <>
      <DesktopNavbar />
      <MobileNavbar />
    </>
  );
}