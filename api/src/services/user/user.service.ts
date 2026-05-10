import bcrypt from 'bcrypt';
import pool from '#config/database';
import logger from '#config/logger';
import type { CreateUserBody, UpdateUserBody } from '#schemas/user.schemas';
import { EmailTakenError, UserNotFoundError } from '#constants/error/custom-errors';
import { UserResponse } from '#types/shared/response';
import * as stripeSyncService from '#services/stripe/subscription-sync.service';
import { withTransaction } from '#utils/database/with-transaction';
import { PoolClient } from 'pg';
import { assertFound } from '#utils/database/assert-found';
import * as userRepo from '#repositories/user/user.repository';

const SALT_ROUNDS = 12;

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';

export const createUser = async (data: CreateUserBody): Promise<void> => {
  const existing = await userRepo.emailExists(pool, data.email);
  if (existing.rows.length > 0) throw new EmailTakenError();

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  try {
    await userRepo.insert(pool, data.firstName, data.lastName, data.email, passwordHash);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new EmailTakenError();
    }
    throw error;
  }
  logger.info({ email: data.email }, 'User account created');
};

export const updateUser = async (userId: string, data: UpdateUserBody): Promise<UserResponse> => {
  return withTransaction(async (client: PoolClient) => {
    const updates: string[] = [];
    const values: (string | Date)[] = [];
    let paramIdx = 1;

    if (data.firstName) {
      updates.push(`first_name = $${paramIdx++}`);
      values.push(data.firstName);
    }
    if (data.lastName) {
      updates.push(`last_name = $${paramIdx++}`);
      values.push(data.lastName);
    }
    if (data.password) {
      const hash = await bcrypt.hash(data.password, SALT_ROUNDS);
      updates.push(`password_hash = $${paramIdx++}`);
      values.push(hash);
      logger.info({ userId }, 'Password changed');
    }

    if (updates.length > 0) {
      updates.push(`updated_at = $${paramIdx}`);
      values.push(new Date());
      values.push(userId);
      await userRepo.update(client, updates, values);
    }

    const [userResult, plan] = await Promise.all([
      userRepo.findById(client, userId),
      stripeSyncService.getUserPlan(client, userId),
    ]);
    const user = userResult.rows[0];
    if (!user) {
      throw new UserNotFoundError();
    }
    logger.info({ userId, fields: Object.keys(data) }, 'User updated');

    return {
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      plan,
    };
  });
};

export const deleteUser = async (userId: string): Promise<void> => {
  assertFound(await userRepo.deleteById(pool, userId), UserNotFoundError);
  logger.info({ userId }, 'User account deleted');
};
