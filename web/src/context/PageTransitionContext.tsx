'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export const TransitionPhase = {
  idle: 'idle',
  covering: 'covering',
  revealing: 'revealing',
} as const;
export type TransitionPhase = Enum<typeof TransitionPhase>;

interface PageTransitionContextValue {
  phase: TransitionPhase;
  navigate: (href: string) => void;
  onCoverComplete: () => void;
  onRevealComplete: () => void;
}

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<TransitionPhase>(TransitionPhase.idle);
  const pendingHref = useRef<string | null>(null);

  const navigate = useCallback(
    (href: string) => {
      if (phase !== TransitionPhase.idle) return;
      pendingHref.current = href;
      router.prefetch(href);
      setPhase(TransitionPhase.covering);
    },
    [phase, router],
  );

  const onCoverComplete = useCallback(() => {
    if (pendingHref.current) {
      router.push(pendingHref.current);
      pendingHref.current = null;
    }
    setPhase(TransitionPhase.revealing);
  }, [router]);

  const onRevealComplete = useCallback(() => {
    setPhase(TransitionPhase.idle);
  }, []);

  return (
    <PageTransitionContext.Provider value={{ phase, navigate, onCoverComplete, onRevealComplete }}>
      {children}
    </PageTransitionContext.Provider>
  );
}

export const usePageTransition = () => {
  const ctx = useContext(PageTransitionContext);
  if (!ctx) throw new Error('usePageTransition must be used within PageTransitionProvider');
  return ctx;
};
