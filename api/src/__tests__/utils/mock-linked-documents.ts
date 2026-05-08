import {
  MOCK_DOC,
  MOCK_DOCK_RESPONSE,
  MOCK_STORY,
  MOCK_STORY_RESPONSE,
  MOCK_CANNON,
  MOCK_CANNON_RESPONSE,
} from '#__tests__/constants/mock-story';
import { DecompressedDocumentRow, StoryRow, StoryRowWithDocuments, CannonRowWithStories } from '#types/database';
import { DocumentResponse, StoryResponse, CannonResponse } from '#types/shared/response';

export enum DocType {
  cannonRow = 'cannon-row',
  cannonResponse = 'cannon-response',
  storyRow = 'story-row',
  storyResponse = 'story-response',
  documentRow = 'document-row',
  documentResponse = 'document-response',
}

export const DocTypeMap = {
  [DocType.storyRow]: MOCK_STORY,
  [DocType.storyResponse]: MOCK_STORY_RESPONSE,
  [DocType.documentRow]: MOCK_DOC,
  [DocType.documentResponse]: MOCK_DOCK_RESPONSE,
};

// A helper to mock a list of documents
export function mockDocList(
  docType: DocType.documentRow,
  length: number,
  storyId: string,
): DecompressedDocumentRow[];
export function mockDocList(
  docType: DocType.documentResponse,
  length: number,
  storyId: string,
): DocumentResponse[];
export function mockDocList(
  docType: DocType.documentRow | DocType.documentResponse,
  length: number,
  storyId: string,
): DecompressedDocumentRow[] | DocumentResponse[] {
  const predecessorKey = docType === DocType.documentRow ? 'predecessor_id' : 'predecessorId';
  const successorKey = docType === DocType.documentRow ? 'successor_id' : 'successorId';
  const storyIdKey = docType === DocType.documentRow ? 'story_id' : 'storyId';
  const documentIdKey = docType === DocType.documentRow ? 'document_id' : 'documentId';

  return Array.from({ length }, (_, i) => ({
    ...DocTypeMap[docType],
    [storyIdKey]: storyId,
    [predecessorKey]: i > 0 ? `${docType}-${storyId}-${i - 1}` : null,
    [successorKey]: i < length - 1 ? `${docType}-${storyId}-${i + 1}` : null,
    [documentIdKey]: `${docType}-${storyId}-${i}`,
  })) as DecompressedDocumentRow[] | DocumentResponse[];
}

// A helper to mock a list of stories
export function mockStoryList(
  docType: DocType.storyRow,
  cannonId: string,
  documentCounts: number[],
): StoryRow[];
export function mockStoryList(
  docType: DocType.storyResponse,
  cannonId: string,
  documentCounts: number[],
): StoryResponse[];
export function mockStoryList(
  docType: DocType.storyRow | DocType.storyResponse,
  cannonId: string,
  documentCounts: number[],
): StoryRow[] | StoryResponse[] {
  const length = documentCounts.length;
  const predecessorKey = docType === DocType.storyRow ? 'predecessor_id' : 'predecessorId';
  const successorKey = docType === DocType.storyRow ? 'successor_id' : 'successorId';
  const cannonIdKey = docType === DocType.storyRow ? 'cannon_id' : 'cannonId';
  const storyIdKey = docType === DocType.storyRow ? 'story_id' : 'storyId';

  return Array.from({ length }, (_, i) => {
    const storyId = `${docType}-${cannonId}-${i}`;
    const documents =
      docType === DocType.storyRow
        ? mockDocList(DocType.documentRow, documentCounts[i]!, storyId)
        : mockDocList(DocType.documentResponse, documentCounts[i]!, storyId);
    return {
      ...DocTypeMap[docType],
      [cannonIdKey]: cannonId,
      [storyIdKey]: storyId,
      [predecessorKey]: i > 0 ? `${docType}-${cannonId}-${i - 1}` : null,
      [successorKey]: i < length - 1 ? `${docType}-${cannonId}-${i + 1}` : null,
      documents,
    };
  }) as StoryRow[] | StoryResponse[];
}

// A helper to check the structure of a document and or story list
// If check is done on a list of stories, the structure of each story's documents are checked as well
// A structure is valid if every element in the linked list is strongly connected with no breaks
export function checkDocListStructure(
  docList: StoryRowWithDocuments[],
  docType: DocType.storyRow,
): boolean;
export function checkDocListStructure(
  docList: StoryResponse[],
  docType: DocType.storyResponse,
): boolean;
export function checkDocListStructure(
  docList: DecompressedDocumentRow[],
  docType: DocType.documentRow,
): boolean;
export function checkDocListStructure(
  docList: DocumentResponse[],
  docType: DocType.documentResponse,
): boolean;
export function checkDocListStructure(
  docList: (StoryResponse | StoryRowWithDocuments | DocumentResponse | DecompressedDocumentRow)[],
  docType:
    | DocType.storyRow
    | DocType.storyResponse
    | DocType.documentRow
    | DocType.documentResponse,
): boolean {
  const indexIds =
    docType === DocType.storyRow || docType === DocType.documentRow
      ? {
          predecessorId: 'predecessor_id',
          successorId: 'successor_id',
        }
      : {
          predecessorId: 'predecessorId',
          successorId: 'successorId',
        };
  return docList.every((doc, index) => {
    const typedDoc = doc as unknown as Record<string, unknown>;
    const predecessor = (index > 0 ? docList[index - 1] : null) as unknown as Record<
      string,
      unknown
    > | null;
    const successor = (index < docList.length - 1 ? docList[index + 1] : null) as unknown as Record<
      string,
      unknown
    > | null;
    const nestedDocumentsChecked: boolean = !Object.prototype.hasOwnProperty.call(doc, 'documents')
      ? true
      : docType === DocType.storyRow
        ? checkDocListStructure((doc as StoryRowWithDocuments).documents, DocType.documentRow)
        : checkDocListStructure((doc as StoryResponse).documents, DocType.documentResponse);
    const predecessorId =
      predecessor?.['document_id'] ??
      predecessor?.['documentId'] ??
      predecessor?.['story_id'] ??
      predecessor?.['storyId'] ??
      null;
    const successorId =
      successor?.['document_id'] ??
      successor?.['documentId'] ??
      successor?.['story_id'] ??
      successor?.['storyId'] ??
      null;
    return (
      (typedDoc[indexIds.predecessorId] ?? null) === predecessorId &&
      (typedDoc[indexIds.successorId] ?? null) === successorId &&
      nestedDocumentsChecked
    );
  });
}

// See example below for how to use document matrix
export type DocumentMatrix = number[][];
// The following matrix creates 5 cannons
const defaultDocumentMatrix: DocumentMatrix = [
  // 1st cannon has 5 stories with 0, 1, 2, 3, and 4 documents in each respective story
  [0, 1, 2, 3, 4],
  // 2nd cannon has 3 stories with no documents in any story
  [0, 0, 0],
  // 3rd cannon has 4 stories with 5, 6, 7, and 8 documents in each respective story
  [5, 6, 7, 8],
  // 4th cannon has 4 stories with 1 documents in all stories
  [1, 1, 1, 1],
  // 5th cannon has 4 stories with 11, 22, 33, and 44 documents in each respective story
  [11, 22, 33, 44],
];

// A helper to mock a legacy (all cannons that belong to a single user)
export const mockLegacy = (
  documentMatrix: DocumentMatrix = defaultDocumentMatrix,
): CannonRowWithStories[] => {
  return documentMatrix.map((stories, index) => ({
    ...MOCK_CANNON,
    cannon_id: 'cannon-' + (index + 1),
    stories: mockStoryList(DocType.storyRow, 'cannon-' + (index + 1), stories),
  }));
};

// A helper to mock a legacy (all cannons that belong to a single user) response
export const mockLegacyResponse = (
  documentMatrix: DocumentMatrix = defaultDocumentMatrix,
): CannonResponse[] => {
  return documentMatrix.map((stories, index) => ({
    ...MOCK_CANNON_RESPONSE,
    cannonId: 'cannon-' + (index + 1),
    stories: mockStoryList(DocType.storyResponse, 'cannon-' + (index + 1), stories),
  }));
};

// A helper to check the structure of a legacy (all cannons that belong to a single user)
// Any stories within a cannon also have their structure's checked
// Any documents within any stories also have their structure checked
// A structure is valid if every element in the linked list is strongly connected with no breaks
export const checkLegacyStructure = (
  legacy: CannonRowWithStories[] | CannonResponse[],
  docType: DocType.cannonRow | DocType.cannonResponse,
): boolean =>
  legacy.every((cannon: CannonRowWithStories | CannonResponse) => {
    if (docType === DocType.cannonRow) {
      return checkDocListStructure(cannon.stories as StoryRowWithDocuments[], DocType.storyRow);
    }
    return checkDocListStructure(cannon.stories as StoryResponse[], DocType.storyResponse);
  });
