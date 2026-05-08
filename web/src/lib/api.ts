import ky, { HTTPError } from 'ky';
import { ApiRouteBody } from '#types/shared/api-route';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
const apiClient = ky.create({
  prefix: BASE_URL,
  retry: 0,
  timeout: false,
  credentials: 'include',
});

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    return await apiClient(path.replace(/^\/+/, ''), {
      ...options,
      headers,
      credentials: 'include',
    }).json<T>();
  } catch (error) {
    if (error instanceof HTTPError) {
      const errorBody = await error.response.text().catch(() => '');
      throw new Error(
        errorBody || `API error: ${error.response.status} ${error.response.statusText}`,
      );
    }

    throw error;
  }
}

export type ApiQueryOptions = Omit<RequestInit, 'body'> & {
  params?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, unknown> | string;
};

export const queryApi = <T>(route: ApiRouteBody, options?: ApiQueryOptions): Promise<T> => {
  const queryOptions = { ...options, method: route.method };
  delete queryOptions.params;
  if (typeof options?.body !== 'undefined' && options.body !== 'string') {
    queryOptions.body = JSON.stringify(options.body);
  }
  return api(route.url, queryOptions as ApiQueryOptions & { body?: string });
};
