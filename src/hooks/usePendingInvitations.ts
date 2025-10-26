"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PendingInvitation } from "@/types/invitation";
import { Invitation } from "@/db/schema";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import camelcaseKeys from "camelcase-keys";

export function usePendingInvitations() {
  const { data: session } = useSession();
  const router = useRouter();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Create stable channel reference using useMemo
  const channel = useMemo(
    () => session?.user?.email ? supabase.channel(`user-invitations-${session.user.email}`) : null,
    [session?.user?.email]
  );

  const handleRealtimeUpdate = useCallback(
    async (payload: RealtimePostgresChangesPayload<Invitation>) => {
      if (payload.eventType === "INSERT") {
        const newInvitation = camelcaseKeys(payload.new) as Invitation;
        if (newInvitation.status === "pending" && new Date(newInvitation.expiresAt) > new Date()) {
          try {
            // Fetch user data to get the actual name
            const userResponse = await fetch(
              `/api/users/${encodeURIComponent(newInvitation.fromUserEmail)}`
            );
            const userData = userResponse.ok ? await userResponse.json() : null;

            const formattedInvitation: PendingInvitation = {
              id: newInvitation.id,
              fromUser: {
                email: newInvitation.fromUserEmail,
                name: userData?.name || newInvitation.fromUserEmail.split("@")[0],
                avatar: userData?.avatar || null,
              },
              status: newInvitation.status,
              relationship: newInvitation.relationship,
              sentAt: new Date(newInvitation.sentAt),
              expiresAt: new Date(newInvitation.expiresAt),
              surveyId: newInvitation.surveyId,
            };
            setInvitations((prev) => [formattedInvitation, ...prev]);
          } catch (error) {
            console.error(
              "PendingInvitations - Failed to fetch user data for new invitation:",
              error
            );
          }
        }
      } else if (payload.eventType === "UPDATE") {
        const updatedInvitation = payload.new;
        // Remove invitation if status changed from pending (accepted, declined, cancelled)
        if (updatedInvitation.status !== "pending") {
          setInvitations((prev) => prev.filter((inv) => inv.id !== updatedInvitation.id));
        }
      } else if (payload.eventType === "DELETE") {
        const deletedInvitation = payload.old;
        setInvitations((prev) => prev.filter((inv) => inv.id !== deletedInvitation.id));
      }
    },
    []
  );

  const fetchInitialInvitations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("PendingInvitations - Fetching initial invitations");

      const response = await fetch("/api/invitations/inbound");
      if (!response.ok) {
        throw new Error("Failed to fetch invitations");
      }

      const data: { inbound: PendingInvitation[] } = await response.json();
      const formattedInvitations = data.inbound.map((inv) => ({
        ...inv,
        sentAt: new Date(inv.sentAt),
        expiresAt: new Date(inv.expiresAt),
      }));
      setInvitations(formattedInvitations);
      console.log("PendingInvitations - Initial invitations loaded:", formattedInvitations.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("PendingInvitations - Failed to fetch invitations:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);


  const handleAccept = useCallback(
    async (invitationId: string) => {
      try {
        const response = await fetch(`/api/invitations/${invitationId}/respond`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "accept" }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.warn("PendingInvitations - " + (data.error || "Failed to accept invitation"));
        }

        // Remove invitation from list after accepting
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

        // Navigate to survey page with surveyId
        router.push(`/survey/${data.surveyId}`);
      } catch (error) {
        console.error("PendingInvitations - Failed to accept invitation:", error);
      }
    },
    [router]
  );

  const handleDecline = useCallback(async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "decline" }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn("PendingInvitations - " + (data.error || "Failed to decline invitation"));
      }

      // Remove invitation from list after declining
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
    } catch (error) {
      console.error("PendingInvitations - Failed to decline invitation:", error);
    }
  }, []);

  // Initialize subscription
  useEffect(() => {
    if (!session?.user?.email || !channel) {
      setIsLoading(false);
      return;
    }

    console.log("PendingInvitations - Setting up subscription for:", session.user.email);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invitations",
          filter: `toUserEmail=eq.${session.user.email}`,
        },
        handleRealtimeUpdate
      );

    channel.subscribe(async (status, error) => {
      console.log("PendingInvitations - Subscription status:", status);

      if (status === "SUBSCRIBED") {
        console.log("PendingInvitations - Subscribed to invitation updates");
        setIsConnected(true);
        await fetchInitialInvitations();
      }
      if (error) {
        console.error("PendingInvitations - Subscription error:", error);
        setError(error.message);
        setIsConnected(false);
        // Fallback: try to fetch initial data even if subscription fails
        await fetchInitialInvitations();
      }
    });

    return () => {
      console.log("PendingInvitations - Unsubscribing channel");
      setIsConnected(false);
      channel.unsubscribe().catch((error) => {
        console.warn("PendingInvitations - Error during channel cleanup:", error);
      });
    };
  }, [session?.user?.email, channel, handleRealtimeUpdate, fetchInitialInvitations]);

  return {
    invitations,
    isLoading,
    error,
    isConnected,
    handleAccept,
    handleDecline,
  };
}
