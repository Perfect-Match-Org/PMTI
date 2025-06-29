export interface PendingInvitation {
  id: string;
  fromUser: {
    email: string;
    name: string;
    avatar: string | null;
  };
  status: string;
  relationship: string;
  sentAt: Date;
  expiresAt: Date;
  sessionId: string | null;
}
