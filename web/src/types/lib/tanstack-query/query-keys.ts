export const queryKeys = {
  user: {
    session: ['user', 'session'] as const,
  },
  worlds: {
    all: ['worlds'] as const,
    legacy: (userId: string) => ['worlds', 'legacy', userId] as const,
    detail: (worldId: string) => ['worlds', 'detail', worldId] as const,
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
