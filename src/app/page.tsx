import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { AuthButtons } from "@/components/authButtons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome to PMTI
          </CardTitle>
          <CardDescription>
            Exciting things are happening!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          {session ? (
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={session.user?.image ?? undefined} alt={session.user?.name ?? "User Avatar"} />
                <AvatarFallback>
                  {session.user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-lg font-semibold">
                You are logged in as {session.user?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                ({session.user?.email})
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">You are not logged in.</p>
          )}
          <AuthButtons />
        </CardContent>
      </Card>
    </main>
  );
}