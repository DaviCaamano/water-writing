import { useMemo } from 'react';
import { Store, useStore } from '@tanstack/react-store';
import { useRouter, usePathname } from 'next/navigation';
import { NavigationState } from '~types/state/navigation-state';
import { usePageTransition } from '~context/PageTransitionContext';

export const createInitialNavigationState = (): NavigationState => ({
  currentCannonId: null,
  currentStoryId: null,
  currentDocumentId: null,
  selectedDocumentId: null,
});

export interface NavigationActions {
  navigateUp: () => void;
  navigateToEditor: (documentId: string, storyId: string, cannonId: string) => void;
  navigateToStory: (storyId: string, cannonId: string) => void;
  navigateToCannon: (cannonId: string) => void;
  navigateToLegacy: () => void;
  selectDocument: (id: string | null) => void;
  setCurrentDocument: (documentId: string | null) => void;
}

export const navigationStore = new Store<NavigationState>(createInitialNavigationState());

type NavigationStore = NavigationState & NavigationActions;

export const useNavigationStore = (): NavigationStore => {
  const state = useStore(navigationStore, (s) => s);
  const router = useRouter();
  const pathname = usePathname();
  const { navigate: transitionNavigate } = usePageTransition();

  return useMemo(
    () => ({
      ...state,

      navigateToLegacy: () => {
        navigationStore.setState((s) => ({ ...s, selectedDocumentId: null }));
        router.push('/');
      },

      navigateToCannon: (cannonId: string) => {
        navigationStore.setState((s) => ({
          ...s,
          currentCannonId: cannonId,
          currentStoryId: null,
          selectedDocumentId: null,
        }));
        router.push(`/world/${cannonId}`);
      },

      navigateToStory: (storyId: string, cannonId: string) => {
        navigationStore.setState((s) => ({
          ...s,
          currentCannonId: cannonId,
          currentStoryId: storyId,
          selectedDocumentId: null,
        }));
        router.push(`/story/${storyId}`);
      },

      navigateToEditor: (documentId: string, storyId: string, cannonId: string) => {
        navigationStore.setState((s) => ({
          ...s,
          currentCannonId: cannonId,
          currentStoryId: storyId,
          currentDocumentId: documentId,
          selectedDocumentId: documentId,
        }));
        transitionNavigate(`/editor/${documentId}`);
      },

      navigateUp: () => {
        const { currentStoryId, currentCannonId } = navigationStore.state;
        if (pathname.startsWith('/editor')) {
          transitionNavigate(currentStoryId ? `/story/${currentStoryId}` : '/');
        } else if (pathname.startsWith('/story')) {
          router.push(currentCannonId ? `/world/${currentCannonId}` : '/');
        } else if (pathname.startsWith('/world')) {
          router.push('/');
        }
      },

      selectDocument: (id: string | null) => {
        navigationStore.setState((s) => ({ ...s, selectedDocumentId: id }));
      },

      setCurrentDocument: (documentId: string | null) => {
        navigationStore.setState((s) => ({ ...s, currentDocumentId: documentId }));
      },
    }),
    [state, router, pathname, transitionNavigate],
  );
};
