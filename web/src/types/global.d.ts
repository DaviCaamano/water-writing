import { Dispatch, SetStateAction } from 'react';

declare global {
  type Setter<T> = Dispatch<SetStateAction<T>>;
  type Enum<T extends Record<string, string | number>> = T[keyof T];
}
export {};
