/**
 * Keeps `:has()` in the subject compound of CKEditor's selectors.
 *
 * When `:has()` sits in a compound that a combinator follows, as in
 * `.a:has(.b) > .c`, Chromium restyles every `.c` on the page whenever any
 * element is added or removed anywhere, because it can't tell which `.a` the
 * change affects. A few upstream CKEditor rules do this, which made every
 * insertion on an element edit page restyle hundreds of elements
 * (https://github.com/craftcms/ckeditor/issues/673).
 *
 * This plugin rewrites those rules so `:has()` only appears in the subject, and
 * fails the build when a CKEditor update adds a new one, or changes one of
 * these so it's no longer rewritten.
 */

/**
 * The upstream selectors to rewrite, and what replaces each one. Replacements
 * keep the original specificity, so they still win over the rules they did.
 *
 * The widget rules are wrapped in a style query on
 * `--craft-ck-widget-has-hovered-table`, which ckeditor5-craftcms.css sets on
 * widgets that contain a hovered table. The repeated `.ck-widget` makes up for
 * the specificity of the removed `:has(.ck-widget.table:hover)`.
 */
const REWRITES = new Map([
  [
    '.ck.ck-button.ck-dropdown-menu-list__nested-menu__button.ck-icon-spacing:not(:has(.ck-button__icon)) > .ck-button__label',
    {
      selector:
        '.ck.ck-button.ck-dropdown-menu-list__nested-menu__button.ck-icon-spacing > .ck-button__label:not(.ck-button__icon ~ *)',
    },
  ],
  [
    '.ck-editor__editable .table.layout-table.ck-widget:has(.ck-widget.table:hover) > .ck-widget__selection-handle',
    {
      selector:
        '.ck-editor__editable .table.layout-table.ck-widget.ck-widget.ck-widget.ck-widget > .ck-widget__selection-handle',
      container: 'style(--craft-ck-widget-has-hovered-table: 1)',
    },
  ],
  [
    '.ck .ck-widget.ck-widget_with-selection-handle:has(.ck-widget.table:hover) > .ck-widget__selection-handle',
    {
      selector:
        '.ck .ck-widget.ck-widget.ck-widget.ck-widget.ck-widget_with-selection-handle > .ck-widget__selection-handle',
      container: 'style(--craft-ck-widget-has-hovered-table: 1)',
    },
  ],
  [
    '.ck .ck-widget:has(.ck-widget.table:hover) > .ck-widget__type-around > .ck-widget__type-around__button',
    {
      selector:
        '.ck .ck-widget.ck-widget.ck-widget.ck-widget > .ck-widget__type-around > .ck-widget__type-around__button',
      container: 'style(--craft-ck-widget-has-hovered-table: 1)',
    },
  ],
]);

/**
 * Returns whether a `:has()` in the selector (list) sits in a compound that a
 * combinator follows, including through `:is()`, `:not()`, and `:where()`, as
 * in `.a:not(:has(.b)) > .c`. Skips strings, attribute selectors, and escapes.
 *
 * @param {string} selector
 * @returns {boolean}
 */
export function hasOutsideSubject(selector) {
  const skip = (i) => {
    const char = selector[i];
    if (char === '\\') {
      return i + 2;
    }
    if (char === '"' || char === "'") {
      let j = i + 1;
      while (j < selector.length && selector[j] !== char) {
        j += selector[j] === '\\' ? 2 : 1;
      }
      return j + 1;
    }
    if (char === '[') {
      return skip.attribute(i);
    }
    return null;
  };
  skip.attribute = (i) => {
    let j = i + 1;
    while (j < selector.length && selector[j] !== ']') {
      j = skip(j) ?? j + 1;
    }
    return j + 1;
  };

  // Unclosed parentheses before each position, so we know whether a comma
  // ends the complex selector or just an argument of :is()/:not()/:where().
  let open = 0;
  for (let i = 0; i < selector.length; ) {
    const next = skip(i);
    if (next !== null) {
      i = next;
      continue;
    }
    if (/^:has\(/i.test(selector.slice(i, i + 5))) {
      if (followedByCombinator(i + 4, open)) {
        return true;
      }
    }
    if (selector[i] === '(') {
      open++;
    } else if (selector[i] === ')') {
      open--;
    }
    i++;
  }
  return false;

  // Scans on from the `(` of a :has() at `start`, which `enclosing` other
  // parentheses surround.
  function followedByCombinator(start, enclosing) {
    let depth = 0;
    let skipArgument = false;
    for (let i = start; i < selector.length; ) {
      const next = skip(i);
      if (next !== null) {
        i = next;
        continue;
      }
      const char = selector[i];
      if (char === '(') {
        depth++;
      } else if (char === ')') {
        depth--;
        if (depth < 0) {
          // Left the :is()/:not()/:where() that holds this :has().
          enclosing--;
          depth = 0;
          skipArgument = false;
        }
      } else if (depth === 0 && !skipArgument && i > start) {
        if (char === ',') {
          if (enclosing === 0) {
            return false;
          }
          skipArgument = true;
        } else if ('>+~'.includes(char)) {
          return true;
        } else if (/\s/.test(char)) {
          const rest = selector.slice(i).trimStart();
          if (rest !== '' && !/^[,)>+~]/.test(rest)) {
            return true;
          }
        }
      }
      i++;
    }
    return false;
  }
}

/** @returns {import('postcss').Plugin} */
export default function hasSubject() {
  return {
    postcssPlugin: 'craft-ckeditor-has-subject',
    Once(root, {AtRule}) {
      const found = new Set();
      root.walkRules((rule) => {
        const selector = rule.selector.replace(/\s+/g, ' ').trim();
        const rewrite = REWRITES.get(selector);
        if (rewrite) {
          found.add(selector);
          const replacement = rule.clone({selector: rewrite.selector});
          if (rewrite.container) {
            const container = new AtRule({
              name: 'container',
              params: rewrite.container,
            });
            container.append(replacement);
            rule.replaceWith(container);
          } else {
            rule.replaceWith(replacement);
          }
        } else if (hasOutsideSubject(rule.selector)) {
          throw rule.error(
            'This selector has :has() outside its subject, which makes Chromium restyle the page on every DOM insertion. Add a rewrite for it to postcss-has-subject.js.',
          );
        }
      });

      // ckeditor5.css is the only file with the upstream rules.
      if (root.source?.input.file?.endsWith('/ckeditor5.css')) {
        for (const selector of REWRITES.keys()) {
          if (!found.has(selector)) {
            throw new Error(
              `postcss-has-subject.js: CKEditor's CSS no longer has \`${selector}\`. Update the rewrite for it.`,
            );
          }
        }
      }
    },
  };
}
hasSubject.postcss = true;
