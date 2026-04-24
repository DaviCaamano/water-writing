import ky, { HTTPError } from 'ky';
import { ApiRoute } from '#types/shared/api-route';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
const apiClient = ky.create({
  prefix: BASE_URL,
  retry: 0,
  timeout: false,
});

export async function api<T>(
  path: string,
  options: RequestInit = {},
  includeAuth = true,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (includeAuth) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    return await apiClient(path.replace(/^\/+/, ''), {
      ...options,
      headers,
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

export const queryApi = (route: ApiRoute, options: ApiQueryOptions) => {
  const url = typeof route.url === 'function' ? route.url({ ...options.params }) : route.url;
  const queryOptions = { ...options, method: route.method };
  delete queryOptions.params;
  if (typeof options.body !== 'undefined' && options.body !== 'string') {
    queryOptions.body = JSON.stringify(options.body);
  }
  return api(url, queryOptions as ApiQueryOptions & { body?: string }, route.includeAuth);
};
