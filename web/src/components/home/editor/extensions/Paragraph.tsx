'use client';

import { mergeAttributes, Node } from '@tiptap/core';
import { NodeViewContent, NodeViewProps, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';

const ENTITY_TAG_PATTERN = /<entity\b[^>]*>.*?<\/entity>/i;

function ParagraphView({ node }: NodeViewProps) {
  const containsEntityTag = ENTITY_TAG_PATTERN.test(node.textContent);

  if (containsEntityTag) {
    return (
      <NodeViewWrapper as='div' className='paragraph-nodeview'>
        <div className='boop'>
          <NodeViewContent className='editor-line' />
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as='div' className='paragraph-nodeview'>
      <NodeViewContent className='editor-line' />
    </NodeViewWrapper>
  );
}

export const Paragraph = Node.create({
  name: 'paragraph',
  group: 'block',
  content: 'inline*',
  parseHTML() {
    return [{ tag: 'p' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes, { class: 'editor-line' }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ParagraphView);
  },
});
