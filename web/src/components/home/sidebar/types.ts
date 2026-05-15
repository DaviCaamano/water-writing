import { CannonResponse, StoryResponse } from '#types/shared/response';

export const DrillLevel = {
  cannons: 'cannons' as const,
  stories: 'stories' as const,
  documents: 'documents' as const,
} as const;
type DrillLevel = Enum<typeof DrillLevel>;

export interface DrillState {
  level: DrillLevel;
  cannon?: CannonResponse;
  story?: StoryResponse;
}
