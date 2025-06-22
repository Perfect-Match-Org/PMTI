import { Schema, model, models, Document, Types } from "mongoose";
import { CoupleTypeCode, ScoreWeights } from "@/lib/constants/coupleTypes";
import { RelationshipType } from "@/lib/constants/relationships";
import { getQuestionById, QuestionType } from "@/lib/constants/questions";

enum SurveyStatus {
  Started = "started",
  Completed = "completed",
  Abandoned = "abandoned",
}

export interface ISurveyResponse {
  questionId: string;
  user1Response: {
    selectedOption: string;
    timestamp: Date;
  };
  user2Response: {
    selectedOption: string;
    timestamp: Date;
  };
}

export interface ISurvey extends Document {
  participants: {
    user1: Types.ObjectId;
    user2: Types.ObjectId;
    relationship: RelationshipType;
  };
  sessionId: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;

  // Current progress state (for reconnection handling)
  currentProgress: {
    currentQuestionIndex: number; // Which question they're on
    user1CurrentChoice?: string; // Current selected option (may change before final)
    user2CurrentChoice?: string; // Current selected option (may change before final)
    lastActivityAt: Date; // For detecting inactive sessions
  };
  result?: {
    coupleType: CoupleTypeCode;
    user1Scores: ScoreWeights;
    user2Scores: ScoreWeights;
    compatibility: {
      overallScore: number;
      dimensions: {
        communication: number;
        adventure: number;
        values: number;
      };
    };
  };
  responses: ISurveyResponse[];
  surveyVersion: string;
  status: SurveyStatus;
}

const surveyResponseSchema = new Schema<ISurveyResponse>(
  {
    questionId: {
      type: String,
      required: true,
    },
    user1Response: {
      selectedOption: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        required: true,
      },
    },
    user2Response: {
      selectedOption: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        required: true,
      },
    },
  },
  { _id: false }
);

// Validation for cooperative questions - both users must have same response
surveyResponseSchema.pre('validate', function() {
  const question = getQuestionById(this.questionId);
  if (question && question.type === QuestionType.Cooperative) {
    if (this.user1Response.selectedOption !== this.user2Response.selectedOption) {
      throw new Error(`Cooperative question ${this.questionId} requires both users to have the same response`);
    }
  }
  
  // Validate that selected options exist for the question
  if (question) {
    const validOptions = question.options.map(opt => opt.id);
    if (!validOptions.includes(this.user1Response.selectedOption)) {
      throw new Error(`Invalid option ${this.user1Response.selectedOption} for question ${this.questionId}`);
    }
    if (!validOptions.includes(this.user2Response.selectedOption)) {
      throw new Error(`Invalid option ${this.user2Response.selectedOption} for question ${this.questionId}`);
    }
  }
});

// Create a schema that matches the ScoreWeights interface structure
const scoreWeightsSchema = new Schema(
  {
    communication: { type: Number, required: true, min: 0, max: 10 },
    adventure: { type: Number, required: true, min: 0, max: 10 },
    values: { type: Number, required: true, min: 0, max: 10 },
  },
  { _id: false }
);

const surveySchema = new Schema<ISurvey>({
  participants: {
    user1: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user2: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    relationship: {
      type: String,
      enum: Object.values(RelationshipType),
      required: true,
    },
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  duration: {
    type: Number,
    min: 0,
  },
  result: {
    coupleType: {
      type: String,
      enum: Object.values(CoupleTypeCode),
    },
    user1Scores: scoreWeightsSchema,
    user2Scores: scoreWeightsSchema,
    compatibility: {
      overallScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      dimensions: {
        communication: { type: Number, min: 0, max: 100 },
        adventure: { type: Number, min: 0, max: 100 },
        values: { type: Number, min: 0, max: 100 },
      },
    },
  },
  currentProgress: {
    currentQuestionIndex: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    user1CurrentChoice: {
      type: String,
    },
    user2CurrentChoice: {
      type: String,
    },
    lastActivityAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  responses: [surveyResponseSchema],
  surveyVersion: {
    type: String,
    required: true,
    default: "1.0",
  },
  status: {
    type: String,
    enum: Object.values(SurveyStatus),
    required: true,
    default: SurveyStatus.Started,
  },
});

// Indexes for performance
surveySchema.index({ "participants.user1": 1, "participants.user2": 1 });
surveySchema.index({ completedAt: 1 });
surveySchema.index({ "result.coupleType": 1 });
surveySchema.index({ sessionId: 1 });
surveySchema.index({ status: 1 });

// Methods
surveySchema.methods.addResponse = function (
  questionId: string,
  user1Option: string,
  user2Option: string
): Promise<ISurvey> {
  this.responses.push({
    questionId,
    user1Response: {
      selectedOption: user1Option,
      timestamp: new Date(),
    },
    user2Response: {
      selectedOption: user2Option,
      timestamp: new Date(),
    },
  });
  return this.save();
};

surveySchema.methods.completeSurvey = function (result: ISurvey["result"]): Promise<ISurvey> {
  this.result = result;
  this.completedAt = new Date();
  this.duration = Math.floor((this.completedAt.getTime() - this.startedAt.getTime()) / 1000);
  this.status = SurveyStatus.Completed;
  return this.save();
};

// Method to update current progress (for reconnection handling)
surveySchema.methods.updateCurrentProgress = function (
  questionIndex: number,
  userId: Types.ObjectId,
  selectedChoice?: string
): Promise<ISurvey> {
  this.currentProgress.currentQuestionIndex = questionIndex;
  this.currentProgress.lastActivityAt = new Date();

  // Update the appropriate user's choice
  if (this.participants.user1.equals(userId)) {
    this.currentProgress.user1CurrentChoice = selectedChoice;
  } else if (this.participants.user2.equals(userId)) {
    this.currentProgress.user2CurrentChoice = selectedChoice;
  }

  return this.save();
};

export default models.Survey || model<ISurvey>("Survey", surveySchema);
