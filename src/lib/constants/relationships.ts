import { pgEnum } from "drizzle-orm/pg-core";
// Shared relationship type constants for frontend and backend sync
export enum RelationshipType {
  COUPLE = "couple",
  SITUATIONSHIP = "situationship",
  BESTIES = "besties",
  JUST_FRIENDS = "just_friends",
}

export const relationshipTypeEnum = pgEnum(
  "relationship_type",
  Object.values(RelationshipType) as [RelationshipType, ...RelationshipType[]]
);

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  [RelationshipType.COUPLE]: "Couple",
  [RelationshipType.SITUATIONSHIP]: "Situationship",
  [RelationshipType.BESTIES]: "Besties",
  [RelationshipType.JUST_FRIENDS]: "Just Friends",
};

// Utility functions
export const getAllRelationshipTypes = (): RelationshipType[] => {
  return Object.values(RelationshipType);
};

export const getRelationshipLabel = (type: RelationshipType): string => {
  return RELATIONSHIP_LABELS[type];
};
