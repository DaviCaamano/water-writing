import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { env } from '#config/env';
import logger from '#config/logger';
import pool from '#config/database';
import { AppError } from '#constants/error/custom-errors';
import stripeRoutes from '#routes/stripe.routes';
import userRoutes from '#routes/user.routes';
import storyRoutes from '#routes/story.routes';
import docsRoutes from '#routes/docs.routes';
import billingRoutes from '#routes/billing.routes';

const app = express();

// Security & parsing middleware
const HSTS_MAX_AGE_SECONDS = 31_536_000;
const CORS_MAX_AGE_SECONDS = 3_600;

app.use(
  helmet({
    hsts: {
      maxAge: HSTS_MAX_AGE_SECONDS,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
  }),
);

const allowedOrigins = env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) ?? [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: CORS_MAX_AGE_SECONDS,
  }),
);

// Stripe webhook verification requires the raw request body before JSON parsing.
app.use('/stripe', stripeRoutes);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// HTTP request logging (skip in tests to keep output clean)
if (env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const existing = req.headers['x-request-id'];
        if (typeof existing === 'string' && existing) return existing;
        const id = randomUUID();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      autoLogging: {
        ignore: (req) => req.url?.startsWith('/docs') ?? false,
      },
    }),
  );
}

// Routes
app.use('/billing', billingRoutes);
app.use('/docs', docsRoutes);
app.use('/story', storyRoutes);
app.use('/user', userRoutes);

// Health check — probes the database so load balancers get accurate signal
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'error', error: 'Database unavailable' });
  }
});

// Global error handler
// Express 5 natively forwards async errors to this handler — no monkey-patching needed.
app.use(
  (
    err: Error & { status?: number; type?: string },
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    if (err instanceof SyntaxError && err.status === 400 && err.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Malformed JSON' });
      return;
    }

    if (err instanceof AppError) {
      if (!err.isOperational) {
        logger.fatal({ err }, 'Non-operational error');
      }
      res.status(err.statusCode).json({ error: err.message });
      return;
    }

    logger.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  },
);

export default app;
