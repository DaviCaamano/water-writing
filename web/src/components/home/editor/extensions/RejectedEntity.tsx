import { Node } from '@tiptap/core';

export const RejectedEntity = Node.create({
  name: 'rejected-entity',
  group: 'inline',
  inline: true,
  content: 'text*',

  parseHTML() {
    return [{ tag: 'rejected-entity' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, class: 'rejected-entity' }, 0];
  },
});
