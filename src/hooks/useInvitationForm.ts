"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { OutboundInvitation, InvitationFormState } from "@/types/invitation";
import { Invitation } from "@/db/schema";
import { RelationshipType } from "@/lib/constants/relationships";
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import camelcaseKeys from "camelcase-keys";

export function useInvitationForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [netid, setNetid] = useState("");
  const [relationship, setRelationship] = useState<RelationshipType>(RelationshipType.COUPLE);
  const [isLoading, setIsLoading] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<InvitationFormState>({
    status: "empty",
  });
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleRealtimeUpdate = useCallback(
    async (payload: RealtimePostgresChangesPayload<Invitation>) => {
      console.log("InvitationForm - Real-time invitation status update:", payload);

      if (payload.eventType === "UPDATE") {
        const updatedInvitation = camelcaseKeys(payload.new) as Invitation;

        if (updatedInvitation.status === "accepted") {
          setInvitationDetails((prev) => ({
            ...prev,
            status: "accepted",
            ...(typeof updatedInvitation.surveyId === "string"
              ? { surveyId: updatedInvitation.surveyId }
              : {}),
          }));
          if (updatedInvitation.surveyId) {
            router.push(`/survey/${updatedInvitation.surveyId}`);
          }
        } else if (updatedInvitation.status === "declined") {
          setInvitationDetails((prev) => ({ ...prev, status: "rejected" }));
        } else if (updatedInvitation.status === "cancelled") {
          // Reset form if invitation was cancelled from another source
          setInvitationDetails({ status: "empty" });
          setNetid("");
        }
      } else if (payload.eventType === "DELETE") {
        // Reset form if invitation was deleted
        setInvitationDetails({ status: "empty" });
        setNetid("");
      }
    },
    [router]
  );

  const fetchInitialInvitation = useCallback(async () => {
    try {
      const response = await fetch("/api/invitations/outbound");
      if (!response.ok) {
        return; // Silently fail if no sent invitations
      }

      const data: { outbound: OutboundInvitation } = await response.json();
      const sentInvitation = data.outbound;

      if (sentInvitation) {
        const netidFromEmail = sentInvitation.toUser.email.split("@")[0];
        const formattedInvitation = {
          ...sentInvitation,
          sentAt: new Date(sentInvitation.sentAt),
          expiresAt: new Date(sentInvitation.expiresAt),
        };

        setNetid(netidFromEmail === "cornell.perfectmatch" ? "PM" : netidFromEmail);
        setRelationship(sentInvitation.relationship as RelationshipType);
        setInvitationDetails({
          id: formattedInvitation.id,
          name: formattedInvitation.toUser.name,
          avatar: formattedInvitation.toUser.avatar || undefined,
          status: "pending",
          surveyId: formattedInvitation.surveyId || undefined,
        });
      }
    } catch (error) {
      console.error("InvitationForm - Failed to fetch sent invitations:", error);
    }
  }, []);

  const setupSubscription = useCallback(
    async (userEmail: string, invitationId?: string) => {
      console.log(
        "InvitationForm - Setting up invitation subscription for:",
        userEmail,
        "invitation:",
        invitationId
      );

      try {
        const filter = invitationId ? `id=eq.${invitationId}` : `fromUserEmail=eq.${userEmail}`;

        const channel = supabase
          .channel(`user-outbound-invitations-${userEmail}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "invitations",
              filter,
            },
            handleRealtimeUpdate
          );

        channelRef.current = channel;

        channel.subscribe(async (status, error) => {
          console.log("InvitationForm - Subscription status:", status);

          if (status === "SUBSCRIBED") {
            console.log("InvitationForm - Subscription active");
            await fetchInitialInvitation();
          }
          if (error) {
            console.error("InvitationForm - Subscription error:", error);
            await fetchInitialInvitation();
          }
        });
      } catch (error) {
        console.error("InvitationForm - Failed to initialize invitation subscription:", error);
        // Fallback: try to fetch initial data even if subscription fails
        await fetchInitialInvitation();
      }
    },
    [handleRealtimeUpdate, fetchInitialInvitation]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        const response = await fetch("/api/invitations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ netid, relationship }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.warn(data.error || "Failed to send invitation");
        }

        // Fetch recipient (invited user) details for avatar
        let recipientAvatar = undefined;

        const toEmail = netid === "PM" ? "cornell.perfectmatch@gmail.com" : `${netid}@cornell.edu`;
        const userResponse = await fetch(`/api/users/${encodeURIComponent(toEmail)}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          recipientAvatar = userData.avatar;
        }

        // Update invited user to pending state
        setInvitationDetails({
          id: data.invitation.id,
          name: data.invitation.name || netid,
          avatar: recipientAvatar,
          status: "pending",
        });
      } catch (error) {
        console.error("InvitationForm - Failed to send invitation:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [netid, relationship]
  );

  const resendInvitation = useCallback(() => {
    // API call to send invitation again
  }, []);

  const cancelInvitation = useCallback(async () => {
    if (!invitationDetails.id) return;

    try {
      const response = await fetch(`/api/invitations/${invitationDetails.id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn(data.error || "Failed to cancel invitation");
      }

      // Reset the form state
      setInvitationDetails({ status: "empty" });
      setNetid("");
    } catch (error) {
      console.error("InvitationForm - Failed to cancel invitation:", error);
    }
  }, [invitationDetails.id]);

  // Initialize invitation form with proper sequencing
  useEffect(() => {
    if (!session?.user?.email) {
      return;
    }

    setupSubscription(session.user.email, invitationDetails.id);

    return () => {
      if (channelRef.current) {
        console.log("InvitationForm - Removing channel");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [session?.user?.email, invitationDetails.id]);

  return {
    // State
    netid,
    relationship,
    isLoading,
    invitationDetails,
    session,

    // Setters
    setNetid,
    setRelationship,

    // Handlers
    handleSubmit,
    resendInvitation,
    cancelInvitation,
  };
}
