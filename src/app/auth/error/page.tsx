import { NextPage } from "next";
import { AuthButtons } from "@/components/ui/auth-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const Error: NextPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-xl text-destructive">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-center leading-relaxed">
            Oh no, it looks like we&apos;ve hit a bit of a roadblock in finding your perfect match.
            To ensure a successful love connection, please double check that you&apos;re using your
            official Cornell University email address (ending in @cornell.edu) and give it another
            try.
          </p>
          <div className="flex justify-center">
            <AuthButtons />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Error;
