export type EditorStore = EditorState & EditorActions;

export interface EditorState {
  isDirty: boolean;
  lastSaved: Date | null;
  fontSize: number;
  fontFamily: string;
}

export interface EditorActions {
  markDirty: () => void;
  markSaved: () => void;
  setFontSize: (size: number) => void;
  setFontFamily: (font: string) => void;
  resetEditor: () => void;
}
