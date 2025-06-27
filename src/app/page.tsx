import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { AuthButtons } from "@ui/authButtons";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/config";
import ResultsMain from "@/components/results/main";

async function getSurveyCount() {
  try {
    const response = await fetch(`${config.apiBaseUrl}/surveys/count`, {
      cache: "no-store",
    });
    if (!response.ok) return 0;
    const data = await response.json();
    return data.count || 0;
  } catch {
    return 0;
  }
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const surveyCount = await getSurveyCount();

  return (
    <main>
      {/* Hero Section */}
      <section className="min-h-screen">
        <div className="container mx-auto px-12 h-[calc(100vh-4rem)] flex items-center">
          <div className="grid lg:grid-cols-2 gap-8 items-center w-full">
            {/* Left side - Text content */}
            <div className="space-y-8 pt-10 lg:pt-0">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold tracking-tight">Perfect Match Type Indicator</h1>
                <div className="space-y-2">
                  <p className="text-xl text-muted-foreground">
                    Discover what type of couple you are and strengthen your relationship together
                  </p>
                  <p className="text-md text-muted-foreground">
                    {surveyCount.toLocaleString()} couples have already taken the quiz
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {session ? (
                  <div className="space-y-4">
                    <p className="text-lg font-semibold">
                      Welcome back, {session.user?.name?.split(" ")[0]}!
                    </p>
                    <Button size="lg" className="w-full sm:w-auto">
                      Take the Quiz
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AuthButtons />
                    <p className="text-sm text-muted-foreground">
                      Sign in with your Cornell email to get started
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Visual placeholder */}
            <div className="relative max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl aspect-square max-h-96 flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-primary/30 rounded-full mx-auto flex items-center justify-center">
                    <span className="text-3xl">💕</span>
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">Couple Compatibility</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Interactive visualization coming soon
                  </p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/10 rounded-full"></div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-secondary/20 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <ResultsMain />
    </main>
  );
}

