"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PendingInvitation } from "@/types/invitation";
import { Invitation } from "@/db/schema";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import camelcaseKeys from "camelcase-keys";

export function usePendingInvitations() {
  const { data: session } = useSession();
  const router = useRouter();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

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
      const response = await fetch("/api/invitations/inbound");
      if (!response.ok) {
        console.warn("PendingInvitations - Failed to fetch invitations");
      }

      const data: { inbound: PendingInvitation[] } = await response.json();
      const formattedInvitations = data.inbound.map((inv) => ({
        ...inv,
        sentAt: new Date(inv.sentAt),
        expiresAt: new Date(inv.expiresAt),
      }));
      setInvitations(formattedInvitations);
    } catch (error) {
      console.error("PendingInvitations - Failed to fetch invitations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setupSubscription = useCallback(
    async (userEmail: string) => {
      try {
        const channel = supabase
          .channel(`user-invitations-${userEmail}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "invitations",
              filter: `toUserEmail=eq.${userEmail}`,
            },
            handleRealtimeUpdate
          )
          .subscribe(async (status, error) => {
            if (status === "SUBSCRIBED") {
              console.log("PendingInvitations - Subscription active for:", userEmail);
              await fetchInitialInvitations();
            }
            if (error) {
              console.error("PendingInvitations - Subscription error:", error);
              await fetchInitialInvitations();
            }
          });

        channelRef.current = channel;
      } catch (error) {
        console.error("PendingInvitations - Failed to initialize invitations:", error);
        // Fallback: try to fetch initial data even if subscription fails
        await fetchInitialInvitations();
      }
    },
    [handleRealtimeUpdate, fetchInitialInvitations]
  );

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

  // Initialize invitations with proper sequencing
  useEffect(() => {
    if (!session?.user?.email) {
      setIsLoading(false);
      return;
    }

    setupSubscription(session.user.email);

    return () => {
      if (channelRef.current) {
        console.log("PendingInvitations - Unsubscribing from real-time channel");
        channelRef.current.unsubscribe();
      }
    };
  }, [session?.user?.email, setupSubscription]);

  return {
    invitations,
    isLoading,
    handleAccept,
    handleDecline,
  };
}
