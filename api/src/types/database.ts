// Database row types
import { Plan } from '#types/shared/enum/plan';
import { RenewOn } from '#types/shared/enum/renew-on';
import { StripeSubscriptionStatus } from '#types/enum/stripe';

export interface UserRow {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  stripe_customer_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface GenreRow {
  story_id: string;
  genre: string;
  created_at: Date;
}

export interface CannonRow {
  cannon_id: string;
  user_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

export interface CannonRowWithStories extends CannonRow {
  stories: StoryRow[];
}

export interface StoryRow {
  story_id: string;
  cannon_id: string;
  title: string;
  predecessor_id: string | null;
  successor_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DecompressedDocumentRow extends DocumentRow {
  body: string;
}

export interface StoryRowWithDocuments extends StoryRow {
  documents: DecompressedDocumentRow[];
}

export interface DocumentRow {
  document_id: string;
  story_id: string;
  title: string;
  predecessor_id: string | null;
  successor_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentRowWithBody extends DocumentRow {
  body: Buffer | null;
}

export interface DocumentContentRow {
  document_id: string;
  body: Buffer;
}

export interface PlanRow {
  user_id: string;
  plan_type: Plan;
  is_year_plan: boolean;
  renew_on: RenewOn | null;
  renew_date: Date;
  stripe_price_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: StripeSubscriptionStatus | null;
  cancel_at_period_end: boolean;
  start_date: Date;
  end_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface BillingRow {
  billing_id: string;
  user_id: string;
  plan_type: Plan;
  is_year_plan: boolean;
  amount_cents: number;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  billed_at: Date;
}

export interface AuthenticationRow {
  auth_id: string;
  user_id: string;
  token: string;
  created_at: Date;
  expires_at: Date;
}
