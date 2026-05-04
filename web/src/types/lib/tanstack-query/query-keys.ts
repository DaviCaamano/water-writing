export const queryKeys = {
  user: {
    session: ['user', 'session'] as const,
  },
  cannons: {
    all: ['cannons'] as const,
    legacy: (userId: string) => ['cannons', 'legacy', userId] as const,
    detail: (cannonId: string) => ['cannons', 'detail', cannonId] as const,
  },
  stories: {
    all: ['stories'] as const,
    list: (userId: string) => ['stories', 'list', userId] as const,
    detail: (storyId: string) => ['stories', 'detail', storyId] as const,
  },
  documents: {
    all: ['documents'] as const,
    detail: (documentId: string) => ['documents', 'detail', documentId] as const,
  },
  billing: {
    history: (userId: string) => ['billing', 'history', userId] as const,
  },
};
