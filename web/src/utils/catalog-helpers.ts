export const promptForTitle = (kind: string, currentTitle: string): string | null => {
  const nextTitle = window.prompt(`Rename ${kind}`, currentTitle);
  if (nextTitle === null) return null;
  return nextTitle.trim() || currentTitle;
};

export const generateUntitledName = (prefix: string, existing: string[]): string => {
  let i = 1;
  while (existing.includes(`${prefix} ${i}`)) i += 1;
  return `${prefix} ${i}`;
};
