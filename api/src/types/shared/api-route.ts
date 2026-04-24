export type ApiRouteBody = {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  includeAuth?: boolean;
};

// Do not expose any routes in the following route files to the front end
// stripe.routes.ts
export class ApiRoute {
  billing = new BillingApiRoute();
  story = new StoryApiRoute();
  user = new UserApiRoute();
  docs = new DocApiRoute();
  health = new HealthApiRoute();
}

class BillingApiRoute {
  history = createRoute({
    url: '/billing/history/:userId',
    method: 'GET',
  });
}

class StoryApiRoute {
  upsertDocument = createRoute({
    url: '/story/document',
    method: 'POST',
    includeAuth: true,
  });
  upsertStory = createRoute({
    url: '/story/story',
    method: 'POST',
    includeAuth: true,
  });
  upsertWorld = createRoute({
    url: '/story/world',
    method: 'POST',
    includeAuth: true,
  });
  waterWrite = createRoute({
    url: '/story/water-write',
    method: 'POST',
    includeAuth: true,
  });
  upsertGenre = createRoute({
    url: '/story/genre',
    method: 'POST',
    includeAuth: true,
  });
}

class UserApiRoute {
  update = createRoute({
    url: '/user',
    method: 'POST',
    includeAuth: true,
  });
  login = createRoute({
    url: '/user/login',
    method: 'POST',
  });
  logout = createRoute({
    url: '/user/logout',
    method: 'POST',
  });
  create = createRoute({
    url: '/user/create',
    method: 'POST',
  });
  deleteAccount = createRoute({
    url: '/user/deleteme',
    method: 'POST',
    includeAuth: true,
  });
  subscribe = createRoute({
    url: '/user/subscribe',
    method: 'POST',
    includeAuth: true,
  });
}

class DocApiRoute {
  docs = createRoute({
    url: '/docs',
    method: 'GET',
  });
  docsJson = createRoute({
    url: '/docs/api-space.json',
    method: 'GET',
  });
}

class HealthApiRoute {
  ping = createRoute({
    url: '/health',
    method: 'GET',
  });
}

export const apiRoutes = new ApiRoute();

export type ApiRouteHandler = (...args: (string | number | boolean | undefined)[]) => ApiRouteBody;

export function fillRouteParams(
  route: string,
  ...values: Array<string | number | boolean | undefined>
): string {
  let index = 0;

  return route.replace(/:[^/]+/g, () => {
    const value = values[index++];
    if (value === undefined) return '';
    return String(value);
  });
}
export const createRoute = (route: ApiRouteBody): ApiRouteHandler => {
  if (!route.url.includes(':')) return () => route;
  return (...values: (string | number | boolean | undefined)[]) => ({
    ...route,
    url: fillRouteParams(route.url, ...values),
  });
};
