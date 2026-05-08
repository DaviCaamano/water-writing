import {
  DocumentResponse,
  OmitRowData,
  StoryResponse,
  CannonResponse,
} from '#types/shared/response';

export interface Document extends OmitRowData<Omit<DocumentResponse, 'documentId'>> {
  id: string;
}

export interface Story extends OmitRowData<Omit<StoryResponse, 'storyId' | 'documents'>> {
  id: string;
  documents: Document[];
}

export interface Cannon extends OmitRowData<Omit<CannonResponse, 'cannonId' | 'stories'>> {
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

export const ViewMode = {
  editor: 'editor',
  storyView: 'story-view',
  cannonView: 'cannon-view',
  legacy: 'legacy',
} as const;

export type ViewMode = (typeof ViewMode)[keyof typeof ViewMode];

export type EditorTheme = 'light' | 'dark' | 'sepia';
