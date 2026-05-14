import { BillingResponse, LoginResponse } from '#types/shared/response';
import { BillingRow, PlanRow, UserRow } from '#types/database';
import { Plan } from '#types/shared/enum/plan';
import { CreateUserBody, SubscribeBody, UpdateUserBody } from '#schemas/user.schemas';
export { MOCK_USER_ID } from '#__tests__/constants/mock-ids';
import { MOCK_USER_ID } from '#__tests__/constants/mock-ids';
import {
  MOCK_STRIPE_INVOICE_ID,
  MOCK_STRIPE_PAYMENT_INTENT_ID,
  mockStipePaymentMethodId,
  mockStripeCustomerId,
  mockStripePriceId,
  mockStripeSubscriptionId,
} from '#__tests__/constants/mock-stripe';
import { MOCK_DATE } from '#__tests__/constants/mock-basic';
import { mockLegacyResponse } from '#__tests__/utils/mock-linked-documents';
import { RenewOn } from '#types/shared/enum/renew-on';
import { StripeSubscriptionStatus } from '#types/enum/stripe';

export const MOCK_LOGIN_EMAIL = 'jane@example.com';
export const MOCK_LOGIN_TOKEN = 'mock-jwt-token';
export const MOCK_LOGIN_FIRST_NAME = 'Jane';
export const MOCK_LOGIN_LAST_NAME = 'Doe';
export const MOCK_LOGIN_PLAN = Plan.pro;
export const MOCK_STRONG_PASSWORD = 'P@ssword123!';
export const MOCK_HASHED_PASSWORD = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
export const MOCK_BILLING_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bdyy0a15';

export const MOCK_USER: UserRow = {
  user_id: MOCK_USER_ID,
  email: MOCK_LOGIN_EMAIL,
  first_name: MOCK_LOGIN_FIRST_NAME,
  last_name: MOCK_LOGIN_LAST_NAME,
  password_hash: MOCK_HASHED_PASSWORD,
  stripe_customer_id: mockStripeCustomerId,
  last_viewed_document_id: null,
  created_at: MOCK_DATE,
  updated_at: MOCK_DATE,
};

export const MOCK_NEW_USER: CreateUserBody = {
  firstName: MOCK_LOGIN_FIRST_NAME,
  lastName: MOCK_LOGIN_LAST_NAME,
  email: MOCK_LOGIN_EMAIL,
  password: MOCK_STRONG_PASSWORD,
};

export const MOCK_UPDATING_USER: UpdateUserBody = {
  firstName: MOCK_LOGIN_FIRST_NAME,
  lastName: MOCK_LOGIN_LAST_NAME,
  password: MOCK_STRONG_PASSWORD,
};

export const MOCK_LOGIN_RESPONSE: LoginResponse = {
  email: MOCK_LOGIN_EMAIL,
  userId: MOCK_USER_ID,
  plan: MOCK_LOGIN_PLAN,
  firstName: MOCK_LOGIN_FIRST_NAME,
  lastName: MOCK_LOGIN_LAST_NAME,
  legacy: mockLegacyResponse(),
  lastViewedDocumentId: null,
  token: MOCK_LOGIN_TOKEN,
};

export const MOCK_PLAN: PlanRow = {
  user_id: MOCK_USER_ID,
  plan_type: Plan.pro,
  is_year_plan: false,
  renew_on: RenewOn.monthly,
  renew_date: MOCK_DATE,
  stripe_price_id: mockStripePriceId,
  stripe_subscription_id: mockStripeSubscriptionId,
  subscription_status: StripeSubscriptionStatus.active,
  cancel_at_period_end: false,
  start_date: MOCK_DATE,
  end_date: MOCK_DATE,
  created_at: MOCK_DATE,
  updated_at: MOCK_DATE,
};

export const MOCK_SUBSCRIPTION_REQUEST: SubscribeBody = {
  planType: Plan.pro,
  isYearPlan: false,
  paymentMethodId: mockStipePaymentMethodId,
};

export const MOCK_BILLING_ROW: BillingRow = {
  billing_id: MOCK_BILLING_ID,
  user_id: MOCK_USER_ID,
  plan_type: Plan.pro,
  is_year_plan: false,
  amount_cents: 152315,
  stripe_invoice_id: MOCK_STRIPE_INVOICE_ID,
  stripe_payment_intent_id: MOCK_STRIPE_PAYMENT_INTENT_ID,
  billed_at: MOCK_DATE,
};

export const MOCK_BILLING_RESPONSE: BillingResponse = {
  billingId: MOCK_BILLING_ID,
  userId: MOCK_USER_ID,
  planType: Plan.pro,
  isYearPlan: false,
  amountCents: 152315,
  stripePaymentIntentId: MOCK_STRIPE_PAYMENT_INTENT_ID,
  stripeInvoiceId: MOCK_STRIPE_INVOICE_ID,
  billedAt: MOCK_DATE,
};
