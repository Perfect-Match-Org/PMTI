"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "./user-avatar";

interface PendingInvitation {
  id: string;
  fromUser: string;
  relationship: string;
  createdAt: Date;
  userAvatar?: string;
  userDisplayName?: string;
}

export function PendingInvitations() {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch pending invitations from API
    const fetchInvitations = async () => {
      try {
        // Placeholder data for now
        setInvitations([
          {
            id: "1",
            fromUser: "john.doe",
            relationship: "Couple",
            createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            userDisplayName: "John Doe",
            userAvatar: undefined // Will show fallback
          },
          {
            id: "2", 
            fromUser: "jane.smith",
            relationship: "Besties",
            createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
            userDisplayName: "Jane Smith",
            userAvatar: undefined
          }
        ]);
      } catch (error) {
        console.error("Failed to fetch invitations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitations();
  }, []);

  const handleAccept = async (invitationId: string) => {
    // TODO: Accept invitation API call
    console.log("Accepting invitation:", invitationId);
    // Remove invitation from list after accepting
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
  };

  const handleDecline = async (invitationId: string) => {
    // TODO: Decline invitation API call
    console.log("Declining invitation:", invitationId);
    // Remove invitation from list after declining
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
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
                    src={invitation.userAvatar}
                    alt={invitation.userDisplayName}
                    fallback={invitation.userDisplayName?.charAt(0) || invitation.fromUser.charAt(0).toUpperCase()}
                    status="pending"
                    size="md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{invitation.userDisplayName || invitation.fromUser}</p>
                        <Badge variant="secondary">{invitation.relationship}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {invitation.createdAt.toLocaleTimeString()}
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