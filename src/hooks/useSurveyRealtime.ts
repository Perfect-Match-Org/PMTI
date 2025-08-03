"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Survey } from "@/db/schema";
import { SurveyState, SurveyBroadcastPayload } from "@/types/survey";
import { RealtimeChannel } from "@supabase/supabase-js";
import camelcaseKeys from "camelcase-keys";

interface UseSurveyRealtimeProps {
  surveyId: string;
  userEmail: string;
  currentQuestionId?: string;
  setSurveyState: React.Dispatch<React.SetStateAction<SurveyState>>;
}

interface UseSurveyRealtimeReturn {
  broadcastSelection: (selection: string, questionId: string) => Promise<boolean>;
  fetchInitialState: () => Promise<void>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useSurveyRealtime({
  surveyId,
  userEmail,
  currentQuestionId,
  setSurveyState,
}: UseSurveyRealtimeProps): UseSurveyRealtimeReturn {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle database updates (survey progression, status changes)
  const handleSurveyUpdate = useCallback(
    (updatedSurvey: Survey) => {
      console.log("SurveyRealtime - Database update received:", updatedSurvey);

      setSurveyState((prev) => ({
        currentQuestionIndex: updatedSurvey.currentQuestionIndex ?? prev.currentQuestionIndex,
        participantStatus: updatedSurvey.participantStatus || {},
        status: updatedSurvey.status || prev.status,
        partnerId: prev.partnerId,
      }));
    },
    [setSurveyState]
  );

  // Handle real-time selection broadcasts from partner
  const handleSelectionUpdate = useCallback(
    (payload: SurveyBroadcastPayload) => {
      console.log("SurveyRealtime - Selection broadcast received:", payload);
      const { userEmail: senderEmail, selection, questionId } = payload;

      // Only update if it's from partner and for current question
      if (senderEmail !== userEmail && questionId === currentQuestionId) {
        setSurveyState((prev) => ({
          ...prev,
          participantStatus: {
            ...prev.participantStatus,
            [senderEmail]: {
              ...prev.participantStatus[senderEmail],
              currentSelection: selection,
              hasSubmitted: false,
            },
          },
        }));
      }
    },
    [userEmail, currentQuestionId, setSurveyState]
  );

  // Fetch initial survey state from API
  const fetchInitialState = useCallback(async () => {
    if (!surveyId) return;

    try {
      setIsLoading(true);
      setError(null);
      console.log("SurveyRealtime - Fetching initial state for:", surveyId);

      const response = await fetch(`/api/survey/${surveyId}/status`);
      if (!response.ok) {
        throw new Error("Failed to fetch survey state");
      }

      const data = await response.json();
      setSurveyState({
        currentQuestionIndex: data.currentQuestionIndex || 0,
        participantStatus: data.participantStatus || {},
        status: data.status || "started",
        partnerId: data.partnerId,
      });

      console.log("SurveyRealtime - Initial state loaded:", data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("SurveyRealtime - Failed to fetch initial state:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [surveyId, setSurveyState]);

  // Set up realtime subscription
  const setupSubscription = useCallback(() => {
    if (!surveyId || !userEmail) return;

    console.log("SurveyRealtime - Setting up subscription for:", surveyId);

    const channel = supabase
      .channel(`survey-${surveyId}`)
      // Listen for database updates (submissions, question advancement)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "surveys",
          filter: `id=eq.${surveyId}`,
        },
        (payload) => {
          const updatedSurvey = camelcaseKeys(payload.new, { deep: true }) as Survey;
          handleSurveyUpdate(updatedSurvey);
        }
      )
      // Listen for real-time selection broadcasts
      .on("broadcast", { event: "selection_update" }, (payload) => {
        handleSelectionUpdate(payload.payload as SurveyBroadcastPayload);
      })
      .subscribe(async (status, error) => {
        console.log("SurveyRealtime - Subscription status:", status);

        if (status === "SUBSCRIBED") {
          console.log("SurveyRealtime - Subscribed to survey updates:", surveyId);
          channelRef.current = channel;
          // Fetch initial state after successful subscription
          await fetchInitialState();
        }
        if (error) {
          console.error("SurveyRealtime - Subscription error:", error);
          setError(error.message);
          // Fallback: try to fetch initial data even if subscription fails
          await fetchInitialState();
        }
      });

    return () => {
      if (channelRef.current) {
        try {
          console.log("SurveyRealtime - Unsubscribing from survey updates:", surveyId);
          channelRef.current.unsubscribe();
          channelRef.current = null;
        } catch (error) {
          console.warn("SurveyRealtime - Error during channel cleanup:", error);
        }
      }
    };
  }, [surveyId, userEmail, handleSurveyUpdate, handleSelectionUpdate, fetchInitialState]);

  // Broadcast selection to partner
  const broadcastSelection = useCallback(
    async (selection: string, questionId: string): Promise<boolean> => {
      try {
        if (channelRef.current) {
          const payload: SurveyBroadcastPayload = {
            userEmail,
            selection,
            questionId,
            timestamp: new Date().toISOString(),
          };

          await channelRef.current.send({
            type: "broadcast",
            event: "selection_update",
            payload,
          });
          console.log("SurveyRealtime - Selection broadcasted:", payload);
          return true;
        }
        console.warn("SurveyRealtime - No active channel for broadcasting");
        return false;
      } catch (error) {
        console.error("SurveyRealtime - Error broadcasting selection:", error);
        return false;
      }
    },
    [userEmail]
  );

  // Initialize subscription
  useEffect(() => {
    const cleanup = setupSubscription();
    return cleanup;
  }, [setupSubscription]);

  return {
    broadcastSelection,
    fetchInitialState,
    isConnected: !!channelRef.current,
    isLoading,
    error,
  };
}
