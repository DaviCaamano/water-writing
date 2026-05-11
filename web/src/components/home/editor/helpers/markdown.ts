import { marked } from 'marked';
import DOMPurify from 'dompurify';
import TurndownService from 'turndown';

marked.setOptions({ gfm: true, breaks: false });

const MAX_EDITOR_LINE_LENGTH = 65;

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
});

// Handle Strikethrough tags and convert to markdown
turndown.addRule('strikethrough', {
  filter: ['s', 'del'],
  replacement: (content) => `~~${content}~~`,
});

// Handle List tags and convert to markdown tasklists
turndown.addRule('taskListWrapper', {
  filter: (node) =>
    node.nodeName === 'UL' && (node as HTMLElement).getAttribute('data-type') === 'taskList',
  replacement: (content) => `\n\n${content.replace(/\n+$/, '')}\n\n`,
});

// Handle List Item tags and convert to markdown tasklist items
turndown.addRule('taskListItem', {
  filter: (node) => {
    if (node.nodeName !== 'LI') return false;
    const parent = node.parentNode as HTMLElement | null;
    return parent?.getAttribute('data-type') === 'taskList';
  },
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const checked = el.getAttribute('data-checked') === 'true';
    const textContainer = el.querySelector(':scope > div') ?? el;
    const text = (textContainer.textContent ?? '').trim().replace(/\n+/g, ' ');
    return `- [${checked ? 'x' : ' '}] ${text}\n`;
  },
});

// Convert HTML check lists to markdown task lists
const transformTaskLists = (html: string): string => {
  if (!html.includes('type="checkbox"')) return html;
  if (typeof document === 'undefined') return html;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  wrapper.querySelectorAll('ul').forEach((ul) => {
    const items = Array.from(ul.children).filter((c) => c.tagName === 'LI') as HTMLLIElement[];
    const isTaskList =
      items.length > 0 && items.every((li) => li.querySelector(':scope > input[type="checkbox"]'));
    if (!isTaskList) return;
    ul.setAttribute('data-type', 'taskList');
    items.forEach((li) => {
      const checkbox = li.querySelector(
        ':scope > input[type="checkbox"]',
      ) as HTMLInputElement | null;
      if (!checkbox) return;
      const checked = checkbox.checked || checkbox.hasAttribute('checked');
      checkbox.remove();
      li.setAttribute('data-type', 'taskItem');
      li.setAttribute('data-checked', checked ? 'true' : 'false');
      const remaining = li.innerHTML.trimStart();
      li.innerHTML =
        `<label><input type="checkbox"${checked ? ' checked' : ''}><span></span></label>` +
        `<div>${remaining.startsWith('<p>') ? remaining : `<p>${remaining}</p>`}</div>`;
    });
  });
  return wrapper.innerHTML;
};

const sanitize = (html: string): string => {
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
};

export const markdownToHtml = (md: string): string => {
  if (!md) return '';
  const raw = marked.parse(md, { async: false }) as string;
  return transformTaskLists(sanitize(raw));
};

export const htmlToMarkdown = (html: string): string => {
  if (!html) return '';
  return turndown.turndown(html).trim();
};

const escapeHtml = (s: string): string => {
  if (typeof document === 'undefined') {
    return s.replace(/[&<>"']/g, (c) => {
      switch (c) {
        case '&':
          return '&amp;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '"':
          return '&quot;';
        default:
          return '&#39;';
      }
    });
  }
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
};

// Break text into lines that fit within the specified maximum character length
const getTextLines = (block: string, maxLength = MAX_EDITOR_LINE_LENGTH): string[] => {
  const text = block.replace(/\s+/g, ' ').trim();

  if (!text) {
    return [];
  }

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!word) continue;

    if (!currentLine) {
      currentLine = word;
      continue;
    }

    const nextLine = `${currentLine} ${word}`;
    if (nextLine.length <= maxLength) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

/*
  Checks if a block of text is a structured markdown block.
  A structured markdown block is a block of text that starts with a markdown syntax character.
  Examples of structured markdown blocks:
  - Code blocks (```)
  - Headings (##, ###, ...)
  - Blockquotes (>)
  - Lists (*, -, ...)
  - Numbered lists (1., 2., ...)
  - Bold, italic, and strikethrough text (**, *, ~~)
  - Horizontal rules (---, ***, _)
 */
const isStructuredMarkdownBlock = (block: string): boolean => {
  const trimmed = block.trim();

  return (
    /^(```|~~~)/.test(trimmed) || // Code blocks (```)
    /^(#{1,6})\s/.test(trimmed) || // Headings (##, ###, ...)
    /^>\s/.test(trimmed) || // Blockquotes (>)
    /^([-+*])\s/.test(trimmed) || // Lists (*, -, ...)
    /^\d+\.\s/.test(trimmed) || // Numbered lists (1., 2., ...)
    /^(-{3,}|\*{3,}|_{3,})$/.test(trimmed) || // Bold, italic, and strikethrough text (**, *, ~~)
    /^\|/.test(trimmed) // Horizontal rules (---, ***, _)
  );
};

/*
  Performs the following normalizations to the editor text
  - Normalizes line endings - converts \r\n and \r to \n, trims whitespace
  - Word wrap text paragraphs before or at 65 characters.
 */
export const normalizeEditorBody = (body: string, maxLength = MAX_EDITOR_LINE_LENGTH): string => {
  const normalized = body.replace(/\r\n?/g, '\n').trim();

  if (!normalized) {
    return '';
  }

  const blocks = normalized.split(/\n{2,}/);
  const outputBlocks: string[] = [];

  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    if (isStructuredMarkdownBlock(trimmedBlock)) {
      outputBlocks.push(trimmedBlock);
      continue;
    }

    outputBlocks.push(...getTextLines(trimmedBlock, maxLength));
  }

  return outputBlocks.join('\n\n');
};

// Takes a title and body string and converts them into an HTML string that TipTap loads
// as its document.
// Inverse of splitEditorHtml
export const buildEditorHtml = (title: string, body: string): string => {
  const bodyHtml = markdownToHtml(normalizeEditorBody(body)).trim();
  const normalizedBodyHtml = bodyHtml.length > 0 ? bodyHtml : '<p></p>';
  return `<h1 data-title>${escapeHtml(title)}</h1>${normalizedBodyHtml}`;
};

// Takes an HTML string and converts into a title and body string.
// Inverse of buildEditorHtml
export const splitEditorHtml = (html: string): { title: string; body: string } => {
  if (typeof document === 'undefined') return { title: '', body: htmlToMarkdown(html) };
  const wrapper = document.createElement('div');
  wrapper.innerHTML = sanitize(html);
  const titleEl = wrapper.querySelector('h1[data-title]');
  const title = (titleEl?.textContent ?? '').trim();
  titleEl?.remove();
  const body = htmlToMarkdown(wrapper.innerHTML);
  return { title, body };
};
