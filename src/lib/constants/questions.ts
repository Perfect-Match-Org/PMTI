// Static questions for PMTI survey - stored as frontend constants
// This allows easy updates without database migrations
import { ScoreWeights } from "./coupleTypes";

export interface QuestionOption {
  id: string; // "A", "B", "C", "D"
  text: string;
  scores: ScoreWeights; // Uses same scoring system as couple types
}

export enum QuestionType {
  Individual = "individual", // Each user answers separately in parallel
  CooperativeFlexible = "cooperative_flexible", // Both users can see each other's choices but can answer independently
  // Cooperative = "cooperative", // Both users must collaborate to select one answer together
}

export enum CooperativeMode {
  RequireConsensus = "require_consensus", // Both must agree on the same answer
  AllowIndependent = "allow_independent", // Can see partner's choice but submit independently
}

// This enum defines user roles. Currently plays in effect for perspective. Determined by email comparison
// Could be extended in the future for like using gender for role determination
export enum UserRole {
  User1 = "user1",
  User2 = "user2",
}

export interface Question {
  questionId: string; // Unique identifier like "Q001"

  // Question type determines completion behavior
  type: QuestionType;

  // For cooperative questions, specify the interaction mode
  cooperativeMode?: CooperativeMode;

  // Question content
  storyline: string; // The scenario text

  // Different POVs for each participant
  perspectives: {
    user1: {
      question: string;
      context?: string; // Additional context for this POV
    };
    user2: {
      question: string;
      context?: string;
    };
    // For cooperative questions, shared perspective
    shared?: {
      question: string;
      context?: string;
      instructions?: string; // Instructions for how to collaborate
    };
  };

  // Answer options
  options: QuestionOption[];

  // Visual elements
  graphic?: {
    defaultUrl: string;
    optionUrls?: Record<string, string>; // Different graphics per option
  };

  // Metadata
  order: number; // Display order
  category?: string; // Optional categorization like "leisure", "conflict", "future". This should be enum in the future
}

export const SURVEY_QUESTIONS: Question[] = [
  {
    questionId: "Q001",
    type: QuestionType.Individual,
    storyline:
      "It's Friday evening and you both just finished a long work week. You're both tired but want to spend quality time together.",
    perspectives: {
      user1: {
        question: "What sounds most appealing to you right now?",
        context: "Think about what would help you unwind and connect",
      },
      user2: {
        question: "How would you prefer to spend the evening together?",
        context: "Consider what would make you both feel relaxed and happy",
      },
    },
    options: [
      {
        id: "A",
        text: "Order takeout and watch Netflix on the couch",
        scores: { communication: 3, adventure: 2, values: 8 },
      },
      {
        id: "B",
        text: "Try that new restaurant downtown you've been talking about",
        scores: { communication: 6, adventure: 7, values: 5 },
      },
      {
        id: "C",
        text: "Cook dinner together and have a deep conversation",
        scores: { communication: 9, adventure: 3, values: 7 },
      },
      {
        id: "D",
        text: "Go out dancing or to a live music venue",
        scores: { communication: 4, adventure: 9, values: 4 },
      },
    ],
    graphic: {
      defaultUrl: "/graphics/friday-evening.svg",
      optionUrls: {
        A: "/graphics/netflix-couch.svg",
        B: "/graphics/restaurant.svg",
        C: "/graphics/dinner-conversation.svg",
        D: "/graphics/dancing.svg",
      },
    },
    order: 1,
    category: "leisure",
  },

  {
    questionId: "Q002",
    type: QuestionType.Individual,
    storyline:
      "You're planning a vacation together. You have a week off and a decent budget, but you have different ideas about what would be fun.",
    perspectives: {
      user1: {
        question: "What type of vacation appeals to you most?",
        context: "Think about what would make you feel most fulfilled",
      },
      user2: {
        question: "How would you want to spend your vacation time?",
        context: "Consider what would create the best memories together",
      },
    },
    options: [
      {
        id: "A",
        text: "Detailed itinerary visiting multiple cities and attractions",
        scores: { communication: 5, adventure: 8, values: 4 },
      },
      {
        id: "B",
        text: "Relaxing beach resort with spa treatments and leisure time",
        scores: { communication: 4, adventure: 3, values: 8 },
      },
      {
        id: "C",
        text: "Adventure trip with hiking, activities, and exploration",
        scores: { communication: 6, adventure: 10, values: 5 },
      },
      {
        id: "D",
        text: "Cultural immersion staying with locals and learning traditions",
        scores: { communication: 8, adventure: 7, values: 9 },
      },
    ],
    graphic: {
      defaultUrl: "/graphics/vacation-planning.svg",
      optionUrls: {
        A: "/graphics/city-tour.svg",
        B: "/graphics/beach-resort.svg",
        C: "/graphics/adventure-hiking.svg",
        D: "/graphics/cultural-immersion.svg",
      },
    },
    order: 2,
    category: "adventure",
  },
  {
    questionId: "Q004",
    type: QuestionType.Individual,
    storyline:
      "It's a typical weekend and you have no specific plans. You both have free time and energy to do whatever you want.",
    perspectives: {
      user1: {
        question: "What would make for a perfect weekend day?",
        context: "Think about what energizes and fulfills you",
      },
      user2: {
        question: "How would you ideally spend your free weekend time?",
        context: "Consider what would make you feel most satisfied",
      },
    },
    options: [
      {
        id: "A",
        text: "Organize and improve something in your living space together",
        scores: { communication: 6, adventure: 2, values: 9 },
      },
      {
        id: "B",
        text: "Explore a new neighborhood or try a new activity",
        scores: { communication: 5, adventure: 9, values: 4 },
      },
      {
        id: "C",
        text: "Have friends over for games, food, and conversation",
        scores: { communication: 8, adventure: 6, values: 7 },
      },
      {
        id: "D",
        text: "Spend quiet time together reading, relaxing, or pursuing hobbies",
        scores: { communication: 4, adventure: 1, values: 10 },
      },
    ],
    graphic: {
      defaultUrl: "/graphics/weekend-activities.svg",
      optionUrls: {
        A: "/graphics/home-organizing.svg",
        B: "/graphics/exploring-neighborhood.svg",
        C: "/graphics/friends-over.svg",
        D: "/graphics/quiet-hobbies.svg",
      },
    },
    order: 4,
    category: "leisure",
  },
];

// Utility functions for working with questions
export const getQuestionById = (questionId: string): Question | undefined => {
  return SURVEY_QUESTIONS.find((q) => q.questionId === questionId);
};

export const getQuestionsInOrder = (): Question[] => {
  return SURVEY_QUESTIONS.sort((a, b) => a.order - b.order);
};

export const getTotalQuestions = (): number => {
  return SURVEY_QUESTIONS.length;
};

export const getQuestionsByCategory = (category: string): Question[] => {
  return SURVEY_QUESTIONS.filter((q) => q.category === category);
};

export const getAllCategories = (): string[] => {
  const categories = SURVEY_QUESTIONS.map((q) => q.category).filter(Boolean) as string[];
  return [...new Set(categories)];
};

// For calculating scores from survey responses
// Simple function just as placeholder
export const calculateScoresFromResponses = (
  responses: { questionId: string; selectedOption: string }[]
): ScoreWeights => {
  const totalScores = { communication: 0, adventure: 0, values: 0 };
  let questionCount = 0;

  responses.forEach((response) => {
    const question = getQuestionById(response.questionId);
    if (question) {
      const option = question.options.find((opt) => opt.id === response.selectedOption);
      if (option) {
        totalScores.communication += option.scores.communication;
        totalScores.adventure += option.scores.adventure;
        totalScores.values += option.scores.values;
        questionCount++;
      }
    }
  });

  // Return average scores
  return {
    communication: questionCount > 0 ? totalScores.communication / questionCount : 0,
    adventure: questionCount > 0 ? totalScores.adventure / questionCount : 0,
    values: questionCount > 0 ? totalScores.values / questionCount : 0,
  };
};
