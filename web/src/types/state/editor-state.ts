import type { EditorTheme } from '~types/story';

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
  theme: EditorTheme;
}

export interface EditorActions {
  setTitle: (title: string) => void;
  setBody: (body: string) => void;
  loadDocument: (doc: { id: string; title: string; body: string; storyId: string }) => void;
  markSaved: () => void;
  setFontSize: (size: number) => void;
  setFontFamily: (font: string) => void;
  setTheme: (theme: EditorTheme) => void;
  resetEditor: () => void;
}
