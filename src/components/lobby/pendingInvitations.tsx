"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@components/user-avatar";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface PendingInvitation {
  id: string;
  fromUser: {
    email: string;
    name: string;
    avatar?: string | null;
  };
  status: string;
  relationship: string;
  sentAt: Date;
  expiresAt: Date;
  sessionId: string | null;
}

export function PendingInvitations() {
  const { data: session } = useSession();
  const router = useRouter();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Centralized function to format invitation data from API
  const formatInvitationData = (apiInvitation: any): PendingInvitation => ({
    id: apiInvitation.id,
    fromUser: apiInvitation.fromUser,
    status: apiInvitation.status,
    relationship: apiInvitation.relationship,
    sentAt: new Date(apiInvitation.sentAt),
    expiresAt: new Date(apiInvitation.expiresAt),
    sessionId: apiInvitation.sessionId,
  });

  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchInitialInvitations = async () => {
      try {
        const response = await fetch("/api/invitations/inbound");
        if (!response.ok) {
          throw new Error("Failed to fetch invitations");
        }

        const data = await response.json();
        const formattedInvitations = data.inbound.map(formatInvitationData);
        setInvitations(formattedInvitations);
      } catch (error) {
        console.error("Failed to fetch invitations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch initial data once
    fetchInitialInvitations();

    // Set up real-time subscription with user-specific channel
    console.log('Setting up real-time subscription for:', session.user.email);
    const channel = supabase
      .channel(`user-invitations-${session.user.email}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations',
          filter: `to_user_email=eq.${session.user.email}`
        },
        async (payload) => {
          console.log('Real-time invitation update:', payload);
          console.log('Event type:', payload.eventType);
          console.log('Payload new:', payload.new);
          console.log('Payload old:', payload.old);

          if (payload.eventType === 'INSERT') {
            const newInvitation = payload.new as any;
            if (newInvitation.status === 'pending' && new Date(newInvitation.expires_at) > new Date()) {
              try {
                // Fetch user data to get the actual name
                const userResponse = await fetch(`/api/users/${encodeURIComponent(newInvitation.from_user_email)}`);
                const userData = userResponse.ok ? await userResponse.json() : null;

                const formattedInvitation: PendingInvitation = {
                  id: newInvitation.id,
                  fromUser: {
                    email: newInvitation.from_user_email,
                    name: userData?.name || newInvitation.from_user_email.split("@")[0],
                    avatar: userData?.avatar || null,
                  },
                  status: newInvitation.status,
                  relationship: newInvitation.relationship,
                  sentAt: new Date(newInvitation.sent_at),
                  expiresAt: new Date(newInvitation.expires_at),
                  sessionId: newInvitation.session_id,
                };
                setInvitations(prev => [formattedInvitation, ...prev]);
              } catch (error) {
                console.error('Failed to fetch user data for new invitation:', error);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedInvitation = payload.new as any;
            // Remove invitation if status changed from pending (accepted, declined, cancelled)
            if (updatedInvitation.status !== 'pending') {
              setInvitations(prev => prev.filter(inv => inv.id !== updatedInvitation.id));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedInvitation = payload.old as any;
            setInvitations(prev => prev.filter(inv => inv.id !== deletedInvitation.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.email]);

  const handleAccept = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "accept" })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      // Remove invitation from list after accepting
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));

      // Navigate to survey page with sessionId
      router.push(`/survey/${data.sessionId}`);

    } catch (error) {
      console.error("Failed to accept invitation:", error);
      alert(error instanceof Error ? error.message : "Failed to accept invitation");
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "decline" })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to decline invitation");
      }

      // Remove invitation from list after declining
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error("Failed to decline invitation:", error);
      alert(error instanceof Error ? error.message : "Failed to decline invitation");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>
          Quiz invitations waiting for your response
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No pending invitations
          </p>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={invitation.fromUser.avatar || undefined}
                    alt={invitation.fromUser.name}
                    fallback={invitation.fromUser.name?.charAt(0) || invitation.fromUser.email.charAt(0).toUpperCase()}
                    status="pending"
                    size="md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{invitation.fromUser.name}</p>
                        <Badge variant="secondary">{invitation.relationship}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {invitation.sentAt.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(invitation.id)}
                    className="flex-1"
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDecline(invitation.id)}
                    className="flex-1"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}