"use client";

import { useState } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { navigationItems, type NavItem } from "./nav-config";

export function MobileNavbar() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const filteredNavItems = navigationItems.filter((item: NavItem) => {
    if (item.requiresAuth && !session) return false;
    return true;
  });

  const closeSheet = () => setIsOpen(false);

  return (
    <nav className="md:hidden flex border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 w-full">
        <Link href="/" className="font-bold text-xl">
          PMTI
        </Link>

        <div className="flex items-center space-x-2">
          {session && (
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={session.user?.image ?? undefined}
                alt={session.user?.name ?? "User"}
              />
              <AvatarFallback>{session.user?.name?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
            </Avatar>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="w-full p-4">
              <div className="flex flex-col space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-lg font-semibold hidden">Menu</SheetTitle>{" "}
                  {/* for accessibility only */}
                </div>

                <div className="flex flex-col space-y-2 items-center">
                  {filteredNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeSheet}
                      className="flex items-center space-x-2 rounded-md py-2 px-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>

                <div className="border-t pt-4">
                  {session ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 px-3 py-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={session.user?.image ?? undefined}
                            alt={session.user?.name ?? "User"}
                          />
                          <AvatarFallback>
                            {session.user?.name?.charAt(0).toUpperCase() ?? "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">{session.user?.name}</p>
                          <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          signOut();
                          closeSheet();
                        }}
                      >
                        Sign out
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => {
                        signIn("google");
                        closeSheet();
                      }}
                    >
                      Sign in
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
