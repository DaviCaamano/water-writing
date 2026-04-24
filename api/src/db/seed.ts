import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { users } from '#db/schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const SEED_USER = {
  firstName: 'Test',
  lastName: 'User',
  email: process.env.TEST_USER_EMAIL,
  password: process.env.TEST_USER_PASSWORD,
};

async function seed() {
  const passwordHash = await bcrypt.hash(SEED_USER.password!, 12);

  await db
    .insert(users)
    .values({
      firstName: SEED_USER.firstName,
      lastName: SEED_USER.lastName,
      email: SEED_USER.email!,
      passwordHash,
    })
    .onConflictDoNothing({ target: users.email });

  console.log(`Seed user ready: ${SEED_USER.email} / ${SEED_USER.password}`);
  await pool.end();
}

if (process.env.NODE_ENV === 'production') {
  console.error('Seed script cannot be run in production');
  process.exit(1);
} else if (process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD) {
  void seed();
}
