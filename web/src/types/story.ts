export interface StoryDocument {
  id: string;
  title: string;
  body: string;
  storyId: string;
  predecessorId: string | null;
  successorId: string | null;
  characters: DocumentCharacter[];
  places: DocumentPlace[];
  coverImage: string | null;
}

export interface DocumentCharacter {
  id: string;
  name: string;
}

export interface DocumentPlace {
  id: string;
  name: string;
}

export interface Story {
  id: string;
  name: string;
  worldId: string;
  documentCount: number;
  documents: StoryDocument[];
  coverImage: string | null;
}

export interface World {
  id: string;
  name: string;
  stories: Story[];
  coverImage: string | null;
}

export interface BillingHistoryEntry {
  date: string;
  amount: number;
  url: string;
}

export interface CardInfo {
  last4: string;
  network: string;
}

export interface BillingResponse {
  history: BillingHistoryEntry[];
  card: CardInfo;
}

export type ViewMode = 'editor' | 'story-view' | 'world-view' | 'legacy';

export type EditorTheme = 'light' | 'dark' | 'sepia';
