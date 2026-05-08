import { Plan } from '#types/shared/enum/plan';
import { StripeSubscriptionStatus } from '#types/enum/stripe';

jest.mock('#config/database');
jest.mock('#services/story/cannon.service');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

import { fetchLegacy } from '#services/story/cannon.service';
import { getSession, login } from '#services/user/login.service';
import {
  MOCK_LOGIN_EMAIL,
  MOCK_LOGIN_RESPONSE,
  MOCK_LOGIN_TOKEN,
  MOCK_STRONG_PASSWORD,
  MOCK_USER,
} from '#__tests__/constants/mock-user';
import { mockPool } from '#__tests__/constants/mock-database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { InvalidCredentialsError, UserNotFoundError } from '#constants/error/custom-errors';
import { mockClear } from '#__tests__/utils/test-wrappers';
import { mockLegacyResponse } from '#__tests__/utils/mock-linked-documents';

const mockFetchLegacy = fetchLegacy as jest.MockedFunction<typeof fetchLegacy>;
const mockBcryptCompare = bcrypt.compare as jest.Mock;

describe(
  'login service: login',
  mockClear(() => {
    it('should return a user object with the correct properties', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [MOCK_USER] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          rows: [{ plan_type: Plan.pro, subscription_status: StripeSubscriptionStatus.active }],
        });
      mockFetchLegacy.mockImplementationOnce(async () => mockLegacyResponse());
      mockBcryptCompare.mockResolvedValueOnce(true);
      (jwt.sign as jest.Mock).mockReturnValueOnce(MOCK_LOGIN_TOKEN);

      const response = await login({
        email: MOCK_LOGIN_EMAIL,
        password: MOCK_STRONG_PASSWORD,
      });

      expect(response).toMatchObject(MOCK_LOGIN_RESPONSE);
    });

    it('throw InvalidCredentialsError error if email does not exist', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      void expect(
        login({
          email: MOCK_LOGIN_EMAIL,
          password: MOCK_STRONG_PASSWORD,
        }),
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('throw InvalidCredentialsError error if password is incorrect', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [MOCK_USER] });
      mockBcryptCompare.mockResolvedValueOnce(false);
      void expect(
        login({ email: MOCK_LOGIN_EMAIL, password: MOCK_STRONG_PASSWORD }),
      ).rejects.toThrow(InvalidCredentialsError);
    });
  }),
);

describe(
  'login service: getSession',
  mockClear(() => {
    it('returns the current authenticated session payload', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [MOCK_USER] })
        .mockResolvedValueOnce({
          rows: [{ plan_type: Plan.pro, subscription_status: StripeSubscriptionStatus.active }],
        });
      mockFetchLegacy.mockImplementationOnce(async () => mockLegacyResponse());

      const response = await getSession(MOCK_USER.user_id, MOCK_LOGIN_TOKEN);

      expect(response).toMatchObject(MOCK_LOGIN_RESPONSE);
    });

    it('throws UserNotFoundError when the authenticated user no longer exists', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(getSession(MOCK_USER.user_id, MOCK_LOGIN_TOKEN)).rejects.toThrow(
        UserNotFoundError,
      );
    });

    it('propagates downstream fetchLegacy failures', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [MOCK_USER] })
        .mockResolvedValueOnce({
          rows: [{ plan_type: Plan.pro, subscription_status: StripeSubscriptionStatus.active }],
        });
      mockFetchLegacy.mockRejectedValueOnce(new Error('legacy failed'));

      await expect(getSession(MOCK_USER.user_id, MOCK_LOGIN_TOKEN)).rejects.toThrow(
        'legacy failed',
      );
    });
  }),
);
