import { ApiRouteBody } from '#types/shared/api-route';

export type ApiRouteHandler = (...args: (string | number | boolean | undefined)[]) => ApiRouteBody;

export const fillRouteParams = (
  route: string,
  ...values: Array<string | number | boolean | undefined>
): string => {
  let index = 0;

  return route.replace(/:[^/]+/g, () => {
    const value = values[index++];
    if (value === undefined) return '';
    return String(value);
  });
};
export const createRoute = (route: ApiRouteBody): ApiRouteHandler => {
  if (!route.url.includes(':')) return () => route;
  return (...values: (string | number | boolean | undefined)[]) => ({
    ...route,
    url: fillRouteParams(route.url, ...values),
  });
};
