import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiRoutes } from '#types/shared/api-route';
import { DocumentResponse, StoryResponse, WorldResponse } from '#types/shared/response';
import { queryApi } from '~lib/api';
import { queryKeys } from '~types/lib/tanstack-query/query-keys';

export function useLegacyQuery(userId: string | null | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.worlds.legacy(userId) : queryKeys.worlds.all,
    queryFn: () => queryApi<WorldResponse[]>(apiRoutes.story.fetchLegacy()),
    enabled: !!userId,
  });
}

export function useWorldQuery(worldId: string | null | undefined) {
  return useQuery({
    queryKey: worldId ? queryKeys.worlds.detail(worldId) : queryKeys.worlds.all,
    queryFn: () => queryApi<WorldResponse>(apiRoutes.story.fetchWorld(worldId!)),
    enabled: !!worldId,
  });
}

export function useStoryQuery(storyId: string | null | undefined) {
  return useQuery({
    queryKey: storyId ? queryKeys.stories.detail(storyId) : queryKeys.stories.all,
    queryFn: () => queryApi<StoryResponse>(apiRoutes.story.fetchStory(storyId!)),
    enabled: !!storyId,
  });
}

export function useDocumentQuery(
  documentId: string | null | undefined,
): UseQueryResult<DocumentResponse> {
  return useQuery({
    queryKey: documentId ? queryKeys.documents.detail(documentId) : queryKeys.documents.all,
    queryFn: () => queryApi<DocumentResponse>(apiRoutes.story.fetchDocument(documentId!)),
    enabled: !!documentId,
  });
}
