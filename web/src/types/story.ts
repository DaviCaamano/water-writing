import {
  DocumentResponse,
  OmitRowData,
  StoryResponse,
  WorldResponse,
} from '#types/shared/response';

export interface Document extends OmitRowData<Omit<DocumentResponse, 'documentId'>> {
  id: string;
}

export interface Story extends OmitRowData<Omit<StoryResponse, 'storyId' | 'documents'>> {
  id: string;
  documents: Document[];
}

export interface World extends OmitRowData<Omit<WorldResponse, 'worldId' | 'stories'>> {
  id: string;
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

export enum ViewMode {
  editor = 'editor',
  storyView = 'story-view',
  worldView = 'world-view',
  legacy = 'legacy',
}

export type EditorTheme = 'light' | 'dark' | 'sepia';
