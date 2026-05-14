import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRoutes } from '#types/shared/api-route';
import { StoryResponse, CannonResponse } from '#types/shared/response';
import { queryApi } from '~lib/api';
import { queryKeys } from '~types/lib/tanstack-query/query-keys';

interface UpsertCannonVariables {
  cannonId?: string;
  title: string;
}

interface UpsertStoryVariables {
  storyId?: string;
  cannonId?: string;
  title: string;
}

interface UpsertDocumentVariables {
  documentId?: string | undefined;
  storyId?: string | undefined;
  title: string;
  body?: string | undefined;
}

const invalidateAll = (queryClient: ReturnType<typeof useQueryClient>) => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.user.session });
  void queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
};

export const useUpsertCannonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpsertCannonVariables) =>
      queryApi<CannonResponse | null>(apiRoutes.story.upsertCannon(), { body: { ...vars } }),
    onSuccess: () => invalidateAll(queryClient),
  });
};

export const useDeleteCannonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cannonId: string) =>
      queryApi<{ status: 'ok' }>(apiRoutes.story.deleteCannon(cannonId)),
    onSuccess: () => invalidateAll(queryClient),
  });
};

export const useUpsertStoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpsertStoryVariables) =>
      queryApi<StoryResponse>(apiRoutes.story.upsertStory(), { body: { ...vars } }),
    onSuccess: () => invalidateAll(queryClient),
  });
};

export const useDeleteStoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: string) =>
      queryApi<{ status: 'ok' }>(apiRoutes.story.deleteStory(storyId)),
    onSuccess: () => invalidateAll(queryClient),
  });
};

export const useUpsertDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpsertDocumentVariables) =>
      queryApi<CannonResponse | null>(apiRoutes.story.upsertDocument(), { body: { ...vars } }),
    onSuccess: () => invalidateAll(queryClient),
  });
};

export const useDeleteDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      queryApi<{ status: 'ok' }>(apiRoutes.story.deleteDocument(documentId)),
    onSuccess: () => invalidateAll(queryClient),
  });
};
