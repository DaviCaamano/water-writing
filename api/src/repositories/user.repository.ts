import type { Queryable, UserRow } from '#types/database';

export function findByEmail(q: Queryable, email: string) {
  return q.query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
}

export function findById(q: Queryable, userId: string) {
  return q.query<UserRow>('SELECT * FROM users WHERE user_id = $1', [userId]);
}

export function findByStripeCustomerId(q: Queryable, customerId: string) {
  return q.query<UserRow>('SELECT * FROM users WHERE stripe_customer_id = $1 LIMIT 1', [
    customerId,
  ]);
}

export function emailExists(q: Queryable, email: string) {
  return q.query<{ '?column?': number }>('SELECT 1 FROM users WHERE email = $1', [email]);
}

export function insert(
  q: Queryable,
  firstName: string,
  lastName: string,
  email: string,
  passwordHash: string,
) {
  return q.query(
    `INSERT INTO users (first_name, last_name, email, password_hash)
     VALUES ($1, $2, $3, $4)`,
    [firstName, lastName, email, passwordHash],
  );
}

export function update(q: Queryable, updates: string[], values: (string | Date)[]) {
  return q.query(
    `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${values.length}`,
    values,
  );
}

export function deleteById(q: Queryable, userId: string) {
  return q.query('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [userId]);
}

export function setStripeCustomerId(q: Queryable, userId: string, stripeCustomerId: string) {
  return q.query('UPDATE users SET stripe_customer_id = $1 WHERE user_id = $2', [
    stripeCustomerId,
    userId,
  ]);
}
