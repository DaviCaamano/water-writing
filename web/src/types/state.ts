import { LoginResponse } from '#types/shared/response';
import type { EditorTheme } from '~types/story';

export type EditorStore = EditorState & EditorActions;

export interface UserState extends Omit<LoginResponse, 'token' | 'userId'> {
  isLoggedIn: boolean;
  token: string | null;
  userId: string | null;
}

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
  saveDocument: () => Promise<void>;
  loadDocument: (doc: { id: string; title: string; body: string; storyId: string }) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (font: string) => void;
  setTheme: (theme: EditorTheme) => void;
  resetEditor: () => void;
}

