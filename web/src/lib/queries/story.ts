import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiRoutes } from '#types/shared/api-route';
import { DocumentResponse, StoryResponse, CannonResponse } from '#types/shared/response';
import { queryApi } from '~lib/api';
import { queryKeys } from '~types/lib/tanstack-query/query-keys';

export const useLegacyQuery = (userId: string | null | undefined) =>
  useQuery({
    queryKey: userId ? queryKeys.cannons.legacy(userId) : queryKeys.cannons.all,
    queryFn: () => queryApi<CannonResponse[]>(apiRoutes.story.fetchLegacy()),
    enabled: !!userId,
  });

export const useCannonQuery = (cannonId: string | null | undefined) =>
  useQuery({
    queryKey: cannonId ? queryKeys.cannons.detail(cannonId) : queryKeys.cannons.all,
    queryFn: () => queryApi<CannonResponse>(apiRoutes.story.fetchCannon(cannonId!)),
    enabled: !!cannonId,
  });

export const useStoryQuery = (storyId: string | null | undefined) =>
  useQuery({
    queryKey: storyId ? queryKeys.stories.detail(storyId) : queryKeys.stories.all,
    queryFn: () => queryApi<StoryResponse>(apiRoutes.story.fetchStory(storyId!)),
    enabled: !!storyId,
  });

export const useDocumentQuery = (
  documentId: string | null | undefined,
): UseQueryResult<DocumentResponse> =>
  useQuery({
    queryKey: documentId ? queryKeys.documents.detail(documentId) : queryKeys.documents.all,
    queryFn: () => queryApi<DocumentResponse>(apiRoutes.story.fetchDocument(documentId!)),
    enabled: !!documentId,
  });
