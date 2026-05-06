import { Node } from '@tiptap/core';

const ENTITY_ID_PROPERTY = 'entity-id';
export const Entity = Node.create({
  name: 'entity',
  group: 'inline',
  inline: true,
  content: 'text*',

  addAttributes() {
    return {
      [ENTITY_ID_PROPERTY]: {
        default: null,
        parseHTML: (element) => element.getAttribute(ENTITY_ID_PROPERTY),
        renderHTML: (attributes) => {
          if (!attributes[ENTITY_ID_PROPERTY]) return {};
          return { [ENTITY_ID_PROPERTY]: attributes[ENTITY_ID_PROPERTY] };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'entity' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, class: 'entity' }, 0];
  },
});
