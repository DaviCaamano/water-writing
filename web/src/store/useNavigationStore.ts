import { useMemo } from 'react';
import { useStore } from '@tanstack/react-store';
import { NavigationState } from '~types/state/navigation-state';
import {
  NavigationActions,
  navigationActions,
  navigationStore,
} from '~utils/store/useNavigationSore/navigation-actions';

type NavigationStore = NavigationState & NavigationActions;

export const useNavigationStore = (): NavigationStore => {
  const state = useStore(navigationStore, (currentState) => currentState);

  return useMemo(
    () => ({
      ...state,
      ...navigationActions,
    }),
    [state],
  );
};
