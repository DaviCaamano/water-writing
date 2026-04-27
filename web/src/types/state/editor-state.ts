import { DocumentResponse } from '#types/shared/response';

export type EditorStore = EditorState & EditorActions;

export interface EditorState {
  documentId: string | null;
  storyId: string | null;
  title: string;
  body: string;
  isDirty: boolean;
  lastSaved: Date | null;
  fontSize: number;
  fontFamily: string;
}

export interface EditorActions {
  setTitle: (title: string) => void;
  setBody: (body: string) => void;
  loadDocument: (doc: Pick<DocumentResponse, 'body' | 'documentId' | 'storyId' | 'title'>) => void;
  markSaved: () => void;
  setFontSize: (size: number) => void;
  setFontFamily: (font: string) => void;
  resetEditor: () => void;
}
