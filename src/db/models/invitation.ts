import { Schema, model, models, Document, Types } from "mongoose";

enum InvitationStatus {
  Pending = "pending",
  Accepted = "accepted",
  Declined = "declined",
  Expired = "expired",
}
export interface IInvitation extends Document {
  fromUser: Types.ObjectId;
  toEmail: string;
  status: InvitationStatus;
  expiresAt: Date;
  sentAt: Date;
  sessionId?: string; // Link to survey session once accepted
}

const invitationSchema = new Schema<IInvitation>({
  fromUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  toEmail: {
    type: String,
    required: true,
    lowercase: true,
    validate: {
      validator: function (email: string) {
        // Cornell email validation
        return email.endsWith("@cornell.edu") || email === "cornell.perfectmatch@gmail.com";
      },
      message:
        "Email must be a Cornell email address (@cornell.edu) or cornell.perfectmatch@gmail.com",
    },
  },
  status: {
    type: String,
    enum: Object.values(InvitationStatus),
    required: true,
    default: InvitationStatus.Pending,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
  },
  sentAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  sessionId: {
    type: String,
    // Will be set when invitation is accepted and survey session is created
  },
});

// Indexes for performance
invitationSchema.index({ fromUser: 1 });
invitationSchema.index({ toEmail: 1 });
invitationSchema.index({ status: 1 });
invitationSchema.index({ expiresAt: 1 });
invitationSchema.index({ sessionId: 1 });

// Methods
invitationSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

invitationSchema.methods.accept = function (sessionId: string) {
  this.status = InvitationStatus.Accepted;
  this.sessionId = sessionId;
  return this.save();
};

invitationSchema.methods.decline = function () {
  this.status = InvitationStatus.Declined;
  return this.save();
};

// Auto-expire invitations after 30 minutes
invitationSchema.methods.checkAndExpire = function () {
  if (this.isExpired() && this.status === InvitationStatus.Pending) {
    this.status = InvitationStatus.Expired;
    return this.save();
  }
  return Promise.resolve(this);
};

export default models.Invitation || model<IInvitation>("Invitation", invitationSchema);
