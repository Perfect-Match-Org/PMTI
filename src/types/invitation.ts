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

export interface OutboundInvitation {
  id: string;
  toUser: {
    email: string;
    name: string;
    avatar: string | null;
  };
  status: "pending" | "accepted" | "declined" | "cancelled";
  relationship: string;
  sentAt: Date;
  expiresAt: Date;
  sessionId: string | null;
}

export interface InvitationFormState {
  id?: string;
  name?: string;
  avatar?: string;
  status: "empty" | "pending" | "accepted" | "rejected";
  sessionId?: string;
}
