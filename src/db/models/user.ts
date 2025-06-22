import { Schema, model, models, Document, Types } from "mongoose";
import { RelationshipType } from "@/lib/constants/relationships";

interface ISurveyHistory {
  surveyId: Types.ObjectId;
  partnerId: Types.ObjectId;
  relationship: RelationshipType;
  completedAt: Date;
}

export interface IUser extends Document {
  email: string;
  name: string;
  surveyHistory: ISurveyHistory[];
  totalSurveysTaken: number;
  preferences: {
    emailNotifications: boolean;
  };
}

const surveyHistorySchema = new Schema<ISurveyHistory>(
  {
    surveyId: {
      type: Schema.Types.ObjectId,
      ref: "Survey",
      required: true,
    },
    partnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    relationship: {
      type: String,
      enum: Object.values(RelationshipType),
      required: true,
    },
    completedAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
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
  name: {
    type: String,
    required: true,
    trim: true,
  },
  surveyHistory: [surveyHistorySchema],
  totalSurveysTaken: {
    type: Number,
    default: 0,
    min: 0,
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
  },
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ "surveyHistory.partnerId": 1 });

// Methods
userSchema.methods.addSurveyToHistory = function (
  surveyId: Types.ObjectId,
  partnerId: Types.ObjectId,
  relationship: RelationshipType
): Promise<IUser> {
  this.surveyHistory.push({
    surveyId,
    partnerId,
    relationship,
    completedAt: new Date(),
  });
  this.totalSurveysTaken += 1;
  return this.save();
};

userSchema.methods.getSurveyPartners = function (): Types.ObjectId[] {
  return this.surveyHistory.map((entry: ISurveyHistory) => entry.partnerId);
};

export default models.User || model<IUser>("User", userSchema);
