export const ZIndex = {
  pageTransition: 10000,
  modal: 9000,
  overlay: 8000,
  base: 1,
};
export type ZIndex = Enum<typeof ZIndex>;

export const KeyLabel = {
  escape: 'Escape',
  backspace: 'Backspace',
  delete: 'Delete',
  insert: 'Insert',
  space: 'Space',
  arrowUp: 'ArrowUp',
  arrowDown: 'ArrowDown',
  arrowLeft: 'ArrowLeft',
  arrowRight: 'ArrowRight',
  home: 'Home',
  end: 'End',
  pageUp: 'PageUp',
  pageDown: 'PageDown',
  Tab: 'Tab',
} as const;
export type KeyLabel = Enum<typeof KeyLabel>;

export const Variant = {
  default: 'default',
  debossed: 'debossed',
  bossed: 'bossed',
  accented: 'accented',
  destructive: 'destructive',
  primary: 'primary',
  secondary: 'secondary',
  muted: 'muted',
  success: 'success',
} as const;
export type Variant = Enum<typeof Variant>;
