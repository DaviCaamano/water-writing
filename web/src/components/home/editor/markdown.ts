import { marked } from 'marked';
import TurndownService from 'turndown';

marked.setOptions({ gfm: true, breaks: false });

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
});

turndown.addRule('strikethrough', {
  filter: ['s', 'del'],
  replacement: (content) => `~~${content}~~`,
});

turndown.addRule('taskListWrapper', {
  filter: (node) =>
    node.nodeName === 'UL' && (node as HTMLElement).getAttribute('data-type') === 'taskList',
  replacement: (content) => `\n\n${content.replace(/\n+$/, '')}\n\n`,
});

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

function transformTaskLists(html: string): string {
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
}

export function markdownToHtml(md: string): string {
  if (!md) return '';
  const raw = marked.parse(md, { async: false }) as string;
  return transformTaskLists(raw);
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  return turndown.turndown(html).trim();
}

function escapeHtml(s: string): string {
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
}

export function buildEditorHtml(title: string, body: string): string {
  return `<h1 data-title>${escapeHtml(title)}</h1>${markdownToHtml(body)}`;
}

export function splitEditorHtml(html: string): { title: string; body: string } {
  if (typeof document === 'undefined') return { title: '', body: htmlToMarkdown(html) };
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const titleEl = wrapper.querySelector('h1[data-title]');
  const title = (titleEl?.textContent ?? '').trim();
  titleEl?.remove();
  const body = htmlToMarkdown(wrapper.innerHTML);
  return { title, body };
}
