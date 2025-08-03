import { UserRole, Question } from "@/lib/constants/questions";

export interface ParticipantStatus {
  currentSelection?: string; // Use by frontend to track current selection via boardcast, not stored in DB
  hasSubmitted: boolean;
}

export interface SurveyState {
  currentQuestionIndex: number;
  participantStatus: Record<string, ParticipantStatus>;
  status: string;
  partnerId?: string;
}

export interface SurveyActions {
  updateSelection: (selection: string) => Promise<boolean>;
  submitResponse: (questionId: string, selectedOption: string) => Promise<any>;
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
  currentQuestion: Question;
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
