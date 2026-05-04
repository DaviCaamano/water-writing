import { ViewMode } from '~types/story';

export interface NavigationState {
  currentView: ViewMode;
  currentCannonId: string | null;
  currentStoryId: string | null;
  currentDocumentId: string | null;
  selectedDocumentId: string | null;
}
