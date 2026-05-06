import type { DocumentResponse, StoryResponse, CannonResponse } from '#types/shared/response';
import type { DecompressedDocumentRow, StoryRow, CannonRow } from '#types/database';
import { MOCK_DATE } from '#__tests__/constants/mock-basic';
import { MOCK_USER_ID } from '#__tests__/constants/mock-ids';
export { mockPool } from '#__tests__/constants/mock-database';

export const MOCK_CANNON_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
export const MOCK_STORY_ID = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
export const MOCK_DOC_ID = 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

export const MOCK_CANNON: CannonRow = {
  cannon_id: MOCK_CANNON_ID,
  user_id: MOCK_USER_ID,
  title: 'Test Cannon',
  created_at: MOCK_DATE,
  updated_at: MOCK_DATE,
};

export const MOCK_CANNON_RESPONSE: CannonResponse = {
  cannonId: MOCK_CANNON_ID,
  userId: MOCK_USER_ID,
  title: 'Test Cannon',
  stories: [],
  createdAt: MOCK_DATE,
  updatedAt: MOCK_DATE,
};

export const MOCK_STORY: StoryRow = {
  story_id: MOCK_STORY_ID,
  cannon_id: MOCK_CANNON_ID,
  title: 'Test Story',
  predecessor_id: null,
  successor_id: null,
  created_at: MOCK_DATE,
  updated_at: MOCK_DATE,
};

export const MOCK_STORY_RESPONSE: StoryResponse = {
  storyId: MOCK_STORY_ID,
  cannonId: MOCK_CANNON_ID,
  title: 'Test Story',
  predecessorId: null,
  successorId: null,
  documents: [],
  createdAt: MOCK_DATE,
  updatedAt: MOCK_DATE,
};

export const MOCK_DOC: DecompressedDocumentRow = {
  document_id: MOCK_DOC_ID,
  story_id: MOCK_STORY_ID,
  title: 'Test Document',
  body: 'Test content',
  predecessor_id: null,
  successor_id: null,
  created_at: MOCK_DATE,
  updated_at: MOCK_DATE,
};

export const MOCK_DOCK_RESPONSE: DocumentResponse = {
  documentId: MOCK_DOC_ID,
  storyId: MOCK_STORY_ID,
  title: 'Test Document',
  body: 'Test content',
  predecessorId: null,
  successorId: null,
  createdAt: MOCK_DATE,
  updatedAt: MOCK_DATE,
};
