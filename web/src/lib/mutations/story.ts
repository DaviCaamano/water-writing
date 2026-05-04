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
  documentId?: string;
  storyId?: string;
  title: string;
  body?: string;
}

export function useUpsertCannonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpsertCannonVariables) =>
      queryApi<CannonResponse | null>(apiRoutes.story.upsertCannon(), { body: { ...vars } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cannons.all });
    },
  });
}

export function useDeleteCannonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cannonId: string) =>
      queryApi<{ status: 'ok' }>(apiRoutes.story.deleteCannon(cannonId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cannons.all });
    },
  });
}

export function useUpsertStoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpsertStoryVariables) =>
      queryApi<StoryResponse>(apiRoutes.story.upsertStory(), { body: { ...vars } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cannons.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
  });
}

export function useDeleteStoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: string) =>
      queryApi<{ status: 'ok' }>(apiRoutes.story.deleteStory(storyId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cannons.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
  });
}

export function useUpsertDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpsertDocumentVariables) =>
      queryApi<CannonResponse | null>(apiRoutes.story.upsertDocument(), { body: { ...vars } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cannons.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });
}

export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      queryApi<{ status: 'ok' }>(apiRoutes.story.deleteDocument(documentId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cannons.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });
}
