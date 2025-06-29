export interface ParticipantStatus {
  isOnline: boolean;
  currentSelection?: string;
  hasSubmitted: boolean;
  lastSeen: Date;
}
