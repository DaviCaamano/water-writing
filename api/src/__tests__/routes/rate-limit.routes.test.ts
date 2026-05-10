import request from 'supertest';

const allow = (_req: unknown, _res: unknown, next: () => void) => next();
const deny =
  (error: string) =>
  (_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) =>
    res.status(429).json({ error });

const buildUserApp = async (rateLimiters: Partial<Record<string, unknown>>, withAuth = false) => {
  jest.resetModules();
  jest.doMock('#config/rate-limiters', () => ({
    loginLimiter: allow,
    createAccountLimiter: allow,
    subscribeLimiter: allow,
    generalLimiter: allow,
    aiLimiter: allow,
    ...rateLimiters,
  }));
  jest.doMock('#services/user/login.service', () => ({
    login: jest.fn(),
    logout: jest.fn(),
    getSession: jest.fn(),
  }));
  jest.doMock('#services/user/user.service', () => ({
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    subscribe: jest.fn(),
  }));

  if (withAuth) {
    jest.doMock('#middleware/auth', () => ({
      authMiddleware: (
        req: { userId?: string; token?: string },
        _res: unknown,
        next: () => void,
      ) => {
        req.userId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        req.token = 'test-token';
        next();
      },
    }));
  }

  const express = (await import('express')).default;
  const userRoutes = (await import('#routes/user.routes')).default;
  const loginService = await import('#services/user/login.service');
  const userService = await import('#services/user/user.service');

  const app = express();
  app.use(express.json());
  app.use('/user', userRoutes);

  return { app, loginService, userService };
};

const buildStoryApp = async (rateLimiters: Partial<Record<string, unknown>>, withAuth = false) => {
  jest.resetModules();
  jest.doMock('#config/rate-limiters', () => ({
    loginLimiter: allow,
    createAccountLimiter: allow,
    subscribeLimiter: allow,
    generalLimiter: allow,
    aiLimiter: allow,
    ...rateLimiters,
  }));
  jest.doMock('#services/story/story.service', () => ({
    deleteStory: jest.fn(),
    fetchUserStories: jest.fn(),
    fetchUserStoryWithDocuments: jest.fn(),
    upsertStory: jest.fn(),
  }));
  jest.doMock('#services/story/document.service', () => ({
    deleteDocument: jest.fn(),
    fetchUserDocument: jest.fn(),
    upsertDocument: jest.fn(),
  }));
  jest.doMock('#services/story/cannon.service', () => ({
    deleteCannon: jest.fn(),
    fetchLegacy: jest.fn(),
    fetchCannon: jest.fn(),
    upsertCannon: jest.fn(),
  }));
  jest.doMock('#services/story/editor.service', () => ({
    waterWrite: jest.fn(),
  }));

  if (withAuth) {
    jest.doMock('#middleware/auth', () => ({
      authMiddleware: (
        req: { userId?: string; token?: string },
        _res: unknown,
        next: () => void,
      ) => {
        req.userId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
        req.token = 'test-token';
        next();
      },
    }));
  }

  const express = (await import('express')).default;
  const storyRoutes = (await import('#routes/story.routes')).default;
  const storyService = await import('#services/story/story.service');
  const editorService = await import('#services/story/editor.service');

  const app = express();
  app.use(express.json());
  app.use('/story', storyRoutes);

  return { app, storyService, editorService };
};

describe('route limiters', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('short-circuits /user/login when the login limiter rejects the request', async () => {
    const { app, loginService } = await buildUserApp({
      loginLimiter: deny('Too many login attempts, please try again later'),
    });

    const res = await request(app).post('/user/login').send({
      email: 'jane@example.com',
      password: 'P@ssword123!',
    });

    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Too many login attempts, please try again later');
    expect(loginService.login).not.toHaveBeenCalled();
  });

  it('short-circuits /user/create when the create-account limiter rejects the request', async () => {
    const { app, userService } = await buildUserApp({
      createAccountLimiter: deny('Too many account creation attempts, please try again later'),
    });

    const res = await request(app).post('/user/create').send({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'P@ssword123!',
    });

    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Too many account creation attempts, please try again later');
    expect(userService.createUser).not.toHaveBeenCalled();
  });

  it('short-circuits /user/subscribe when the subscribe limiter rejects the request', async () => {
    const { app, userService } = await buildUserApp(
      {
        subscribeLimiter: deny('Too many subscription attempts, please try again later'),
      },
      true,
    );

    const res = await request(app).post('/user/subscribe').send({
      planType: 'pro-plan',
      isYearPlan: false,
      paymentMethodId: 'pm_test',
    });

    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Too many subscription attempts, please try again later');
    expect(userService.subscribe).not.toHaveBeenCalled();
  });

  it('short-circuits /story/stories when the general limiter rejects the request', async () => {
    const { app, storyService } = await buildStoryApp(
      {
        generalLimiter: deny('Too many request attempts, please try again later'),
      },
      true,
    );

    const res = await request(app).get('/story/stories');

    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Too many request attempts, please try again later');
    expect(storyService.fetchUserStories).not.toHaveBeenCalled();
  });

  it('short-circuits /story/water-write when the AI limiter rejects the request', async () => {
    const { app, editorService } = await buildStoryApp(
      {
        aiLimiter: deny('Too many AI generation attempts, please try again later'),
      },
      true,
    );

    const res = await request(app)
      .post('/story/water-write')
      .send({
        documentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        selection: { start: 0, end: 5 },
        prompt: 'rewrite this',
      });

    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Too many AI generation attempts, please try again later');
    expect(editorService.waterWrite).not.toHaveBeenCalled();
  });
});
