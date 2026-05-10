import type { ExistsResult, Queryable, UserRow } from '#types/database';

export const findByEmail = (q: Queryable, email: string) =>
  q.query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);

export const findById = (q: Queryable, userId: string) =>
  q.query<UserRow>('SELECT * FROM users WHERE user_id = $1', [userId]);

export const findByStripeCustomerId = (q: Queryable, customerId: string) =>
  q.query<UserRow>('SELECT * FROM users WHERE stripe_customer_id = $1 LIMIT 1', [
    customerId,
  ]);

export const emailExists = (q: Queryable, email: string) =>
  q.query<ExistsResult>('SELECT 1 as exists FROM users WHERE email = $1', [email]);

export const insert = (
  q: Queryable,
  firstName: string,
  lastName: string,
  email: string,
  passwordHash: string,
) =>
  q.query(
    `INSERT INTO users (first_name, last_name, email, password_hash)
     VALUES ($1, $2, $3, $4)`,
    [firstName, lastName, email, passwordHash],
  );

export const update = (q: Queryable, updates: string[], values: (string | Date)[]) =>
  q.query(
    `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${values.length}`,
    values,
  );

export const deleteById = (q: Queryable, userId: string) =>
  q.query('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [userId]);

export const setStripeCustomerId = (q: Queryable, userId: string, stripeCustomerId: string) =>
  q.query('UPDATE users SET stripe_customer_id = $1 WHERE user_id = $2', [
    stripeCustomerId,
    userId,
  ]);
