"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RelationshipType,
  RELATIONSHIP_LABELS,
  getAllRelationshipTypes,
} from "@/lib/constants/relationships";
import { UserAvatar } from "@/components/user-avatar";
import { Heart } from "lucide-react";
import { useInvitationForm } from "@/hooks/useInvitationForm";

export function InvitationForm() {
  const {
    netid,
    relationship,
    isLoading,
    invitationDetails,
    session,
    setNetid,
    setRelationship,
    handleSubmit,
    resendInvitation,
    cancelInvitation,
  } = useInvitationForm();

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
                  <p className="text-sm text-muted-foreground">
                    Invitation sent! Waiting for response...
                  </p>
                  <div className="flex justify-center space-x-2">
                    <Button size="sm" onClick={resendInvitation} variant="outline">
                      Send Again
                    </Button>
                    <Button
                      size="sm"
                      onClick={cancelInvitation}
                      variant="destructive"
                      className="ml-2"
                    >
                      Cancel Invitation
                    </Button>
                  </div>
                </div>
              )}
              {invitationDetails.status === "accepted" && (
                <p className="text-sm text-green-600">
                  ✓ Invitation accepted! Ready to start quiz.
                </p>
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
              disabled={
                invitationDetails.status === "pending" || invitationDetails.status === "accepted"
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">How would you describe yourselves?</Label>
            <select
              id="relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as RelationshipType)}
              disabled={
                invitationDetails.status === "pending" || invitationDetails.status === "accepted"
              }
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
            disabled={
              isLoading ||
              !netid.trim() ||
              invitationDetails.status === "pending" ||
              invitationDetails.status === "accepted"
            }
          >
            {isLoading ? "Sending..." : "Send Invitation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
