export const RenewOn = {
  monthly: 'monthly',
  yearly: 'yearly',
} as const;

export type RenewOn = Enum<typeof RenewOn>;
