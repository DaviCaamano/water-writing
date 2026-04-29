import { config } from 'dotenv';
config({ path: '.env.local' });

import bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { StoryRowWithDocuments, WorldRowWithStories } from '#types/database';
import { Plan } from '#types/shared/enum/plan';
import { billing, documents, plans, stories, users, worlds } from '#db/schema';
import { mockLegacy } from '#__tests__/utils/mock-linked-documents';
import { RenewOn } from '#types/shared/enum/renew-on';
import { StripeSubscriptionStatus } from '#types/enum/stripe';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
const SALT_ROUNDS = 12;

type SeedWorld = typeof worlds.$inferInsert;
type SeedStory = typeof stories.$inferInsert;
type SeedDocument = typeof documents.$inferInsert;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function deterministicUuid(scope: string, value: string): string {
  const hash = createHash('sha1').update(`${scope}:${value}`).digest('hex');
  const versioned = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}`;
  const variantByte = ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, '0');

  return `${versioned}-${variantByte}${hash.slice(18, 20)}-${hash.slice(20, 32)}`;
}

function buildLegacySeedRows(seedUserId: string): {
  worldsToInsert: SeedWorld[];
  storiesToInsert: SeedStory[];
  documentsToInsert: SeedDocument[];
} {
  const legacy = mockLegacy() as WorldRowWithStories[];

  const worldIds = new Map<string, string>();
  const storyIds = new Map<string, string>();
  const documentIds = new Map<string, string>();

  for (const world of legacy) {
    worldIds.set(world.world_id, deterministicUuid('world', `${seedUserId}:${world.world_id}`));

    for (const story of world.stories as StoryRowWithDocuments[]) {
      storyIds.set(story.story_id, deterministicUuid('story', `${seedUserId}:${story.story_id}`));

      for (const document of story.documents) {
        documentIds.set(
          document.document_id,
          deterministicUuid('document', `${seedUserId}:${document.document_id}`),
        );
      }
    }
  }

  const worldsToInsert: SeedWorld[] = legacy.map((world) => ({
    worldId: worldIds.get(world.world_id)!,
    userId: seedUserId,
    title: world.title,
    createdAt: world.created_at,
    updatedAt: world.updated_at,
  }));

  const storiesToInsert: SeedStory[] = legacy.flatMap((world) =>
    (world.stories as StoryRowWithDocuments[]).map((story) => ({
      storyId: storyIds.get(story.story_id)!,
      worldId: worldIds.get(world.world_id)!,
      title: story.title,
      predecessorId: story.predecessor_id ? storyIds.get(story.predecessor_id)! : null,
      successorId: story.successor_id ? storyIds.get(story.successor_id)! : null,
      createdAt: story.created_at,
      updatedAt: story.updated_at,
    })),
  );

  const documentsToInsert: SeedDocument[] = legacy.flatMap((world) =>
    (world.stories as StoryRowWithDocuments[]).flatMap((story) =>
      story.documents.map((document) => ({
        documentId: documentIds.get(document.document_id)!,
        storyId: storyIds.get(story.story_id)!,
        title: document.title,
        body: document.body,
        predecessorId: document.predecessor_id ? documentIds.get(document.predecessor_id)! : null,
        successorId: document.successor_id ? documentIds.get(document.successor_id)! : null,
        createdAt: document.created_at,
        updatedAt: document.updated_at,
      })),
    ),
  );

  return { worldsToInsert, storiesToInsert, documentsToInsert };
}

async function seed() {
  const seedUserId = getRequiredEnv('DB_SEED_USER_ID');
  const seedEmail = getRequiredEnv('DB_SEED_EMAIL');
  const seedPassword = getRequiredEnv('DB_SEED_PASSWORD');

  const existingUser = await db
    .select({ userId: users.userId })
    .from(users)
    .where(eq(users.userId, seedUserId))
    .limit(1);

  const existingEmailUser = await db
    .select({ userId: users.userId, email: users.email })
    .from(users)
    .where(eq(users.email, seedEmail))
    .limit(1);

  if (existingEmailUser.length > 0 && existingEmailUser[0].userId !== seedUserId) {
    throw new Error(
      `Cannot seed user_id=${seedUserId} because email ${seedEmail} is already used by user_id=${existingEmailUser[0].userId}.`,
    );
  }

  const { worldsToInsert, storiesToInsert, documentsToInsert } = buildLegacySeedRows(seedUserId);

  await db.transaction(async (tx) => {
    if (existingUser.length === 0) {
      const passwordHash = await bcrypt.hash(seedPassword, SALT_ROUNDS);

      await tx.insert(users).values({
        userId: seedUserId,
        firstName: 'tester',
        lastName: 'mctester',
        email: seedEmail,
        passwordHash,
        stripeCustomerId: null,
      });
    }

    await tx
      .insert(plans)
      .values({
        userId: seedUserId,
        planType: Plan.pro,
        isYearPlan: false,
        renewOn: RenewOn.monthly,
        renewDate: new Date(),
        stripePriceId: null,
        subscriptionStatus: StripeSubscriptionStatus.active,
        cancelAtPeriodEnd: false,
      })
      .onConflictDoUpdate({
        target: plans.userId,
        set: {
          planType: Plan.pro,
          isYearPlan: false,
          renewOn: RenewOn.monthly,
          renewDate: new Date(),
          stripePriceId: null,
          subscriptionStatus: StripeSubscriptionStatus.active,
          cancelAtPeriodEnd: false,
          endDate: null,
          updatedAt: new Date(),
        },
      });

    const existingBilling = await tx
      .select({ billingId: billing.billingId })
      .from(billing)
      .where(eq(billing.userId, seedUserId))
      .limit(1);

    if (existingBilling.length === 0) {
      await tx.insert(billing).values({
        userId: seedUserId,
        planType: Plan.pro,
        isYearPlan: false,
        amountCents: 1000,
      });
    }

    await tx.insert(worlds).values(worldsToInsert).onConflictDoNothing();
    await tx.insert(stories).values(storiesToInsert).onConflictDoNothing();
    await tx.insert(documents).values(documentsToInsert).onConflictDoNothing();
  });

  console.log(
    `Seeded legacy for user_id=${seedUserId}: ${worldsToInsert.length} worlds, ${storiesToInsert.length} stories, ${documentsToInsert.length} documents.`,
  );
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed script cannot be run in production');
  }

  try {
    await seed();
  } finally {
    await pool.end();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
