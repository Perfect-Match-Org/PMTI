"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RelationshipType, RELATIONSHIP_LABELS, getAllRelationshipTypes } from "@/lib/constants/relationships";
import { UserAvatar } from "@/components/user-avatar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Invitation } from "@/db/schema";

export function InvitationForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [netid, setNetid] = useState("");
  const [relationship, setRelationship] = useState<RelationshipType>(RelationshipType.COUPLE);
  const [isLoading, setIsLoading] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<{
    id?: string;
    name?: string;
    avatar?: string;
    status: "empty" | "pending" | "accepted" | "rejected";
    sessionId?: string;
  }>({ status: "empty" });
  const subscriptionRef = useRef<RealtimeChannel>(null);

  const cleanupSubscription = async () => {
    if (subscriptionRef.current) {
      console.log('Cleaning up previous subscription');
      await supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  };

  // Fetch sent invitations on component load to restore state after refresh
  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchSentInvitations = async () => {
      try {
        const response = await fetch("/api/invitations/outbound");
        if (!response.ok) return; // Silently fail if no sent invitations

        const data = await response.json();
        const sentInvitation = data.outbound;

        // If there's a pending sent invitation, restore the form state
        if (sentInvitation) {
          const netidFromEmail = sentInvitation.toUser.email.split("@")[0];

          setNetid(netidFromEmail === "cornell.perfectmatch" ? "PM" : netidFromEmail);
          setRelationship(sentInvitation.relationship);
          setInvitationDetails({
            id: sentInvitation.id,
            name: sentInvitation.toUser.name,
            avatar: sentInvitation.toUser.avatar,
            status: "pending",
            sessionId: sentInvitation.sessionId
          });
        }
      } catch (error) {
        console.error("Failed to fetch sent invitations:", error);
      }
    };

    fetchSentInvitations();
  }, [session?.user?.email]);

  const setupSubscription = async (invitationId: string) => {
    if (!session?.user?.email || !invitationId) return;

    console.log('Setting up real-time subscription for sent invitation:', invitationId);

    // Need to wait for any previous subscription to be cleaned up
    await cleanupSubscription();

    try {
      const channel = supabase
        .channel(`invitation-${invitationId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'invitations',
            filter: `id=eq.${invitationId}`,
          },
          (payload) => {
            console.log('Real-time invitation status update:', payload);

            const updatedInvitation = payload.new as Invitation;

            // Double check for safety
            if (updatedInvitation.id === invitationId) {
              if (updatedInvitation.status === 'accepted') {
                setInvitationDetails(prev => ({
                  ...prev,
                  status: 'accepted',
                  ...(typeof updatedInvitation.sessionId === 'string' ? { sessionId: updatedInvitation.sessionId } : {})
                }));
                if (updatedInvitation.sessionId) {
                  router.push(`/survey/${updatedInvitation.sessionId}`);
                }
              } else if (updatedInvitation.status === 'declined') {
                setInvitationDetails(prev => ({ ...prev, status: 'rejected' }));
              } else if (updatedInvitation.status === 'cancelled') {
                // Reset form if invitation was cancelled from another source
                setInvitationDetails({ status: "empty" });
                setNetid("");
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Invitation sender subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to invitation updates');
          }
        });

      subscriptionRef.current = channel;
    } catch (error) {
      console.error('Failed to setup subscription:', error);
    }
  };

  // Real-time subscription to monitor invitation status changes
  useEffect(() => {
    if (invitationDetails.id) {
      setupSubscription(invitationDetails.id);
    }

    return () => {
      cleanupSubscription();
    };
  }, [session?.user?.email, invitationDetails.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ netid, relationship })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
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
        status: "pending"
      });

    } catch (error) {
      console.error("Failed to send invitation:", error);
      alert(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const resendInvitation = () => {
    // API call to send invitation again
  };

  const cancelInvitation = async () => {
    if (invitationDetails.id) {
      // Fallback to local state reset if no ID
      try {
        const response = await fetch(`/api/invitations/${invitationDetails.id}/cancel`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to cancel invitation");
        }
      } catch (error) {
        console.error("Failed to cancel invitation:", error);
        alert(error instanceof Error ? error.message : "Failed to cancel invitation");
      }

      // Reset the form state
      setInvitationDetails({ status: "empty" });
      setNetid("");
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Your Partner</CardTitle>
        <CardDescription>
          Enter your partner&apos;s NetID to send them a quiz invitation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Avatar Preview Section */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center gap-4">
            {/* Current User Avatar */}
            <div className="flex flex-col items-center gap-2">
              <UserAvatar
                src={session?.user?.image || undefined}
                alt={session?.user?.name || "You"}
                fallback={session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                status="accepted"
                size="lg"
              />
              <p className="text-sm font-medium">You</p>
            </div>

            {/* Connection Icon */}
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Heart className="size-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">{RELATIONSHIP_LABELS[relationship]}</p>
            </div>

            {/* Invited User Avatar */}
            <div className="flex flex-col items-center gap-2">
              <UserAvatar
                src={invitationDetails.avatar}
                alt={invitationDetails.name}
                fallback={invitationDetails.name?.charAt(0)?.toUpperCase() || "?"}
                status={invitationDetails.status}
                size="lg"
              />
              <p className="text-sm font-medium">
                {invitationDetails.status === "empty" ? "Partner" : invitationDetails.name}
              </p>
            </div>
          </div>

          {/* Status Message */}
          {invitationDetails.status !== "empty" && (
            <div className="mt-4 text-center">
              {invitationDetails.status === "pending" && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Invitation sent! Waiting for response...</p>
                  <div className="flex justify-center space-x-2">
                    <Button size="sm" onClick={resendInvitation} variant="outline">
                      Send Again
                    </Button>
                    <Button size="sm" onClick={cancelInvitation} variant="destructive" className="ml-2">
                      Cancel Invitation
                    </Button>
                  </div>
                </div>
              )}
              {invitationDetails.status === "accepted" && (
                <p className="text-sm text-green-600">✓ Invitation accepted! Ready to start quiz.</p>
              )}
              {invitationDetails.status === "rejected" && (
                <p className="text-sm text-destructive">✗ Invitation declined.</p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="netid">Partner&apos;s NetID</Label>
            <Input
              id="netid"
              type="text"
              placeholder="abc123"
              value={netid}
              onChange={(e) => setNetid(e.target.value)}
              disabled={invitationDetails.status === "pending" || invitationDetails.status === "accepted"}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">How would you describe yourselves?</Label>
            <select
              id="relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as RelationshipType)}
              disabled={invitationDetails.status === "pending" || invitationDetails.status === "accepted"}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {getAllRelationshipTypes().map((type) => (
                <option key={type} value={type}>
                  {RELATIONSHIP_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !netid.trim() || invitationDetails.status === "pending" || invitationDetails.status === "accepted"}
          >
            {isLoading ? "Sending..." : "Send Invitation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}