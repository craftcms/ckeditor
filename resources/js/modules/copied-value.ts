import * as Craft from '@craftcms/cp';

/** The control whose copied values are previewed. */
const COMPONENT = 'ckeditor:editor';

/** The most lines a preview shows, as many as the control panel’s table previews show rows. */
const PREVIEW_LINES = 5;

/** The elements a preview shows a line for: nested entries, and the blocks of text that don’t hold others. */
const LINE_SELECTOR = 'craft-entry, p, li, h1, h2, h3, h4, h5, h6, pre, tr';

type CardHtml = {entryId: number; cardHtml: string};

type CopiedValue = {
  value: unknown;
  props?: {cards?: CardHtml[]} | null;
};

/**
 * Parses HTML in a template, where nothing in it loads or runs.
 */
function parse(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;

  return template.content;
}

/**
 * The node’s text, with its whitespace collapsed.
 */
function text(node: Node): string {
  return node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

/**
 * A nested entry, as a badge labeled with the heading of the card it was copied with, as the control panel previews
 * copied options.
 */
function entryBadge(entry: Element, cards: CardHtml[]): HTMLElement {
  const entryId = entry.getAttribute('data-entry-id');
  const card = cards.find((card) => String(card.entryId) === entryId);
  const heading = card
    ? parse(card.cardHtml).querySelector('.card-heading')
    : null;

  const badge = document.createElement('craft-badge');
  badge.setAttribute('fill', 'gray');
  badge.toggleAttribute('no-prefix', true);
  badge.append((heading && text(heading)) || Craft.t('Entry', {}, 'app'));

  return badge;
}

/**
 * Previews the HTML’s first lines as their text, with nested entries as badges. The copied value could have been
 * changed by any script on the site, so only its text is drawn, in elements of our own.
 */
function previewValue({value, props}: CopiedValue): Node | null {
  if (typeof value !== 'string') {
    return null;
  }

  const lines = [...parse(value).querySelectorAll(LINE_SELECTOR)]
    .filter(
      (element) =>
        element.localName === 'craft-entry' ||
        (!element.querySelector(LINE_SELECTOR) && text(element)),
    )
    .slice(0, PREVIEW_LINES)
    .map((element) => {
      const line = document.createElement('div');

      if (element.localName === 'craft-entry') {
        line.append(entryBadge(element, props?.cards ?? []));
      } else if (element instanceof HTMLTableRowElement) {
        line.textContent = [...element.cells].map(text).join(' ');
      } else {
        line.textContent = text(element);
      }

      return line;
    });

  if (!lines.length) {
    return null;
  }

  // An outlined pane, as the control panel shows copied text
  const pane = document.createElement('craft-pane');
  pane.className = 'copied-notification-pane';
  pane.setAttribute('appearance', 'outline');
  pane.setAttribute('padding', 'md');
  pane.append(...lines);

  return pane;
}

/**
 * Registers the preview of values copied from the CKEditor control with the control panel, while it boots.
 */
export function registerCopiedValuePreview(cp: any): void {
  cp.$ui.registerValuePreview(COMPONENT, previewValue);
}
