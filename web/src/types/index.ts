export interface User {
  accountId: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  subscription: 'none' | 'pro' | 'max';
  documentNames: string[];
  genres: string[];
}

export interface StoryDocument {
  id: string;
  title: string;
  body: string;
  storyId: string;
  predecessorId: string | null;
  successorId: string | null;
  characters: DocumentCharacter[];
  places: DocumentPlace[];
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
}

export interface World {
  id: string;
  name: string;
  stories: Story[];
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

export type ViewMode = 'editor' | 'story-canvas' | 'world-canvas' | 'legacy';

export type EditorTheme = 'light' | 'dark' | 'sepia';
