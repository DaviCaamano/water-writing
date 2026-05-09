import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRoutes } from '#types/shared/api-route';
import { StoryResponse, CannonResponse, DocumentResponse } from '#types/shared/response';
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

export const useUpsertCannonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpsertCannonVariables) =>
      queryApi<CannonResponse | null>(apiRoutes.story.upsertCannon(), { body: { ...vars } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cannons.all });
    },
  });
};

export const useDeleteCannonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cannonId: string) =>
      queryApi<{ status: 'ok' }>(apiRoutes.story.deleteCannon(cannonId)),
    onMutate: async (cannonId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cannons.all });
      const snapshot = queryClient.getQueriesData<CannonResponse[]>({
        queryKey: queryKeys.cannons.all,
      });
      queryClient.setQueriesData<CannonResponse[]>({ queryKey: queryKeys.cannons.all }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((c) => c.cannonId !== cannonId);
      });
      return { snapshot };
    },
    onError: (_, __, context) => {
      if (!context?.snapshot) return;
      for (const [key, data] of context.snapshot) queryClient.setQueryData(key, data);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cannons.all });
    },
  });
};

export const useUpsertStoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: UpsertStoryVariables) =>
      queryApi<StoryResponse>(apiRoutes.story.upsertStory(), { body: { ...vars } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cannons.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
  });
};

export const useDeleteStoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: string) =>
      queryApi<{ status: 'ok' }>(apiRoutes.story.deleteStory(storyId)),
    onMutate: async (storyId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cannons.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.stories.all });
      const cannonSnapshot = queryClient.getQueriesData<CannonResponse | CannonResponse[]>({
        queryKey: queryKeys.cannons.all,
      });
      const storySnapshot = queryClient.getQueriesData<StoryResponse>({
        queryKey: queryKeys.stories.all,
      });

      queryClient.setQueriesData<CannonResponse[]>({ queryKey: queryKeys.cannons.all }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((c) => ({ ...c, stories: c.stories.filter((s) => s.storyId !== storyId) }));
      });
      queryClient.setQueriesData<CannonResponse>({ queryKey: queryKeys.cannons.all }, (old) => {
        if (!old || Array.isArray(old)) return old;
        return { ...old, stories: old.stories.filter((s) => s.storyId !== storyId) };
      });

      return { cannonSnapshot, storySnapshot };
    },
    onError: (_, __, context) => {
      if (context?.cannonSnapshot) {
        for (const [key, data] of context.cannonSnapshot) queryClient.setQueryData(key, data);
      }
      if (context?.storySnapshot) {
        for (const [key, data] of context.storySnapshot) queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cannons.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
    },
  });
};

export const useUpsertDocumentMutation = () => {
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
};

export const useDeleteDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      queryApi<{ status: 'ok' }>(apiRoutes.story.deleteDocument(documentId)),
    onMutate: async (documentId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cannons.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.stories.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.documents.all });
      const cannonSnapshot = queryClient.getQueriesData<CannonResponse | CannonResponse[]>({
        queryKey: queryKeys.cannons.all,
      });
      const storySnapshot = queryClient.getQueriesData<StoryResponse>({
        queryKey: queryKeys.stories.all,
      });

      const filterDoc = (docs: DocumentResponse[]) =>
        docs.filter((d) => d.documentId !== documentId);

      queryClient.setQueriesData<CannonResponse[]>({ queryKey: queryKeys.cannons.all }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((c) => ({
          ...c,
          stories: c.stories.map((s) => ({ ...s, documents: filterDoc(s.documents) })),
        }));
      });
      queryClient.setQueriesData<CannonResponse>({ queryKey: queryKeys.cannons.all }, (old) => {
        if (!old || Array.isArray(old)) return old;
        return {
          ...old,
          stories: old.stories.map((s) => ({ ...s, documents: filterDoc(s.documents) })),
        };
      });
      queryClient.setQueriesData<StoryResponse>({ queryKey: queryKeys.stories.all }, (old) => {
        if (!old || Array.isArray(old)) return old;
        return { ...old, documents: filterDoc(old.documents) };
      });

      return { cannonSnapshot, storySnapshot };
    },
    onError: (_, __, context) => {
      if (context?.cannonSnapshot) {
        for (const [key, data] of context.cannonSnapshot) queryClient.setQueryData(key, data);
      }
      if (context?.storySnapshot) {
        for (const [key, data] of context.storySnapshot) queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cannons.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stories.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });
};
