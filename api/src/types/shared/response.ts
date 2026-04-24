// API response types
import { Response } from 'express';
import { Plan } from '#types/shared/enum/plan';

export type RouteResponse<T> = Response<T | { error: string }>;

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
