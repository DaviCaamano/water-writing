import { NavigationState } from '~types/state/navigation-state';
import { ViewMode } from '~types/story';

export const createInitialNavigationState = (): NavigationState => ({
  currentView: ViewMode.legacy,
  currentWorldId: null,
  currentStoryId: null,
  currentDocumentId: null,
  selectedDocumentId: null,
});
