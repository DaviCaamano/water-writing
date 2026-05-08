const DEFAULT_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

export const parseExpiration = (exp: string): number => {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) return DEFAULT_EXPIRATION_MS;
  const duration = parseInt(match[1]!, 10);
  switch (match[2]) {
    case 's':
      return duration * 1000;
    case 'm':
      return duration * 60 * 1000;
    case 'h':
      return duration * 60 * 60 * 1000;
    case 'd':
      return duration * 24 * 60 * 60 * 1000;
    default:
      return DEFAULT_EXPIRATION_MS;
  }
};
