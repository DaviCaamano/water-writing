import type { QueryResult, QueryResultRow } from 'pg';

export const assertFound = <T extends QueryResultRow>(
  result: QueryResult<T>,
  ErrorClass: new () => Error,
): T => {
  if (result.rows.length === 0) throw new ErrorClass();
  return result.rows[0]!;
};
