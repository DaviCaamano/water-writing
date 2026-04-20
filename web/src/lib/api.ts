const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

export async function api<T>(
  path: string,
  options: RequestInit = {},
  includeAuth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (includeAuth) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(errorBody || `API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
