---
name: upgrading-ckeditor
description: Upgrades the bundled CKEditor 5 (the ckeditor5 npm package) in the craftcms/ckeditor plugin and keeps its CSS fast, including the PostCSS selector rewrites in resources/assets/ckeditor/postcss-selector-rewrites.js. Use when bumping CKEditor, when the field build fails in postcss-selector-rewrites.js, or when CKEditor's CSS changes.
---

# Upgrading CKEditor

The field ships CKEditor's CSS inside `resources/assets/ckeditor/dist/ckeditor.css`, built by `resources/assets/ckeditor/vite.config.js`. Some upstream rules make Chromium restyle hundreds of elements whenever anything is added to the page ([#673](https://github.com/craftcms/ckeditor/issues/673)). `postcss-selector-rewrites.js` rewrites them at build time and fails the build when a CKEditor update adds or changes one. Most upgrade work is keeping that plugin in step with upstream.

## Steps

1. Raise the `ckeditor5` floor in `package.json` to the new version and run `npm install`. Raise `@ckeditor/ckeditor5-dev-translations` and `@ckeditor/ckeditor5-inspector` too when CKEditor's release notes require it.
2. Rebuild from a clean `dist/lib`, since `cp -r` nests directories into an existing one:

   ```sh
   rm -rf resources/assets/ckeditor/dist/lib && npm run build
   ```

   `git status` must not show `dist/lib/browser/` or `dist/lib/translations/translations/`.
3. If the build fails in `postcss-selector-rewrites.js`, follow "Fixing a failed build" below.
4. Read CKEditor's changelog for CSS changes to anything `resources/assets/ckeditor/src/ckeditor5-craftcms.css` overrides: `--ck-*` custom properties, class names, and the widget, toolbar, and link form selectors. Update the overrides that no longer match.
5. Check that `CkeditorAssets::editorAssetUrls()` in `src/Support/CkeditorAssets.php` still loads only `ckeditor/ckeditor.css`. That file already includes all of `ckeditor5.css`. Loading `lib/ckeditor5.css` as well puts every rule on the page twice.
6. Measure insertion cost before and after, as in "Measuring" below. After the upgrade, an insertion on an entry with CKEditor fields should restyle 1 element, the same as with CKEditor's CSS blocked.
7. Add a changelog entry in the repo's usual form, such as `- Updated CKEditor to 48.6.0.`, and commit the rebuilt `dist/` files with the source changes.

## Fixing a failed build

The plugin fails the build in two cases.

**"CKEditor's CSS no longer has `<selector>`."** Upstream changed or removed a rule that `REWRITES` targets. Find the new form of the rule in `node_modules/ckeditor5/dist/ckeditor5.css`. If it still has the problem, update the key (written as it appears there, with whitespace collapsed to single spaces) and its replacement. If upstream fixed it, delete the entry. For the three `--craft-ck-widget-has-hovered-table` entries, also delete the custom property in `ckeditor5-craftcms.css` once no entry uses it.

**"This selector has … :has() …"** A rule matches a pattern that makes Chromium restyle much of the page on every insertion. Add a `REWRITES` entry for it. These rewrites have worked:

| Upstream | Rewrite |
|---|---|
| `:not()` inside `:has()`: `.a:has(.b:not(.c))` | Match positively inside and negate outside: `.a:has(.b):not(:has(.b.c))` |
| A type selector inside `:has()`: `.a:has(> div[x])` | Drop the type selector: `.a:has(> [x])` |
| `:has()` on an ancestor: `.a:not(:has(.b)) > .c` | Move the condition to the subject: `.a > .c:not(.b ~ *)`, when the DOM order allows it |
| `:has()` on an ancestor, with no subject-only form | Set a custom property on the `:has()` subject in `ckeditor5-craftcms.css`, then wrap the rule, without `:has()`, in `@container style(--name: 1)`. See the widget entries. |

The plugin doesn't catch one more pattern: an `:is()` holding descendant selectors, followed by `> * + *`. `[dir=ltr] :is(.a .b, .a .c) > * + *` restyled ~318 elements until it was written out as `[dir=ltr] .a .b > * + *, [dir=ltr] .a .c > * + *`. Search the new CSS for `) > * + *` and `)>*+*` after an upgrade.

Keep each replacement's specificity at least as high as the rule it replaces, so it still wins over the same rules. Repeat a class (`.ck-widget.ck-widget`) to make up for a removed `:has()` argument, and note any change in a comment on the entry.

Then check that the rewrite keeps the same styles. Build a small DOM that both the original and the rewritten selector apply to, in every state that matters (for `:hover`, use `CSS.forcePseudoState` over CDP). Load the old and new `ckeditor.css` in turn and compare the computed values of the properties the rule sets. Turn off transitions on that DOM first (`* { transition: none !important }`), or you'll read values partway through a transition.

## Measuring

Use the plugin's workbench, with the `craftcms/cms` version the plugin targets:

1. `composer workbench:setup`, then `composer serve` (port 8125). Sign in as `admin` with `WORKBENCH_ADMIN_PASSWORD` from `workbench/.env`.
2. After each rebuild, copy the built files into the workbench with `cp -r resources/assets/ckeditor/dist/. workbench/public/vendor/craftcms/ckeditor/ckeditor/`. The browser caches the CSS, so reload without the cache.
3. Open an entry with several CKEditor fields that use many toolbar buttons and contain tables and media embeds. The seeded "Autumn in Brussels" entry has two fields with few buttons, which hides some rules' cost.
4. Run the bundled script with the browser's CDP URL (`agent-browser get cdp-url`) and a substring of the entry's URL:

   ```sh
   S=.agents/skills/upgrading-ckeditor/scripts/measure-insertion.mjs
   node $S "$CDP_URL" entries/articles/2                 # current CSS
   node $S "$CDP_URL" entries/articles/2 --block         # CKEditor's CSS blocked
   node $S "$CDP_URL" entries/articles/2 --block --inject '<one rule>'
   node $S "$CDP_URL" entries/articles/2 --block --inject @path/to/old/ckeditor.css
   ```

   Each line prints the elements restyled by one inserted `<div>` and the median insertion time.

To find which rules cost the most, run `--block --inject` with one rule at a time. Any single `:has()` rule costs about 2 elements and 1 ms, and that's fine.

Measure on a fresh load every time. Once a rule has matched, setting `sheet.disabled`, changing a rule's `selectorText`, or removing the rule doesn't remove its cost, so toggling rules on a loaded page blames the wrong rules. The script reloads the page for each measurement for that reason.
