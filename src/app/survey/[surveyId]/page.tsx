import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { validateSurveyAccess } from "@/db/services/invitationService";
import { SurveyProvider, SurveyRenderer } from "@/components/survey";

interface SurveyPageProps {
  params: Promise<{
    surveyId: string;
  }>;
}

export default async function SurveyPage({ params }: SurveyPageProps) {
  const session = await getServerSession();
  const resolvedParams = await params;

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  try {
    const hasAccess = await validateSurveyAccess(resolvedParams.surveyId, session.user.email);

    if (!hasAccess) {
      redirect("/lobby?error=unauthorized");
    }
  } catch (error) {
    console.error("Access validation failed:", error);
    redirect("/lobby?error=validation_failed");
  }

  return (
    <SurveyProvider surveyId={resolvedParams.surveyId}>
      <SurveyRenderer />
    </SurveyProvider>
  );
}
