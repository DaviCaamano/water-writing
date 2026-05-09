import { DocumentResponse, StoryResponse, CannonResponse } from '#types/shared/response';
import { orderLinkedDocs } from '#utils/story/order-linked-docs';
import { Document, Story, Cannon } from '~types/story';

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
    cannonId: response.cannonId,
    title: response.title,
    predecessorId: response.predecessorId,
    successorId: response.successorId,
    documents: orderLinkedDocs(response.documents, (doc) => doc.documentId).map(mapDocumentState),
  };
};

export const mapCannonState = (response: CannonResponse): Cannon => {
  return {
    id: response.cannonId,
    userId: response.userId,
    title: response.title,
    stories: orderLinkedDocs(response.stories, (doc) => doc.storyId).map(mapStoryState),
  };
};
