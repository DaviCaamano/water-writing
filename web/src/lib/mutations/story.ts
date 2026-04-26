import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRoutes } from '#types/shared/api-route';
import { StoryResponse, WorldResponse } from '#types/shared/response';
import { queryApi } from '~lib/api';
import { queryKeys } from '~types/lib/tanstack-query/query-keys';

interface UpsertWorldVariables {
  worldId?: string;
  title: string;
}

interface UpsertStoryVariables {
  storyId?: string;
  worldId?: string;
  title: string;
}

interface UpsertDocumentVariables {
  documentId?: string;
  storyId?: string;
  title: string;
  body?: string;
}

export function useUpsertWorldMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpsertWorldVariables) =>
      queryApi<WorldResponse | null>(apiRoutes.story.upsertWorld(), { body: { ...vars } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all });
    },
  });
}

export function useDeleteWorldMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (worldId: string) =>
      queryApi<{ status: 'ok' }>(apiRoutes.story.deleteWorld(worldId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all });
    },
  });
}

export function useUpsertStoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpsertStoryVariables) =>
      queryApi<StoryResponse>(apiRoutes.story.upsertStory(), { body: { ...vars } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all });
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
  });
}

export function useUpsertDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpsertDocumentVariables) =>
      queryApi<WorldResponse | null>(apiRoutes.story.upsertDocument(), { body: { ...vars } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all });
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });
}
