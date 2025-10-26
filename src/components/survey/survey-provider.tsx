"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SurveyState, SurveyContextType } from "@/types/survey";
import { SURVEY_QUESTIONS, UserRole, getTotalQuestions } from "@/lib/constants/questions";
import { useSurveyRealtime } from "@/hooks/useSurveyRealtime";

const SurveyContext = createContext<SurveyContextType | null>(null);

interface SurveyProviderProps {
  children: ReactNode;
  surveyId: string;
}

export function SurveyProvider({ children, surveyId }: SurveyProviderProps) {
  const { data: session } = useSession();
  const router = useRouter();

  // State management
  const [surveyState, setSurveyState] = useState<SurveyState>({
    currentQuestionIndex: 0,
    participantStatus: {},
    status: "started",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [userRole, setUserRole] = useState<UserRole>(UserRole.User1);

  const userEmail = session?.user?.email || "";
  const partnerId = surveyState.partnerId || "";
  const currentQuestion = SURVEY_QUESTIONS[surveyState.currentQuestionIndex] || null;

  // Initialize realtime hook
  const { broadcastSelection, isConnected, isLoading, error } = useSurveyRealtime({
    surveyId,
    userEmail,
    setSurveyState,
  });

  // Update derived state when partner info becomes available
  useEffect(() => {
    if (userEmail && partnerId) {
      const role = userEmail < partnerId ? UserRole.User1 : UserRole.User2;
      setUserRole(role);
    }
  }, [userEmail, partnerId]);

  // Check for survey completion when websocket updates currentQuestionIndex
  useEffect(() => {
    const totalQuestions = getTotalQuestions();
    // When both users submit the last question, the database trigger increments
    // currentQuestionIndex to totalQuestions, and websocket broadcasts this update
    if (surveyState.currentQuestionIndex >= totalQuestions) {
      console.log("Survey completed (via websocket update), redirecting to results");
      router.push(`/survey/${surveyId}/results`);
    }
  }, [surveyState.currentQuestionIndex, surveyId, router]);

  // Actions
  const updateSelection = useCallback(
    async (selection: string): Promise<boolean> => {
      try {
        // Update local state immediately for smooth UX
        setSurveyState((prev) => ({
          ...prev,
          participantStatus: {
            ...prev.participantStatus,
            [userEmail]: {
              ...prev.participantStatus[userEmail],
              currentSelection: selection,
              hasSubmitted: false,
              questionId: currentQuestion?.questionId,
              timestamp: new Date(), // Use Date object for ephemeral timestamp
            },
          },
        }));

        // Broadcast selection to partner using realtime hook
        if (currentQuestion?.questionId) {
          return await broadcastSelection(selection, currentQuestion.questionId);
        }

        return true;
      } catch (error) {
        console.error("Error updating selection:", error);
        return false;
      }
    },
    [userEmail, currentQuestion?.questionId, broadcastSelection]
  );

  const submitResponse = useCallback(
    async (questionId: string, selectedOption: string) => {
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const response = await fetch(`/api/survey/${surveyId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            selectedOption,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save response");
        }

        const result = await response.json();
        console.log("Submit response result:", result);

        // Update local state with the returned participant status
        if (result.success && result.participantStatus) {
          setSurveyState((prev) => ({
            ...prev,
            participantStatus: result.participantStatus,
          }));
          console.log("Updated participant status:", result.participantStatus);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to submit response";
        setSubmitError(errorMessage);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [surveyId, surveyState.currentQuestionIndex, router]
  );

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  // Clear selections when question changes (for clean state)
  const clearSelections = useCallback(() => {
    setSurveyState((prev) => ({
      ...prev,
      participantStatus: Object.keys(prev.participantStatus).reduce((acc, email) => {
        acc[email] = {
          ...prev.participantStatus[email],
          hasSubmitted: false,
        };
        return acc;
      }, {} as typeof prev.participantStatus),
    }));
  }, []);

  // Clear selections when question changes
  useEffect(() => {
    clearSelections();
  }, [surveyState.currentQuestionIndex, clearSelections]);

  const contextValue: SurveyContextType = {
    surveyState,
    actions: {
      updateSelection,
      submitResponse,
      clearSubmitError,
      clearSelections,
    },
    isLoading,
    error,
    isSubmitting,
    isConnected,
    submitError,
    user: {
      email: userEmail,
      role: userRole,
    },
    partner: {
      id: partnerId,
      status: surveyState.participantStatus[partnerId],
    },
    currentQuestion,
  };

  return <SurveyContext.Provider value={contextValue}>{children}</SurveyContext.Provider>;
}

export function useSurvey() {
  const context = useContext(SurveyContext);
  if (!context) {
    throw new Error("useSurvey must be used within a SurveyProvider");
  }
  return context;
}
