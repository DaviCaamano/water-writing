export const SettingsSection = {
  general: 'general',
  plan: 'plan',
  billing: 'billing',
} as const;

export type SettingsSection = (typeof SettingsSection)[keyof typeof SettingsSection];

export type SettingsColorMap = {
  default: string;
  destructive: string;
  ghost: string;
};
