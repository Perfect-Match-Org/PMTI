import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { AuthButtons } from "@/components/authButtons";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-12 h-[calc(100vh-4rem)] flex items-center">
        <div className="grid lg:grid-cols-2 gap-8 items-center w-full">
          {/* Left side - Text content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold tracking-tight">
                Greeting
              </h1>
              <p className="text-xl text-muted-foreground">
                See what type of couple yall are!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {session ? (
                <div className="space-y-4">
                  <p className="text-lg font-semibold">
                    Welcome back, {session.user?.name?.split(' ')[0]}!
                  </p>
                  <Button size="lg" className="w-full sm:w-auto">
                    Continue to Dashboard
                  </Button>
                </div>
              ) : (
                <>
                  <AuthButtons />
                </>
              )}
            </div>
          </div>

          {/* Right side - Visual placeholder */}
          <div className="relative max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl aspect-square max-h-96 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-primary/30 rounded-full mx-auto flex items-center justify-center">
                  <span className="text-3xl">🎯</span>
                </div>
                <p className="text-lg font-medium text-muted-foreground">
                  Visual placeholder
                </p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Interactive matching visualization will go here
                </p>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/10 rounded-full"></div>
            <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-secondary/20 rounded-full"></div>
          </div>
        </div>
      </div>
    </main>
  );
}