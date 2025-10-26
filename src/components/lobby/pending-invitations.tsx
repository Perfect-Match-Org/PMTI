"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import { usePendingInvitations } from "@/hooks/usePendingInvitations";

export function PendingInvitations() {
  const { invitations, isLoading, handleAccept, handleDecline } = usePendingInvitations();

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
        <CardDescription>Quiz invitations waiting for your response</CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No pending invitations</p>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={invitation.fromUser.avatar || undefined}
                    alt={invitation.fromUser.name}
                    fallback={
                      invitation.fromUser.name?.charAt(0) ||
                      invitation.fromUser.email.charAt(0).toUpperCase()
                    }
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
                  <Button size="sm" onClick={() => handleAccept(invitation.id)} className="flex-1">
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
