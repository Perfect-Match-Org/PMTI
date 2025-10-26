"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Survey } from "@/db/schema";
import { SurveyState, SurveyBroadcastPayload } from "@/types/survey";
import { RealtimeChannel } from "@supabase/supabase-js";
import camelcaseKeys from "camelcase-keys";
import { SURVEY_QUESTIONS } from "@/lib/constants/questions";

interface UseSurveyRealtimeProps {
  surveyId: string;
  userEmail: string;
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
  setSurveyState,
}: UseSurveyRealtimeProps): UseSurveyRealtimeReturn {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle database updates (survey progression, status changes)
  // More like a wrapper :(
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
      const { userEmail: senderEmail, selection, questionId, timestamp } = payload;

      // Only update if it's from partner
      if (senderEmail !== userEmail) {
        setSurveyState((prev) => {
          // Get current question ID from survey state
          const currentQuestion = SURVEY_QUESTIONS[prev.currentQuestionIndex];

          // Ignore broadcasts for different questions (stale broadcasts)
          if (!currentQuestion || questionId !== currentQuestion.questionId) {
            console.warn(
              "SurveyRealtime - Ignoring stale broadcast for question:",
              questionId,
              "current:",
              currentQuestion?.questionId
            );
            return prev;
          }

          // Convert ISO string timestamp to Date object for comparison
          const incomingTimestamp = new Date(timestamp);

          // Check if broadcast is outdated (older than last update for this user)
          const existingStatus = prev.participantStatus[senderEmail];
          if (existingStatus?.timestamp && incomingTimestamp < existingStatus.timestamp) {
            console.warn(
              "SurveyRealtime - Ignoring outdated broadcast from:",
              incomingTimestamp,
              "existing:",
              existingStatus.timestamp
            );
            return prev;
          }

          return {
            ...prev,
            participantStatus: {
              ...prev.participantStatus,
              [senderEmail]: {
                ...prev.participantStatus[senderEmail],
                currentSelection: selection,
                hasSubmitted: false,
                questionId,
                timestamp: incomingTimestamp, // Store as Date object
              },
            },
          };
        });
      }
    },
    [userEmail, setSurveyState]
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
      // Use functional update to preserve any subscription updates that arrived during fetch
      setSurveyState((prev) => ({
        ...prev,
        currentQuestionIndex: data.currentQuestionIndex ?? prev.currentQuestionIndex ?? 0,
        participantStatus: data.participantStatus || prev.participantStatus || {},
        status: data.status || prev.status || "started",
        partnerId: data.partnerId || prev.partnerId,
      }));

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
      });

    channelRef.current = channel;

    channel.subscribe(async (status, error) => {
      console.log("SurveyRealtime - Subscription status:", status);

      if (status === "SUBSCRIBED") {
        console.log("SurveyRealtime - Subscribed to survey updates:", surveyId);
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
          console.log("SurveyRealtime - Removing channel:", surveyId);
          supabase.removeChannel(channelRef.current);
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
