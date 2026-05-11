export const StripeSubscriptionStatus = {
  incomplete: 'incomplete',
  incompleteExpired: 'incomplete_expired',
  trialing: 'trialing',
  active: 'active',
  past_due: 'past_due',
  canceled: 'canceled',
  unpaid: 'unpaid',
  paused: 'paused',
} as const;

export type StripeSubscriptionStatus = Enum<typeof StripeSubscriptionStatus>;

const stripeStatusValues = new Set<string>(Object.values(StripeSubscriptionStatus));

export const toStripeSubscriptionStatus = (value: string): StripeSubscriptionStatus => {
  if (!stripeStatusValues.has(value)) {
    throw new Error(`Unexpected Stripe subscription status: ${value}`);
  }
  return value as StripeSubscriptionStatus;
};
