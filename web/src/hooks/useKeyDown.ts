import { useEffect, useRef } from 'react';

export const KeyDownModifier = {
  ctrl: 'ctrlKey',
  meta: 'metaKey', // Mac only, key is positioned where the windows key is on a windows keyboard.
  shift: 'shiftKey',
  alt: 'altKey',
} as const;

export type KeyDownModifier = Enum<typeof KeyDownModifier>;

export interface KeyDownHandler {
  key: string;
  modifiers?: (KeyDownModifier[] | KeyDownModifier)[];
  filterModifiers?: KeyDownModifier[];
  handler: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
}

// Handle Keypress behavior
export const useKeyDown = (keyHandlers: KeyDownHandler | KeyDownHandler[]) => {
  const handlers = useRef<KeyDownHandler[]>(
    Array.isArray(keyHandlers) ? [...keyHandlers] : [keyHandlers],
  );

  // Update the handler ref whenever the keyHandlers prop changes
  useEffect(() => {
    handlers.current = Array.isArray(keyHandlers) ? keyHandlers : [keyHandlers];
  }, [keyHandlers]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      for (const handler of handlers.current) {
        const keyMatch = event.key === handler.key;
        if (!keyMatch) continue;

        const modifierPressed = checkModifiers(event, handler.modifiers);
        const filterModifierPressed = checkFilters(event, handler.filterModifiers);

        if (modifierPressed && filterModifierPressed) {
          if (handler.preventDefault) {
            event.preventDefault();
          }
          handler.handler(event);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [keyHandlers]);
};

const checkModifiers = (
  event: KeyboardEvent,
  modifiers?: (KeyDownModifier[] | KeyDownModifier)[],
) => {
  if (!modifiers) return true;
  const modifierCollection = modifiers.reduce<KeyDownModifier[][]>(
    (acc, modifier) => [...acc, Array.isArray(modifier) ? modifier : [modifier]],
    [],
  );

  // Run through each modifier set and pass the function if any of the modifiers are pressed.
  for (const modifierSet of modifierCollection) {
    let passed = true;
    for (const key of modifierSet) {
      if (!event[key]) {
        passed = false;
      }
    }
    if (passed) return true;
  }
  return false;
};

const checkFilters = (event: KeyboardEvent, modifiers?: KeyDownModifier[]) => {
  if (!modifiers) return true;

  // Run through each modifier filter pass the function if none of the modifiers are pressed.
  for (const key of modifiers) {
    if (event[key]) {
      return false;
    }
  }
  return true;
};
