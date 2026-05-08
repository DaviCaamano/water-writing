import {
  BillingRow,
  CannonRow,
  CannonRowWithStories,
  DecompressedDocumentRow,
  StoryRow,
  StoryRowWithDocuments,
} from '#types/database';
import {
  BillingResponse,
  CannonResponse,
  DocumentResponse,
  StoryResponse,
} from '#types/shared/response';
import { toCamelCase } from '#utils/to-camel-case';
import { orderLinkedDocs } from '#utils/order-linked-docs';

export function mapDbRow<T extends object[], R extends object[] = Record<string, unknown>[]>(
  obj: T,
): R;
export function mapDbRow<T extends object, R extends object = Record<string, unknown>>(obj: T): R;
export function mapDbRow<T extends object | object[], R extends object | object[] = object>(
  obj: T,
): R {
  if (obj === null || typeof obj !== 'object') {
    return obj as R;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => mapDbRow(item)) as R;
  }

  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const camelCaseKey = toCamelCase(key);

    if (value !== null && typeof value === 'object') {
      converted[camelCaseKey] = mapDbRow(value as Record<string, unknown>);
    } else {
      converted[camelCaseKey] = value;
    }
  }

  return converted as R;
}

export const mapBilling = (billing: BillingRow): BillingResponse =>
  mapDbRow<BillingRow, BillingResponse>(billing);

export const mapDocumentResponse = (row: DecompressedDocumentRow): DocumentResponse =>
  mapDbRow<DecompressedDocumentRow, DocumentResponse>(row);

export const mapStoryResponse = (
  row: StoryRow | StoryRowWithDocuments,
  documents: DecompressedDocumentRow[] = [],
): StoryResponse => {
  const docs: DocumentResponse[] = ((row as StoryRowWithDocuments).documents ?? documents)?.map(
    mapDocumentResponse,
  );
  return mapDbRow<StoryRow & { documents: DocumentResponse[] }, StoryResponse>({
    ...row,
    documents: orderLinkedDocs(docs, (doc) => doc.documentId),
  });
};

export const mapCannonResponse = (
  row: CannonRow | CannonRowWithStories,
  stories: StoryRow | StoryRowWithDocuments[] = [],
): CannonResponse => {
  const rowWithStories = ((row as CannonRowWithStories).stories ?? stories)?.map((cannon) =>
    mapStoryResponse(cannon),
  );
  return mapDbRow({ ...row, stories: orderLinkedDocs(rowWithStories, (doc) => doc.storyId) });
};
