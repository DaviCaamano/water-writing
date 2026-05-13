export const indexArray = <T>(array: number, callback: (num: number) => T) =>
  Array.from({ length: array }, (_, index) => callback(index));
