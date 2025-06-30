import { pgEnum } from "drizzle-orm/pg-core";

// Shared CoupleType constants for frontend and backend sync
// This file should be imported by both frontend components and backend API routes

export enum CoupleTypeCode {
  ADVENTUROUS_PLANNERS = "ADVENTUROUS_PLANNERS",
  COZY_HOMEBODIES = "COZY_HOMEBODIES",
  SOCIAL_BUTTERFLIES = "SOCIAL_BUTTERFLIES",
  THOUGHTFUL_DEEP_THINKERS = "THOUGHTFUL_DEEP_THINKERS",
  SPONTANEOUS_ADVENTURERS = "SPONTANEOUS_ADVENTURERS",
  BALANCED_PARTNERS = "BALANCED_PARTNERS",
  CREATIVE_COLLABORATORS = "CREATIVE_COLLABORATORS",
  SUPPORTIVE_COMPANIONS = "SUPPORTIVE_COMPANIONS",
  AMBITIOUS_ACHIEVERS = "AMBITIOUS_ACHIEVERS",
  RELAXED_ROMANTICS = "RELAXED_ROMANTICS",
  INTELLECTUAL_EXPLORERS = "INTELLECTUAL_EXPLORERS",
  PRACTICAL_PARTNERS = "PRACTICAL_PARTNERS",
  PLAYFUL_COMPANIONS = "PLAYFUL_COMPANIONS",
  MINDFUL_MATCHES = "MINDFUL_MATCHES",
  INDEPENDENT_TOGETHER = "INDEPENDENT_TOGETHER",
  TRADITIONAL_SWEETHEARTS = "TRADITIONAL_SWEETHEARTS",
}

export interface CoupleTypeDefinition {
  code: CoupleTypeCode;
  displayName: string;
  shortDescription: string;
  description: {
    summary: string;
    traits: string[];
    strengths: string[];
    challenges?: string[];
    conflictResolution?: {
      style: string;
      tips: string[];
    };
    loveLanguages?: {
      primary: string[];
      secondary: string[];
    };
    dateIdeas?: string[];
    descriptorWords?: {
      "s&p": string;
      "p&e": string;
      "a&r": string;
    }
  };
  graphic: {
    iconUrl: string;
    colorScheme: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
}

// Utility functions for working with couple types
export const getCoupleTypeByCode = (code: CoupleTypeCode): CoupleTypeDefinition => {
  return COUPLE_TYPES[code];
};

export const getAllCoupleTypes = (): CoupleTypeDefinition[] => {
  return Object.values(COUPLE_TYPES);
};

export const getCoupleTypeNames = (): string[] => {
  return Object.values(COUPLE_TYPES).map((type) => type.displayName);
};

// For calculating couple types from quiz responses
export interface ScoreWeights {
  communication: number;
  adventure: number;
  values: number;
}

// PostgreSQL enum for Drizzle ORM
export const coupleTypeEnum = pgEnum(
  "couple_type_code",
  Object.values(CoupleTypeCode) as [CoupleTypeCode, ...CoupleTypeCode[]]
);

export const calculateCoupleType = (
  user1Scores: ScoreWeights,
  user2Scores: ScoreWeights
): CoupleTypeCode => {
  // Combine scores from both users
  const combinedScores: ScoreWeights = {
    communication: (user1Scores.communication + user2Scores.communication) / 2,
    adventure: (user1Scores.adventure + user2Scores.adventure) / 2,
    values: (user1Scores.values + user2Scores.values) / 2,
  };

  // Simple algorithm - you can make this more sophisticated
  if (combinedScores.adventure > 7 && combinedScores.communication > 6) {
    return CoupleTypeCode.ADVENTUROUS_PLANNERS;
  } else if (combinedScores.adventure < 4 && combinedScores.values > 7) {
    return CoupleTypeCode.COZY_HOMEBODIES;
  } else if (combinedScores.communication > 8) {
    return CoupleTypeCode.SOCIAL_BUTTERFLIES;
  } else if (combinedScores.values > 8) {
    return CoupleTypeCode.THOUGHTFUL_DEEP_THINKERS;
  } else if (combinedScores.adventure > 8) {
    return CoupleTypeCode.SPONTANEOUS_ADVENTURERS;
  } else {
    return CoupleTypeCode.BALANCED_PARTNERS;
  }
};

// Example couple type definitions (you can expand these)
export const COUPLE_TYPES: Record<CoupleTypeCode, CoupleTypeDefinition> = {
  [CoupleTypeCode.ADVENTUROUS_PLANNERS]: {
    code: CoupleTypeCode.ADVENTUROUS_PLANNERS,
    displayName: "The Adventure Planners",
    shortDescription: "Organized explorers who love planning their next big adventure",
    description: {
      summary:
        "You both love exploring new places and making detailed plans for your adventures. You're the couple with the shared Pinterest board full of travel destinations and the Google Sheets itinerary for every trip.",
      traits: ["Organized", "Adventurous", "Future-focused", "Detail-oriented"],
      strengths: [
        "Great at planning trips",
        "Always trying new things",
        "Good at researching and preparing",
      ],
      challenges: [
        "Might over-plan spontaneous moments",
        "Could stress about sticking to schedules",
      ],
      conflictResolution: {
        style: "Talk through issues with a plan",
        tips: [
          "Create a 'discussion agenda' when addressing conflicts",
          "Plan regular check-ins about your relationship",
        ],
      },
      loveLanguages: {
        primary: ["Quality Time", "Acts of Service"],
        secondary: ["Gift Giving", "Words of Affirmation"],
      },
    },
    graphic: {
      iconUrl: "/huajie.png",
      colorScheme: {
        primary: "#4F46E5",
        secondary: "#7C3AED",
        accent: "#F59E0B",
      },
    },
  },

  [CoupleTypeCode.COZY_HOMEBODIES]: {
    code: CoupleTypeCode.COZY_HOMEBODIES,
    displayName: "The Cozy Homebodies",
    shortDescription: "Comfort-lovers who find joy in simple, intimate moments together",
    description: {
      summary: "You both prefer staying in over going out, finding comfort in familiar routines and cozy nights together. Your ideal date is probably a movie night with takeout and soft blankets.",
      traits: ["Comfort-seeking", "Intimate", "Routine-loving", "Content"],
      strengths: [
        "Create a warm, welcoming home environment",
        "Great at being present with each other",
        "Low-maintenance relationship needs",
      ],
      challenges: ["Might avoid new experiences", "Could get stuck in routines"],
      conflictResolution: {
        style: "Heart-to-heart conversations in comfortable settings",
        tips: [
          "Have difficult conversations at home where you feel safe",
          "Create cozy spaces for regular relationship talks",
        ],
      },
      loveLanguages: {
        primary: ["Physical Touch", "Quality Time"],
        secondary: ["Acts of Service", "Words of Affirmation"],
      },
      dateIdeas: ["Cat cafe meetup", "Super Smash Brothers Ultimate Tournament", "Organic Chem Tutor Watch Party"],
      descriptorWords: {
        "s&p": "You value routine and comfort in familiar patterns",
        "p&e": "You cherish intimate moments away from the outside world",
        "a&r": "You prefer contemplating life's simple pleasures together"
      }
    },
    graphic: {
      iconUrl: "/huajie.png",
      colorScheme: {
        primary: "#DC2626",
        secondary: "#F97316",
        accent: "#FACC15",
      },
    },
  },
    // Add placeholders for other types - you can fill these in later
    [CoupleTypeCode.SOCIAL_BUTTERFLIES]: {
      code: CoupleTypeCode.SOCIAL_BUTTERFLIES,
      displayName: "The Social Butterflies",
      shortDescription: "Outgoing pairs who thrive in social settings and love meeting new people",
      description: {
        summary: "You both love being around people and thrive in social situations...",
        traits: ["Outgoing", "Social", "Energetic", "People-focused"],
        strengths: [
          "Great at networking together",
          "Always have weekend plans",
          "Bring out the best in each other socially",
        ],
      },
      graphic: {
        iconUrl: "/huajie.png",
        colorScheme: { primary: "#059669", secondary: "#0891B2", accent: "#7C3AED" },
      },
    },

    [CoupleTypeCode.THOUGHTFUL_DEEP_THINKERS]: {
      code: CoupleTypeCode.THOUGHTFUL_DEEP_THINKERS,
      displayName: "The Thoughtful Deep Thinkers",
      shortDescription: "Reflective partners who enjoy meaningful conversations and personal growth",
      description: {
        summary: "You both value deep conversations and thoughtful reflection...",
        traits: ["Reflective", "Analytical", "Growth-oriented", "Philosophical"],
        strengths: [
          "Have meaningful conversations",
          "Support each other's personal growth",
          "Think before acting",
        ],
      },
      graphic: {
        iconUrl: "/huajie.png",
        colorScheme: { primary: "#7C2D12", secondary: "#A21CAF", accent: "#1E40AF" },
      },
    },

    // Add remaining types with basic structure
    [CoupleTypeCode.SPONTANEOUS_ADVENTURERS]: {
      code: CoupleTypeCode.SPONTANEOUS_ADVENTURERS,
      displayName: "The Spontaneous Adventurers",
      shortDescription: "Free spirits who love last-minute plans and unexpected experiences",
      description: {
        summary: "You both love spontaneity and unexpected adventures...",
        traits: ["Spontaneous", "Flexible", "Adventurous", "Open-minded"],
        strengths: ["Always up for new experiences", "Keep life exciting", "Adapt well to changes"],
      },
      graphic: {
        iconUrl: "/cindy.jpg",
        colorScheme: { primary: "#EA580C", secondary: "#DC2626", accent: "#65A30D" },
      },
    },

    [CoupleTypeCode.BALANCED_PARTNERS]: {
      code: CoupleTypeCode.BALANCED_PARTNERS,
      displayName: "The Balanced Partners",
      shortDescription: "Well-rounded couples who complement each other perfectly",
      description: {
        summary: "You both bring different strengths that complement each other perfectly...",
        traits: ["Balanced", "Complementary", "Stable", "Harmonious"],
        strengths: [
          "Complement each other's weaknesses",
          "Create stability together",
          "Handle different situations well",
        ],
      },
      graphic: {
        iconUrl: "/cindy.jpg",
        colorScheme: { primary: "#0F766E", secondary: "#7C3AED", accent: "#DB2777" },
      },
    },

    // Placeholder for remaining types - fill in as needed
    [CoupleTypeCode.CREATIVE_COLLABORATORS]: {
      code: CoupleTypeCode.CREATIVE_COLLABORATORS,
      displayName: "The Creative Collaborators",
      shortDescription: "Artistic souls who inspire and create together",
      description: { summary: "...", traits: [], strengths: [] },
      graphic: {
        iconUrl: "/cindy.jpg",
        colorScheme: { primary: "#7C3AED", secondary: "#DB2777", accent: "#F59E0B" },
      },
    },

    [CoupleTypeCode.SUPPORTIVE_COMPANIONS]: {
      code: CoupleTypeCode.SUPPORTIVE_COMPANIONS,
      displayName: "The Supportive Companions",
      shortDescription: "Caring partners who prioritize emotional support and understanding",
      description: { summary: "...", traits: [], strengths: [] },
      graphic: {
        iconUrl: "/cindy.jpg",
        colorScheme: { primary: "#059669", secondary: "#0891B2", accent: "#FACC15" },
      },
    },

    [CoupleTypeCode.AMBITIOUS_ACHIEVERS]: {
      code: CoupleTypeCode.AMBITIOUS_ACHIEVERS,
      displayName: "The Ambitious Achievers",
      shortDescription: "Goal-oriented couples who motivate each other to succeed",
      description: { summary: "...", traits: [], strengths: [] },
      graphic: {
        iconUrl: "/nick.jpg",
        colorScheme: { primary: "#1E40AF", secondary: "#DC2626", accent: "#F59E0B" },
      },
    },

    [CoupleTypeCode.RELAXED_ROMANTICS]: {
      code: CoupleTypeCode.RELAXED_ROMANTICS,
      displayName: "The Relaxed Romantics",
      shortDescription: "Easy-going lovers who prioritize romance and connection",
      description: { summary: "...", traits: [], strengths: [] },
      graphic: {
        iconUrl: "/nick.jpg",
        colorScheme: { primary: "#DB2777", secondary: "#F97316", accent: "#7C3AED" },
      },
    },

    [CoupleTypeCode.INTELLECTUAL_EXPLORERS]: {
      code: CoupleTypeCode.INTELLECTUAL_EXPLORERS,
      displayName: "The Intellectual Explorers",
      shortDescription: "Curious minds who love learning and exploring ideas together",
      description: { summary: "...", traits: [], strengths: [] },
      graphic: {
        iconUrl: "/nick.jpg",
        colorScheme: { primary: "#0F766E", secondary: "#1E40AF", accent: "#A21CAF" },
      },
    },

    [CoupleTypeCode.PRACTICAL_PARTNERS]: {
      code: CoupleTypeCode.PRACTICAL_PARTNERS,
      displayName: "The Practical Partners",
      shortDescription: "Down-to-earth couples who value stability and common sense",
      description: { summary: "...", traits: [], strengths: [] },
      graphic: {
        iconUrl: "/nick.jpg",
        colorScheme: { primary: "#7C2D12", secondary: "#059669", accent: "#F59E0B" },
      },
    },

    [CoupleTypeCode.PLAYFUL_COMPANIONS]: {
      code: CoupleTypeCode.PLAYFUL_COMPANIONS,
      displayName: "The Playful Companions",
      shortDescription: "Fun-loving pairs who keep life light and joyful",
      description: { summary: "...", traits: [], strengths: [] },
      graphic: {
        iconUrl: "/pratyush.jpg",
        colorScheme: { primary: "#FACC15", secondary: "#F97316", accent: "#7C3AED" },
      },
    },

    [CoupleTypeCode.MINDFUL_MATCHES]: {
      code: CoupleTypeCode.MINDFUL_MATCHES,
      displayName: "The Mindful Matches",
      shortDescription: "Conscious couples who prioritize mindfulness and intentional living",
      description: { summary: "...", traits: [], strengths: [] },
      graphic: {
        iconUrl: "/pratyush.jpg",
        colorScheme: { primary: "#65A30D", secondary: "#0F766E", accent: "#A21CAF" },
      },
    },

    [CoupleTypeCode.INDEPENDENT_TOGETHER]: {
      code: CoupleTypeCode.INDEPENDENT_TOGETHER,
      displayName: "The Independent Together",
      shortDescription: "Self-reliant individuals who choose to share their lives",
      description: { summary: "...", traits: [], strengths: [] },
      graphic: {
        iconUrl: "/pratyush.jpg",
        colorScheme: { primary: "#1E40AF", secondary: "#059669", accent: "#EA580C" },
      },
    },

    [CoupleTypeCode.TRADITIONAL_SWEETHEARTS]: {
      code: CoupleTypeCode.TRADITIONAL_SWEETHEARTS,
      displayName: "The Traditional Sweethearts",
      shortDescription: "Classic romantic partners who value timeless relationship values",
      description: { summary: "...", traits: [], strengths: [] },
      graphic: {
        iconUrl: "/pratyush.jpg",
        colorScheme: { primary: "#DB2777", secondary: "#7C2D12", accent: "#FACC15" },
      },
    },
  };