"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RelationshipType, RELATIONSHIP_LABELS, getAllRelationshipTypes } from "@/lib/constants/relationships";

export function InvitationForm() {
  const [netid, setNetid] = useState("");
  const [relationship, setRelationship] = useState<RelationshipType>(RelationshipType.COUPLE);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Call invitation API
      console.log("Sending invitation to:", netid, "as", relationship);
      // Placeholder for now
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Failed to send invitation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Your Partner</CardTitle>
        <CardDescription>
          Enter your partner's NetID to send them a quiz invitation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="netid">Partner's NetID</Label>
            <Input
              id="netid"
              type="text"
              placeholder="abc123"
              value={netid}
              onChange={(e) => setNetid(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">How would you describe yourselves?</Label>
            <select
              id="relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as RelationshipType)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {getAllRelationshipTypes().map((type) => (
                <option key={type} value={type}>
                  {RELATIONSHIP_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !netid.trim()}>
            {isLoading ? "Sending..." : "Send Invitation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}