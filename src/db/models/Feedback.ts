import { Schema, model, models, Document, Types } from "mongoose";

enum FeedbackRating {
  Positive = "positive",
  Negative = "negative",
}

export interface IFeedback extends Document {
  surveyId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: FeedbackRating;
  detailed?: {
    accuracy: number;
    enjoyment: number;
  };
  comments?: string;
  submittedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
  surveyId: {
    type: Schema.Types.ObjectId,
    ref: "Survey",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: String,
    enum: Object.values(FeedbackRating),
    required: true,
  },
  detailed: {
    accuracy: {
      type: Number,
      min: 1,
      max: 5,
    },
    enjoyment: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  comments: {
    type: String,
    maxlength: 1000,
  },
  submittedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// Indexes for performance
feedbackSchema.index({ surveyId: 1 });
feedbackSchema.index({ userId: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ submittedAt: 1 });

export default models.Feedback || model<IFeedback>("Feedback", feedbackSchema);
