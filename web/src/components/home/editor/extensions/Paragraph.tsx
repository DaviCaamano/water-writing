'use client';

import { mergeAttributes, Node } from '@tiptap/core';

export interface ParagraphOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraph: {
      setParagraph: () => ReturnType;
    };
  }
}

const EMPTY_PARAGRAPH_MARKDOWN = '&nbsp;';
const NBSP_CHAR = '\u00A0';

export const Paragraph = Node.create<ParagraphOptions>({
  name: 'paragraph',

  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'editor-line',
      },
    };
  },

  group: 'block',

  content: 'inline*',

  parseHTML() {
    return [{ tag: 'p' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  parseMarkdown: (token, helpers) => {
    const tokens = token.tokens || [];

    const firstToken = tokens[0];
    if (tokens.length === 1 && firstToken && firstToken.type === 'image') {
      return helpers.parseChildren([firstToken]);
    }

    const content = helpers.parseInline(tokens);

    const hasExplicitEmptyParagraphMarker =
      tokens.length === 1 &&
      firstToken &&
      firstToken.type === 'text' &&
      (firstToken.raw === EMPTY_PARAGRAPH_MARKDOWN ||
        firstToken.text === EMPTY_PARAGRAPH_MARKDOWN ||
        firstToken.raw === NBSP_CHAR ||
        firstToken.text === NBSP_CHAR);

    const firstContent = content[0];
    if (
      hasExplicitEmptyParagraphMarker &&
      content.length === 1 &&
      firstContent &&
      firstContent.type === 'text' &&
      (firstContent.text === EMPTY_PARAGRAPH_MARKDOWN || firstContent.text === NBSP_CHAR)
    ) {
      return helpers.createNode('paragraph', undefined, []);
    }

    return helpers.createNode('paragraph', undefined, content);
  },

  renderMarkdown: (node, h, ctx) => {
    if (!node) {
      return '';
    }

    const content = Array.isArray(node.content) ? node.content : [];

    if (content.length === 0) {
      const previousContent = Array.isArray(ctx?.previousNode?.content) ? ctx.previousNode.content : [];
      const previousNodeIsEmptyParagraph =
        ctx?.previousNode?.type === 'paragraph' && previousContent.length === 0;

      return previousNodeIsEmptyParagraph ? EMPTY_PARAGRAPH_MARKDOWN : '';
    }

    return h.renderChildren(content);
  },

  addCommands() {
    return {
      setParagraph:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-0': () => this.editor.commands.setParagraph(),
    };
  },
});
