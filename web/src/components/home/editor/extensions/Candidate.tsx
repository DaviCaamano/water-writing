import { Node } from '@tiptap/core';

const MATCHES_PROPERTY = 'matches';
export const Candidate = Node.create({
  name: 'candidate',
  group: 'inline',
  inline: true,
  content: 'text*',

  addAttributes() {
    return {
      [MATCHES_PROPERTY]: {
        default: null,
        parseHTML: (element) => element.getAttribute(MATCHES_PROPERTY),
        renderHTML: (attributes) => {
          if (!attributes[MATCHES_PROPERTY]) return {};
          return { [MATCHES_PROPERTY]: attributes[MATCHES_PROPERTY] };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'candidate' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, class: 'candidate' }, 0];
  },
});
