import { config } from 'dotenv';
config({ path: '.env.local' });

import bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Plan } from '#types/shared/enum/plan';
import { billing, documents, documentContent, plans, stories, users, cannons } from '#db/schema';
import { compressBody } from '#utils/compression';
import { RenewOn } from '#types/shared/enum/renew-on';
import { StripeSubscriptionStatus } from '#types/enum/stripe';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
const SALT_ROUNDS = 12;

type SeedCannon = typeof cannons.$inferInsert;
type SeedStory = typeof stories.$inferInsert;
type SeedDocument = typeof documents.$inferInsert;
type SeedDocumentContent = typeof documentContent.$inferInsert;

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

// produce a UUID from a Sha1 hash.
function deterministicUuid(scope: string, value: string): string {
  const hash = createHash('sha1').update(`${scope}:${value}`).digest('hex');
  const versioned = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}`;
  const variantByte = ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, '0');

  return `${versioned}-${variantByte}${hash.slice(18, 20)}-${hash.slice(20, 32)}`;
}

function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

const BOOKS_DIR = path.resolve(__dirname, '..', '__tests__', 'constants', 'books');

function buildLegacySeedRows(seedUserId: string): {
  cannonsToInsert: SeedCannon[];
  storiesToInsert: SeedStory[];
  documentsToInsert: SeedDocument[];
  documentContentsToInsert: { documentId: string; body: string }[];
} {
  const cannonsToInsert: SeedCannon[] = [];
  const storiesToInsert: SeedStory[] = [];
  const documentsToInsert: SeedDocument[] = [];
  const documentContentsToInsert: { documentId: string; body: string }[] = [];

  const cannonDirs = fs
    .readdirSync(BOOKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => naturalSort(a.name, b.name));

  for (const cannonDir of cannonDirs) {
    const cannonId = deterministicUuid('cannon', `${seedUserId}:${cannonDir.name}`);

    cannonsToInsert.push({
      cannonId,
      userId: seedUserId,
      title: cannonDir.name,
    });

    const cannonPath = path.join(BOOKS_DIR, cannonDir.name);
    const storyDirs = fs
      .readdirSync(cannonPath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .sort((a, b) => naturalSort(a.name, b.name));

    let prevStoryId: string | null = null;

    for (let storyIndex = 0; storyIndex < storyDirs.length; storyIndex++) {
      const storyDir = storyDirs[storyIndex]!;
      const storyId = deterministicUuid(
        'story',
        `${seedUserId}:${cannonDir.name}:${storyDir.name}`,
      );

      const nextStoryId =
        storyIndex < storyDirs.length - 1
          ? deterministicUuid(
              'story',
              `${seedUserId}:${cannonDir.name}:${storyDirs[storyIndex + 1]!.name}`,
            )
          : null;

      storiesToInsert.push({
        storyId,
        cannonId,
        title: storyDir.name,
        predecessorId: prevStoryId,
        successorId: nextStoryId,
      });

      prevStoryId = storyId;

      const storyPath = path.join(cannonPath, storyDir!.name);
      const docFiles = fs
        .readdirSync(storyPath, { withFileTypes: true })
        .filter((f) => f.isFile() && f.name.endsWith('.txt'))
        .sort((a, b) => naturalSort(a.name, b.name));

      let prevDocId: string | null = null;

      for (let documentIndex = 0; documentIndex < docFiles.length; documentIndex++) {
        const docFile = docFiles[documentIndex]!;
        const docId = deterministicUuid(
          'document',
          `${seedUserId}:${cannonDir.name}:${storyDir!.name}:${docFile.name}`,
        );

        const nextDocId =
          documentIndex < docFiles.length - 1
            ? deterministicUuid(
                'document',
                `${seedUserId}:${cannonDir.name}:${storyDir!.name}:${docFiles[documentIndex + 1]!.name}`,
              )
            : null;

        documentsToInsert.push({
          documentId: docId,
          storyId,
          title: docFile.name.replace(/\.txt$/, ''),
          predecessorId: prevDocId,
          successorId: nextDocId,
        });

        const body = fs.readFileSync(path.join(storyPath, docFile!.name), 'utf-8');
        documentContentsToInsert.push({ documentId: docId, body });

        prevDocId = docId;
      }
    }
  }

  return { cannonsToInsert, storiesToInsert, documentsToInsert, documentContentsToInsert };
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

  if (existingEmailUser.length > 0 && existingEmailUser[0]!.userId !== seedUserId) {
    throw new Error(
      `Cannot seed user_id=${seedUserId} because email ${seedEmail} is already used by user_id=${existingEmailUser[0]!.userId}.`,
    );
  }

  const { cannonsToInsert, storiesToInsert, documentsToInsert, documentContentsToInsert } =
    buildLegacySeedRows(seedUserId);

  await db.transaction(async (transaction) => {
    if (existingUser.length === 0) {
      const passwordHash = await bcrypt.hash(seedPassword, SALT_ROUNDS);

      await transaction.insert(users).values({
        userId: seedUserId,
        firstName: 'tester',
        lastName: 'mctester',
        email: seedEmail,
        passwordHash,
        stripeCustomerId: null,
      });
    }

    await transaction
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

    const existingBilling = await transaction
      .select({ billingId: billing.billingId })
      .from(billing)
      .where(eq(billing.userId, seedUserId))
      .limit(1);

    if (existingBilling.length === 0) {
      await transaction.insert(billing).values({
        userId: seedUserId,
        planType: Plan.pro,
        isYearPlan: false,
        amountCents: 1000,
      });
    }

    await transaction.delete(cannons).where(eq(cannons.userId, seedUserId));

    await transaction.insert(cannons).values(cannonsToInsert);
    await transaction.insert(stories).values(storiesToInsert);
    await transaction.insert(documents).values(documentsToInsert);

    if (documentContentsToInsert.length > 0) {
      const compressedContents: SeedDocumentContent[] = await Promise.all(
        documentContentsToInsert.map(async (dc) => ({
          documentId: dc.documentId,
          body: await compressBody(dc.body),
        })),
      );
      const BATCH_SIZE = 50;
      for (let i = 0; i < compressedContents.length; i += BATCH_SIZE) {
        await transaction
          .insert(documentContent)
          .values(compressedContents.slice(i, i + BATCH_SIZE));
      }
    }
  });

  console.log(
    `Seeded legacy for user_id=${seedUserId}: ${cannonsToInsert.length} cannons, ${storiesToInsert.length} stories, ${documentsToInsert.length} documents.`,
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
