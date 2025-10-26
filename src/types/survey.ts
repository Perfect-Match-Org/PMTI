import { UserRole, Question } from "@/lib/constants/questions";

/**
 * Database-persisted participant state
 * Only contains fields that should be stored in the database
 */
export interface ParticipantSubmissionState {
  hasSubmitted: boolean;
}

/**
 * Composite participant status used in frontend
 * Combines database-persisted state with ephemeral real-time state
 */
export interface ParticipantStatus extends ParticipantSubmissionState {
  currentSelection?: string;  // Ephemeral - managed by websocket broadcasts
  questionId?: string;         // Ephemeral - tracks current question
  timestamp?: Date;            // Ephemeral - prevents stale broadcasts
}

export interface SurveyState {
  currentQuestionIndex: number;
  participantStatus: Record<string, ParticipantStatus>;
  status: string;
  partnerId?: string;
}

export interface SurveySubmitResponse {
  success: boolean;
  participantStatus?: Record<string, ParticipantStatus>;
  error?: string;
}

export interface SurveyActions {
  updateSelection: (selection: string) => Promise<boolean>;
  submitResponse: (questionId: string, selectedOption: string) => Promise<SurveySubmitResponse>;
  clearSubmitError: () => void;
  clearSelections: () => void;
}

export interface SurveyContextType {
  surveyState: SurveyState;
  actions: SurveyActions;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  isConnected: boolean;
  submitError: string | null;
  user: {
    email: string;
    role: UserRole;
  };
  partner: {
    id: string;
    status?: ParticipantStatus;
  };
  currentQuestion: Question | null;
}

export interface SurveyBroadcastPayload {
  userEmail: string;
  selection: string;
  questionId: string;
  timestamp: string;
}

export interface ChoiceRefs {
  [key: string]: HTMLElement | null;
}

export interface AvatarPosition {
  top: number;
  left: number;
  opacity: number;
}

export interface QuestionProps {
  question: Question;
  onSelectionChange?: (optionId: string) => void;
  onSubmit?: (optionId: string) => void;
  disabled?: boolean;
  selectedOption?: string;
}
