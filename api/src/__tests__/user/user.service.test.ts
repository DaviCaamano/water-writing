jest.mock('#utils/database/with-transaction');

import { createUser, deleteUser, updateUser } from '#services/user/user.service';
import {
  MOCK_NEW_USER,
  MOCK_PLAN,
  MOCK_UPDATING_USER,
  MOCK_USER,
  MOCK_USER_ID,
} from '#__tests__/constants/mock-user';
import { createMockClient, mockPool } from '#__tests__/constants/mock-database';
import { EmailTakenError, UserNotFoundError } from '#constants/error/custom-errors';
import { PoolClient } from 'pg';
import { withTransaction } from '#utils/database/with-transaction';
import { mockClear } from '#__tests__/utils/test-wrappers';

const mockWithTransaction = withTransaction as jest.MockedFunction<typeof withTransaction>;

describe(
  'createUser',
  mockClear(() => {
    it('creates a new user when the email is available', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce(undefined);

      await expect(createUser(MOCK_NEW_USER)).resolves.toBeUndefined();
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('throws EmailTakenError when the email already exists', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [MOCK_USER] });

      await expect(createUser(MOCK_NEW_USER)).rejects.toThrow(EmailTakenError);
    });

    it('maps a database unique violation to EmailTakenError', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }).mockRejectedValueOnce({ code: '23505' });

      await expect(createUser(MOCK_NEW_USER)).rejects.toThrow(EmailTakenError);
    });
  }),
);

describe(
  'updateUser',
  mockClear(() => {
    it('updates a user and returns the mapped response', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [MOCK_USER] })
        .mockResolvedValueOnce({ rows: [MOCK_PLAN] });
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient as PoolClient));

      await expect(updateUser(MOCK_USER_ID, MOCK_UPDATING_USER)).resolves.toEqual({
        userId: MOCK_USER.user_id,
        firstName: MOCK_USER.first_name,
        lastName: MOCK_USER.last_name,
        email: MOCK_USER.email,
        plan: MOCK_PLAN.plan_type,
      });
    });

    it('throws UserNotFoundError when the user disappears before the response is built', async () => {
      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      mockWithTransaction.mockImplementationOnce((callback) => callback(mockClient as PoolClient));

      await expect(updateUser(MOCK_USER_ID, { firstName: 'Jane' })).rejects.toThrow(
        UserNotFoundError,
      );
    });
  }),
);

describe(
  'deleteUser',
  mockClear(() => {
    it('deletes the user when the account exists', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: MOCK_USER_ID }] });

      await expect(deleteUser(MOCK_USER_ID)).resolves.toBeUndefined();
      expect(mockPool.query).toHaveBeenCalledWith(expect.any(String), [MOCK_USER_ID]);
    });

    it('throws UserNotFoundError when no account exists for the user id', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(deleteUser(MOCK_USER_ID)).rejects.toThrow(UserNotFoundError);
    });
  }),
);

