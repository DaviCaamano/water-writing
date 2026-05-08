/**
 * Compile-time exhaustiveness check for switch statements.
 * If all cases are handled, `x` narrows to `never` and this compiles.
 * If a case is missing, TypeScript errors on the call site.
 */
export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${String(x)}`);
}
