import { Schema, model, models, Document } from "mongoose";
import { CoupleTypeCode } from "@/lib/constants/coupleTypes";

// CoupleType Analytics Interface
export interface ICoupleTypeAnalytics extends Document {
  typeCode: CoupleTypeCode;
  frequency: number;
  lastUpdated: Date;
}

// Question Analytics Interface
export interface IQuestionAnalytics extends Document {
  questionId: string;
  optionFrequency: Map<string, number>;
  coupleAgreementRate: number;
  lastUpdated: Date;
}

// CoupleType Analytics Schema
const coupleTypeAnalyticsSchema = new Schema<ICoupleTypeAnalytics>({
  typeCode: {
    type: String,
    enum: Object.values(CoupleTypeCode),
    required: true,
    unique: true,
  },
  frequency: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// Question Analytics Schema
const questionAnalyticsSchema = new Schema<IQuestionAnalytics>({
  questionId: {
    type: String,
    required: true,
    unique: true,
  },
  optionFrequency: {
    type: Map,
    of: Number,
    required: true,
    default: () => new Map(),
  },
  coupleAgreementRate: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100,
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// CoupleType Analytics Indexes
coupleTypeAnalyticsSchema.index({ typeCode: 1 });
coupleTypeAnalyticsSchema.index({ frequency: -1 });
coupleTypeAnalyticsSchema.index({ lastUpdated: 1 });

// Question Analytics Indexes
questionAnalyticsSchema.index({ questionId: 1 });
questionAnalyticsSchema.index({ coupleAgreementRate: -1 });
questionAnalyticsSchema.index({ lastUpdated: 1 });

// CoupleType Analytics Methods
coupleTypeAnalyticsSchema.methods.incrementFrequency = function (): Promise<ICoupleTypeAnalytics> {
  this.frequency += 1;
  this.lastUpdated = new Date();
  return this.save();
};

coupleTypeAnalyticsSchema.statics.getMostPopularTypes = function (
  limit: number = 10
): Promise<ICoupleTypeAnalytics[]> {
  return this.find({}).sort({ frequency: -1 }).limit(limit);
};

// Question Analytics Methods
questionAnalyticsSchema.methods.updateOptionFrequency = function (
  optionId: string
): Promise<IQuestionAnalytics> {
  const currentCount = this.optionFrequency.get(optionId) || 0;
  this.optionFrequency.set(optionId, currentCount + 1);
  this.lastUpdated = new Date();
  return this.save();
};

questionAnalyticsSchema.methods.updateAgreementRate = function (
  newRate: number
): Promise<IQuestionAnalytics> {
  this.coupleAgreementRate = newRate;
  this.lastUpdated = new Date();
  return this.save();
};

questionAnalyticsSchema.statics.getMostAgreedQuestions = function (
  limit: number = 10
): Promise<IQuestionAnalytics[]> {
  return this.find({}).sort({ coupleAgreementRate: -1 }).limit(limit);
};

questionAnalyticsSchema.statics.getMostDisagreedQuestions = function (
  limit: number = 10
): Promise<IQuestionAnalytics[]> {
  return this.find({}).sort({ coupleAgreementRate: 1 }).limit(limit);
};

// Export models
export const CoupleTypeAnalytics =
  models.CoupleTypeAnalytics ||
  model<ICoupleTypeAnalytics>("CoupleTypeAnalytics", coupleTypeAnalyticsSchema);
export const QuestionAnalytics =
  models.QuestionAnalytics ||
  model<IQuestionAnalytics>("QuestionAnalytics", questionAnalyticsSchema);
