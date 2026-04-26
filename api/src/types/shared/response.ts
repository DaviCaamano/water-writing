// ----------------------------==== SHARED FILE ====---------------------------
// ALL IMPORTS IN SHARED FILES SHOULD NOT PULL FILES FROM THE REST OF THE /API DIRECTORY
// IMPORTS SHOULD BE FROM OTHER FILES IN THE /shared DIRECTORY WHERE THIS FILE LIVES
// OR IMPORTS SHOULD BE FROM LIBRARIES SHARED BY BOTH PROJECTS

// API response types
import { Response } from 'express';
import { Plan } from '#types/shared/enum/plan';
import { StripeSubscriptionStatus } from '#types/enum/stripe';

export type RouteResponse<T> = Response<T | { error: string }>;
export type OmitRowData<T> = Omit<T, 'createdAt' | 'updatedAt'>;
export interface DocumentResponse {
  documentId: string;
  storyId: string;
  title: string;
  body: string;
  predecessorId: string | null;
  successorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryResponse {
  storyId: string;
  worldId: string;
  title: string;
  predecessorId: string | null;
  successorId: string | null;
  documents: DocumentResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorldResponse {
  worldId: string;
  userId: string;
  title: string;
  stories: StoryResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponse {
  email: string;
  firstName: string;
  lastName: string;
  legacy: WorldResponse[];
  plan: Plan | null;
  token: string;
  userId: string;
}

export interface LogoutResponse {
  status: string;
}

export interface UserResponse {
  email: string;
  firstName: string;
  lastName: string;
  plan: Plan | null;
  userId: string;
}

export interface BillingResponse {
  billingId: string;
  planType: Plan;
  isYearPlan: boolean;
  amountCents: number;
  billedAt: Date;
}

export interface SubscriptionResponse {
  action: 'subscribed' | 'updated' | 'cancellation_scheduled' | 'already_canceled';
  amountCents: number | null;
  cancelAtPeriodEnd: boolean;
  planType: Plan | null;
  renewDate: Date | null;
  subscriptionStatus: StripeSubscriptionStatus | null;
  yearPlan: boolean;
}
