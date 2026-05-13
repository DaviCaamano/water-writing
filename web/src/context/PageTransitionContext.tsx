'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Phase = 'idle' | 'covering' | 'revealing';

interface PageTransitionContextValue {
  phase: Phase;
  navigate: (href: string) => void;
  onCoverComplete: () => void;
  onRevealComplete: () => void;
}

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const pendingHref = useRef<string | null>(null);

  const navigate = useCallback(
    (href: string) => {
      if (phase !== 'idle') return;
      pendingHref.current = href;
      router.prefetch(href);
      setPhase('covering');
    },
    [phase, router],
  );

  const onCoverComplete = useCallback(() => {
    if (pendingHref.current) {
      router.push(pendingHref.current);
      pendingHref.current = null;
    }
    setPhase('revealing');
  }, [router]);

  const onRevealComplete = useCallback(() => {
    setPhase('idle');
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
