import { DocumentResponse, StoryResponse, WorldResponse } from '#types/shared/response';
import { orderLinkedDocs } from '#utils/order-linked-docs';
import { Document, Story, World } from '~types/story';

export const mapDocumentState = (response: DocumentResponse): Document => {
  return {
    id: response.documentId,
    storyId: response.storyId,
    title: response.title,
    body: response.body,
    predecessorId: response.predecessorId,
    successorId: response.successorId,
  };
};

export const mapStoryState = (response: StoryResponse): Story => {
  return {
    id: response.storyId,
    worldId: response.worldId,
    title: response.title,
    predecessorId: response.predecessorId,
    successorId: response.successorId,
    documents: orderLinkedDocs(response.documents, (doc) => doc.documentId).map(mapDocumentState),
  };
};

export const mapWorldState = (response: WorldResponse): World => {
  return {
    id: response.worldId,
    userId: response.userId,
    title: response.title,
    stories: orderLinkedDocs(response.stories, (doc) => doc.storyId).map(mapStoryState),
  };
};

