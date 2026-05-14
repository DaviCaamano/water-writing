import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiRoutes } from '#types/shared/api-route';
import { DocumentResponse } from '#types/shared/response';
import { queryApi } from '~lib/api';
import { queryKeys } from '~types/lib/tanstack-query/query-keys';

export const useDocumentQuery = (
  documentId: string | null | undefined,
): UseQueryResult<DocumentResponse> =>
  useQuery({
    queryKey: documentId ? queryKeys.documents.detail(documentId) : queryKeys.documents.all,
    queryFn: () => queryApi<DocumentResponse>(apiRoutes.story.fetchDocument(documentId!)),
    enabled: !!documentId,
  });
