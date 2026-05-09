import { createRoute } from '#utils/createRoute';

export type ApiRouteBody = {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  includeAuth?: boolean;
};

// A dictionary for all API routes to be deployed by the front end.
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
  fetchDocument = createRoute({
    url: '/story/document/:documentId',
    method: 'GET',
    includeAuth: true,
  });
  fetchStory = createRoute({
    url: '/story/story/:storyId',
    method: 'GET',
    includeAuth: true,
  });
  fetchStories = createRoute({
    url: '/story/stories',
    method: 'GET',
    includeAuth: true,
  });
  fetchCannon = createRoute({
    url: '/story/cannon/:cannonId',
    method: 'GET',
    includeAuth: true,
  });
  fetchLegacy = createRoute({
    url: '/story/legacy',
    method: 'GET',
    includeAuth: true,
  });
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
  upsertCannon = createRoute({
    url: '/story/cannon',
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
  deleteCannon = createRoute({
    url: '/story/cannon/:cannonId',
    method: 'DELETE',
    includeAuth: true,
  });
  deleteStory = createRoute({
    url: '/story/story/:storyId',
    method: 'DELETE',
    includeAuth: true,
  });
  deleteDocument = createRoute({
    url: '/story/document/:documentId',
    method: 'DELETE',
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
  session = createRoute({
    url: '/user/session',
    method: 'GET',
    includeAuth: true,
  });
  create = createRoute({
    url: '/user/create',
    method: 'POST',
  });
  deleteAccount = createRoute({
    url: '/user/deleteme',
    method: 'DELETE',
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
