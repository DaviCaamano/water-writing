export type RouteParameterParser = (
  vars: Record<string, string | number | boolean | undefined>,
) => string;
export const parseRouteParameter = (route: string): RouteParameterParser => {
  if (!route.includes(':')) return () => route;
  return (vars: Record<string, string | number | boolean | undefined>) => {
    let routeString = route;
    for (const [key, value] of Object.entries(vars)) {
      if (typeof value === 'undefined') continue;
      routeString = routeString.replace(`:${key}`, value.toString());
    }
    return routeString;
  };
};

export type ApiRoute =
  | {
      url: RouteParameterParser;
      method: 'GET';
      includeAuth?: boolean;
    }
  | {
      url: string;
      method: 'POST' | 'PUT' | 'DELETE';
      includeAuth?: boolean;
    };

export type ApiRoutesRegistry = Record<string, Record<string, ApiRoute>>;
export const apiRoutes: ApiRoutesRegistry = {
  billing: {
    history: {
      url: parseRouteParameter('/billing/history/:userId'),
      method: 'GET',
    },
  },
  story: {
    upsertDocument: {
      url: '/story/document',
      method: 'POST',
      includeAuth: true,
    },
    upsertStory: {
      url: '/story/story',
      method: 'POST',
      includeAuth: true,
    },
    upsertWorld: {
      url: '/story/world',
      method: 'POST',
      includeAuth: true,
    },
    waterWrite: {
      url: '/story/water-write',
      method: 'POST',
      includeAuth: true,
    },
    upsertGenre: {
      url: '/story/genre',
      method: 'POST',
      includeAuth: true,
    },
  },
  user: {
    update: {
      url: '/user',
      method: 'POST',
      includeAuth: true,
    },
    login: {
      url: '/user/login',
      method: 'POST',
    },
    logout: {
      url: '/user/logout',
      method: 'POST',
    },
    create: {
      url: '/user/create',
      method: 'POST',
    },
    deleteAccount: {
      url: '/user/deleteme',
      method: 'POST',
      includeAuth: true,
    },
    subscribe: {
      url: '/user/subscribe',
      method: 'POST',
      includeAuth: true,
    },
  },
  docs: {
    docs: {
      url: parseRouteParameter('/docs'),
      method: 'GET',
    },
    docsJson: {
      url: parseRouteParameter('/docs/api-space.json'),
      method: 'GET',
    },
  },
  health: {
    ping: {
      url: parseRouteParameter('/health'),
      method: 'GET',
    },
  },
};
