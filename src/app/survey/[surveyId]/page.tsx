"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface SurveyPageProps {
  params: Promise<{
    surveyId: string;
  }>;
}

export default function SurveyPage({ params }: SurveyPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const resolvedParams = use(params);

  useEffect(() => {
    const validateAccess = async () => {
      if (status === "loading") return;
      
      if (!session) {
        router.push("/api/auth/signin");
        return;
      }

      try {
        const response = await fetch(`/api/survey/${resolvedParams.surveyId}/validate`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Validation failed");
        }

        if (!data.hasAccess) {
          router.push("/lobby?error=unauthorized");
          return;
        }

        setHasAccess(true);
      } catch (error) {
        console.error("Access validation failed:", error);
        router.push("/lobby?error=validation_failed");
      } finally {
        setIsValidating(false);
      }
    };

    validateAccess();
  }, [session, status, resolvedParams.surveyId, router]);

  if (isValidating) {
    return (
      <div className="container mx-auto py-8">
        <p>Validating access...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Survey Session</h1>
      <p className="text-muted-foreground mb-4">Session ID: {resolvedParams.surveyId}</p>
      {/* Survey content will be implemented here */}
    </div>
  );
}
