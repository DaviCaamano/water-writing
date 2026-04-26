import { ViewMode } from '~types/story';

export interface NavigationState {
  currentView: ViewMode;
  currentWorldId: string | null;
  currentStoryId: string | null;
  currentDocumentId: string | null;
  selectedDocumentId: string | null;
}
