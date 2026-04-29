import { Node } from '@tiptap/core';

export const TitleDocument = Node.create({
  name: 'doc',
  topNode: true,
  content: 'title block+',
});

export const Title = Node.create({
  name: 'title',
  content: 'text*',
  marks: '',
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: 'h1[data-title]' }];
  },

  renderHTML() {
    return ['h1', { 'data-title': '' }, 0];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { $from } = editor.state.selection;
        if ($from.parent.type.name !== this.name) return false;
        const after = $from.after();
        const nextNode = editor.state.doc.nodeAt(after);
        if (!nextNode) {
          editor
            .chain()
            .insertContentAt(after, { type: 'paragraph' })
            .setTextSelection(after + 1)
            .focus()
            .run();
        } else {
          editor
            .chain()
            .setTextSelection(after + 1)
            .focus()
            .run();
        }
        return true;
      },
    };
  },
});
