export const indexArray = <T>(count: number, callback: (num: number) => T) => {
  const abs = Math.abs(count);
  return Array.from({ length: abs }, (_, i) => callback(count < 0 ? abs - 1 - i : i));
};
