import type { Queryable, GenreRow } from '#types/database';

export const insertGenre = (q: Queryable, storyId: string, genre: string) =>
  q.query(
    'INSERT INTO genres (story_id, genre) VALUES ($1, $2) ON CONFLICT (story_id, genre) DO NOTHING',
    [storyId, genre],
  );

export const findByStoryId = (q: Queryable, storyId: string) =>
  q.query<GenreRow>('SELECT genre FROM genres WHERE story_id = $1 ORDER BY genre', [
    storyId,
  ]);
