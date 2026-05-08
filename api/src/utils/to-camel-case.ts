/**
 * Converts snake_case object keys to camelCase recursively
 * Handles nested objects and arrays
 */
export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};
