/**
 * Rewrites CKEditor selectors that make Chromium restyle much of the page
 * whenever any element is added or removed anywhere
 * (https://github.com/craftcms/ckeditor/issues/673):
 *
 * - `:has()` in a compound that a combinator follows, as in `.a:has(.b) > .c`.
 *   Chromium can't tell which `.a` an insertion affects, so it restyles every
 *   `.c`.
 * - `:not()`, `*`, or a type selector inside `:has()`, as in
 *   `:has(.a:not(.b))` or `:has(> div)`. They match most inserted elements.
 * - `:is()` with combinators inside, followed by `> * + *`.
 *
 * The plugin fails the build when a CKEditor update adds a new rule with
 * `:has()` like the first two, or changes one of these so it's no longer
 * rewritten. Measure on a fresh page load: once a rule has matched, removing
 * it doesn't remove its cost.
 */

/**
 * The upstream selectors to rewrite, keyed with whitespace collapsed, and what
 * replaces each one. Replacements keep the original specificity unless noted,
 * so they still win over the rules they did.
 *
 * The widget rules are wrapped in a style query on
 * `--craft-ck-widget-has-hovered-table`, which ckeditor5-craftcms.css sets on
 * widgets that contain a hovered table. The repeated `.ck-widget` makes up for
 * the specificity of the removed `:has(.ck-widget.table:hover)`.
 */
const REWRITES = new Map([
  [
    // one more class of specificity, but the only rule it competes with is the one for hidden back buttons
    '.ck.ck-form__header:has(.ck-button-back:not(.ck-hidden))',
    {
      selector:
        '.ck.ck-form__header:has(.ck-button-back):not(:has(.ck-button-back.ck-hidden))',
    },
  ],
  [
    // one less type selector of specificity, which still beats `.ck-content .media`
    '.ck-content .media:has( > div[data-oembed-url*="open.spotify.com"])',
    {
      selector:
        '.ck-content .media:has(> [data-oembed-url*="open.spotify.com"])',
    },
  ],
  ...['ltr', 'rtl'].map((dir) => [
    `[dir="${dir}"] :is(.ck.ck-find-and-replace-form .ck-find-and-replace-form__inputs, .ck.ck-find-and-replace-form .ck-find-and-replace-form__actions) > * + *`,
    {
      selector: `[dir="${dir}"] .ck.ck-find-and-replace-form .ck-find-and-replace-form__inputs > * + *, [dir="${dir}"] .ck.ck-find-and-replace-form .ck-find-and-replace-form__actions > * + *`,
    },
  ]),
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

/**
 * Returns the first `:not()`, `*`, or type selector inside a `:has()`
 * argument, or null. Skips strings, attribute selectors, and escapes.
 *
 * @param {string} selector
 * @returns {string | null}
 */
export function costlyHasArgument(selector) {
  // One entry per open parenthesis: whether it holds selectors inside a :has() argument.
  const stack = [];
  for (let i = 0; i < selector.length; i++) {
    const char = selector[i];
    const inHas = stack.at(-1) === true;
    if (char === '\\') {
      i++;
    } else if (char === '"' || char === "'") {
      i = selector.indexOf(char, i + 1);
    } else if (char === '[') {
      i = selector.indexOf(']', i);
    } else if (char === '(') {
      const before = selector.slice(0, i);
      stack.push(
        /(?<!\\):has$/i.test(before) ||
          (inHas && /(?<!\\):(is|where|not)$/i.test(before)),
      );
    } else if (char === ')') {
      stack.pop();
    } else if (inHas) {
      if (char === '*') {
        return '*';
      }
      if (/^:not\(/i.test(selector.slice(i, i + 5))) {
        return ':not()';
      }
      // a name that starts a compound, rather than following `.`, `#`, `:`, or `-`
      const type = /^[a-z][\w-]*/i.exec(selector.slice(i));
      if (type && /[\s(>+~,]/.test(selector[i - 1])) {
        return type[0];
      }
    }
  }
  return null;
}

/** @returns {import('postcss').Plugin} */
export default function selectorRewrites() {
  return {
    postcssPlugin: 'craft-ckeditor-selector-rewrites',
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
            'This selector has :has() outside its subject, which makes Chromium restyle the page on every DOM insertion. Add a rewrite for it to postcss-selector-rewrites.js.',
          );
        } else if (costlyHasArgument(rule.selector)) {
          throw rule.error(
            `This selector has ${costlyHasArgument(rule.selector)} inside :has(), which makes Chromium restyle the page on every DOM insertion. Add a rewrite for it to postcss-selector-rewrites.js.`,
          );
        }
      });

      // ckeditor5.css is the only file with the upstream rules.
      if (root.source?.input.file?.endsWith('/ckeditor5.css')) {
        for (const selector of REWRITES.keys()) {
          if (!found.has(selector)) {
            throw new Error(
              `postcss-selector-rewrites.js: CKEditor's CSS no longer has \`${selector}\`. Update the rewrite for it.`,
            );
          }
        }
      }
    },
  };
}
selectorRewrites.postcss = true;
