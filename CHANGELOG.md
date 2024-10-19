# Release Notes for CKEditor for Craft CMS

## 3.10.0 - 2024-10-19

- Image toolbars now include an “Edit Image” button. ([#253](https://github.com/craftcms/ckeditor/issues/253))
- The `ckeditor/convert/redactor` command now ensures that it’s being run interactively.
- CKEditor container divs now have `data-config` attributes, set to the CKEditor config’s handle. ([#284](https://github.com/craftcms/ckeditor/issues/284))
- Fixed a bug where page breaks were being lost.
- Fixed a bug where menus within overflown toolbar items weren’t fully visible. ([#286](https://github.com/craftcms/ckeditor/issues/286))

## 3.9.0 - 2024-08-15

- CKEditor configs created via the `ckeditor/convert` command now allow modifying HTML attributes, classes, and styles within the source view, if the Redactor config included the `html` button. ([#264](https://github.com/craftcms/ckeditor/pull/264), [#263](https://github.com/craftcms/ckeditor/issues/263))
- Added `craft\ckeditor\events\ModifyConfigEvent::$toolbar`. ([#233](https://github.com/craftcms/ckeditor/pull/233))
- Fixed a bug where code blocks created by a Redactor field only had `<pre>` tags with no `<code>` tags inside them. ([#258](https://github.com/craftcms/ckeditor/issues/258))
- Fixed a bug where dropdown menus didn’t have a maximum height. ([#268](https://github.com/craftcms/ckeditor/issues/268))
- Fixed a bug where word counts weren’t handling unicode characters correctly. ([#275](https://github.com/craftcms/ckeditor/issues/275))

## 3.8.3 - 2024-03-28

- Fixed a bug where the `ckeditor/convert` command wasn’t checking for and removing the old `configFile` Redactor setting. ([#199](https://github.com/craftcms/ckeditor/issues/199))

## 3.8.2 - 2024-03-19

- Fixed a bug where the “Insert image” toolbar button wasn’t available when editing CKEditor configs. ([#195](https://github.com/craftcms/ckeditor/issues/195))

## 3.8.1 - 2024-03-06

- CKEditor config edit pages now warn when switching the Config Options setting from JavaScript to JSON if the JavaScript code contains any functions. ([#152](https://github.com/craftcms/ckeditor/issues/152), [#180](https://github.com/craftcms/ckeditor/pull/180))
- Fixed a bug where the “Link to an asset” option was showing up when there weren’t any available volumes with URLs. ([#179](https://github.com/craftcms/ckeditor/issues/179))

## 3.8.0 - 2024-02-21

- Added support for creating anchor links. ([#169](https://github.com/craftcms/ckeditor/discussions/169))
- Improved accessibility for screen readers. ([#74](https://github.com/craftcms/ckeditor/issues/74), [#166](https://github.com/craftcms/ckeditor/pull/166))
- Fixed a bug where resized images weren’t getting updated `width` and `height` attributes. ([#165](https://github.com/craftcms/ckeditor/pull/165))
- Fixed JavaScript warnings. ([#168](https://github.com/craftcms/ckeditor/issues/168), [#171](https://github.com/craftcms/ckeditor/pull/171))

## 3.7.3 - 2024-02-08

- Fixed a JavaScript error. ([#161](https://github.com/craftcms/ckeditor/issues/161))

## 3.7.2 - 2024-02-07

- Added the `IndentBlock` CKEditor plugin, enabling the “Increase indent” and “Decrease indent” buttons to work on headings and paragraphs. ([#156](https://github.com/craftcms/ckeditor/pull/156))

## 3.7.1 - 2024-02-01

- Fixed a JavaScript error.

## 3.7.0 - 2024-02-01

- Link element selector modals now include custom sources. ([#139](https://github.com/craftcms/ckeditor/issues/139))
- Updated CKEditor 5 to 41.0.0. ([#141](https://github.com/craftcms/ckeditor/issues/141), [#148](https://github.com/craftcms/ckeditor/pull/148))
- Added the `RemoveFormat` CKEditor plugin. ([#143](https://github.com/craftcms/ckeditor/issues/143))
- Added the `TodoDocumentList` CKEditor plugin. ([#148](https://github.com/craftcms/ckeditor/pull/148))
- Removed the `List`, `ListProperties`, and `TodoList` CKEditor plugins. ([#148](https://github.com/craftcms/ckeditor/pull/148))
- CKEditor fields now get a `not-allowed` cursor when viewing entry revisions. ([#142](https://github.com/craftcms/ckeditor/pull/142)) 
- Fixed a bug where the CKEditor config-creation slideout could keep reappearing if canceled. ([#138](https://github.com/craftcms/ckeditor/pull/138))
- Fixed a conflict with `nystudio107/craft-code-editor` 1.0.14 and 1.0.15. ([#150](https://github.com/craftcms/ckeditor/issues/150))

## 3.6.0 - 2023-09-13

- CKEditor is now released under the GPL-3.0 license.
- HTML Purifier is now configured to allow `style` attributes on `<ol>` and `<ul>` tags, when bulleted/numbered lists are allowed. ([#136](https://github.com/craftcms/ckeditor/issues/136))
- Updated CKEditor 5 to 39.0.2.

## 3.5.1 - 2023-08-29

- Fixed a bug where CKEditor inputs weren’t getting any padding within slideouts. ([#126](https://github.com/craftcms/ckeditor/issues/126)) 
- Fixed a bug where the image transform menu wasn’t visible if only one transform was selected for the field. ([#131](https://github.com/craftcms/ckeditor/issues/131))

## 3.5.0 - 2023-08-22

- CKEditor now requires Craft 4.5.0 or later.
- Added the “Word Limit” field setting. ([#107](https://github.com/craftcms/ckeditor/issues/107))
- Added the “List Plugin” CKEditor config setting. ([#112](https://github.com/craftcms/ckeditor/issues/112), [#122](https://github.com/craftcms/ckeditor/pull/122))
- Added the [Text part language](https://ckeditor.com/docs/ckeditor5/latest/features/language.html) feature.
- Added keyboard shortcuts for switching the heading type for a given block. ([#106](https://github.com/craftcms/ckeditor/issues/106), [#116](https://github.com/craftcms/ckeditor/pull/116))
- CKEditor config edit pages now have a “Save and continue editing” alternative submit action, and the <kbd>Command</kbd>/<kbd>Ctrl</kbd> + <kbd>S</kbd> keyboard shortcut now redirects back to the edit page. ([#108](https://github.com/craftcms/ckeditor/discussions/108))
- CKEditor config edit pages now have a “Save as a new config” alternative submit action. ([#110](https://github.com/craftcms/ckeditor/discussions/110)) 
- The `ckeditor/convert` action will now find and convert `craft\fields\MissingField` instances that were meant to be Redactor fields.
- CKEditor fields with the “Insert table” button now include the `TableProperties` and `TableCellProperties` plugins. ([#103](https://github.com/craftcms/ckeditor/issues/103), [#115](https://github.com/craftcms/ckeditor/discussions/115))
- Norwegian Bokmål and Nynorsk both now load the main Norwegian (no) UI translations. ([#113](https://github.com/craftcms/ckeditor/issues/113))
- Added support for setting the [`toolbar.shouldNotGroupWhenFull`](https://ckeditor.com/docs/ckeditor5/latest/api/module_core_editor_editorconfig-ToolbarConfig.html#member-shouldNotGroupWhenFull) CKEditor config option. ([#124](https://github.com/craftcms/ckeditor/discussions/124))
- The `Attr.AllowedFrameTargets` and `Attr.AllowedRel` HTML Purifier config settings are now automatically set based on the CKEditor `link` configuration. ([#79](https://github.com/craftcms/ckeditor/issues/79))
- `input[type=checkbox]` is now automatically added to the HTML Purifier definition, for editors that include the To-do List button. ([#121](https://github.com/craftcms/ckeditor/pull/121))
- Added `craft\ckeditor\Plugin::registerCkeditorPackage()`.
- Deprecated `craft\ckeditor\web\assets\ckeditor\CkeditorAsset::EVENT_PUBLISH`.
- Fixed a bug where could get marked as dirty when focussed, without making any changes. ([#90](https://github.com/craftcms/ckeditor/issues/90))
- Fixed a bug where the Norwegian Nynorsk UI translations weren’t working. ([#113](https://github.com/craftcms/ckeditor/issues/113))
- Updated CKEditor 5 to 39.0.1.

## 3.4.0 - 2023-05-16

- Added the ability to change an image’s transform. ([#94](https://github.com/craftcms/ckeditor/discussions/94))
- Added support for [registering additional CKEditor plugins](https://github.com/craftcms/ckeditor#adding-ckeditor-plugins). ([#97](https://github.com/craftcms/ckeditor/pull/97))
- CKEditor configs generated from Redactor fields no longer set `link.addTargetToExternalLinks = true` for Redactor fields that had `linkNewTab` enabled. ([#98](https://github.com/craftcms/ckeditor/issues/98))
- Image and media markup defined by Redactor fields now gets updated to be consistent with how CKEditor likes it. ([#96](https://github.com/craftcms/ckeditor/issues/96), [#100](https://github.com/craftcms/ckeditor/pull/100)) 
- Fixed a JavaScript error that occurred if there were no sections, category groups, or volumes.
- Fixed a bug where inserted images were missing their ref tag hashes, if no transform was selected and the field was configured with a default transform.
- Added `craft\ckeditor\web\assets\BaseCkeditorPackageAsset`.
- Added `craft\ckeditor\web\assets\ckeditor\CkeditorAsset::EVENT_PUBLISH`.
- Updated CKEditor 5 to 37.1.0.

## 3.3.0 - 2023-05-02

- Added the “Show the ‘Source’ button for non-admin users?” field setting. ([#82](https://github.com/craftcms/ckeditor/issues/82))
- Link dropdowns now include an “Insert link” option. ([#78](https://github.com/craftcms/ckeditor/discussions/78))
- Link edit forms now include a site selection dropdown, when the URL contains a localizable element’s reference tag. ([#89](https://github.com/craftcms/ckeditor/discussions/89))
- Tables now show a toolbar with row, column, and cell-merging controls. ([#81](https://github.com/craftcms/ckeditor/issues/81))
- Improved the styling of code blocks’ language labels.
- Fixed a bug where fields with `<br>` tags and non-breaking spaces would get marked as dirty without making any changes. ([#85](https://github.com/craftcms/ckeditor/issues/85), [#90](https://github.com/craftcms/ckeditor/issues/90))
- Fixed a bug where changes in Source mode weren’t getting saved, unless Source mode was deactivated. ([#84](https://github.com/craftcms/ckeditor/issues/84))

## 3.2.1 - 2023-04-23

- Fixed an error that occurred when a CKEditor field was used in Quick Post widgets.

## 3.2.0 - 2023-04-19

- Added the “Show word count” field setting. ([#75](https://github.com/craftcms/ckeditor/issues/75))
- Added the [Font](https://ckeditor.com/docs/ckeditor5/latest/features/font.html#configuring-the-font-size-feature) CKEditor plugin, which provides “Font Size” “Font Family”, “Font Color”, and “Font Background Color” toolbar buttons.
- Ordered/unordered list buttons now include [additional options](https://ckeditor.com/docs/ckeditor5/latest/features/lists/lists.html#list-properties).
- Config options are now automatically updated when “Heading”, “Style”, “Alignment”, and “Font Size” buttons are added/removed in the toolbar. ([#73](https://github.com/craftcms/ckeditor/pull/73))
- Fixed a bug where unordered lists weren’t padded. ([#72](https://github.com/craftcms/ckeditor/issues/72))

## 3.1.0 - 2023-04-17

- Added the “Heading Levels” CKEditor config setting.
- Added the `ckeditor/convert` command, for converting Redactor fields/configs to CKEditor. ([#68](https://github.com/craftcms/ckeditor/pull/68))
- “Config Options” settings can now be entered as JSON, with autocompletion and automatic JavaScript-to-JSON reformatting on paste. ([#66](https://github.com/craftcms/ckeditor/pull/66), [#67](https://github.com/craftcms/ckeditor/pull/67))
- The `placeholder` config option now gets translated, when the config options are defined as JSON.
- Images now have caption and alternative text toolbar items by default.
- CKEditor instances no longer support editing features that aren’t explicitly allowed via toolbar items. ([#65](https://github.com/craftcms/ckeditor/discussions/65)) 
- Added `craft\ckeditor\events\ModifyConfigEvent`.
- Added `craft\ckeditor\Field::EVENT_MODIFY_CONFIG`. ([#70](https://github.com/craftcms/ckeditor/discussions/70))
- Fixed a bug where editor toolbars would overlap the control panel header when scrolling.
- Fixed a bug where the editor UI wasn’t getting translated.

## 3.0.0 - 2023-04-12

> **Warning**
> This is a major overhaul of the plugin. Your existing CKEditor fields and content will remain in-tact, however you’ll need to reconfigure your fields with a new CKEditor Config. 

- CKEditor 5 now comes bundled with the plugin.
- Dropped support for CKEditor 4 and custom builds.
- Added globally-managed CKEditor configurations, featuring drag-n-drop toolbars, and inputs for defining custom config options and CSS styles.
- Added the ability to create links to entries, categories, and assets.
- Added the ability to insert asset images, optionally with a transform pre-applied.
- The “Available Volumes”, “Available Transforms”, “Default Transform”, “Show unpermitted volumes”, and “Show unpermitted files” field settings are now supported for CKEditor 5.
- Removed the “Initialization Code” field setting.
- Added `craft\ckeditor\Field::EVENT_DEFINE_LINK_OPTIONS`.
- Added `craft\ckeditor\events\DefineLinkOptionsEvent`.
- Removed `craft\ckeditor\events\ModifyPurifierConfigEvent`.

## 2.2.0 - 2023-01-04
- CKEditor now requires Craft CMS 4.3.6 or later.
- Fixed a bug where CKEditor 4 stopped working when used within a Matrix block, if the block was moved to a new position. ([#23](https://github.com/craftcms/ckeditor/issues/23))
- Fixed a bug where changes made in source mode weren’t saved unless additional changes were made in WYSIWYG mode afterward. ([#34](https://github.com/craftcms/ckeditor/pull/56))

## 2.1.0 - 2022-12-16
- Added RTL language support. ([#33](https://github.com/craftcms/ckeditor/issues/33), [#55](https://github.com/craftcms/ckeditor/pull/55))
- Fixed a bug where it wasn’t possible to browse files. ([#45](https://github.com/craftcms/ckeditor/issues/45))

## 2.0.0 - 2022-05-03

### Added
- Added Craft 4 compatibility

## 1.5.0 - 2023-01-04
- CKEditor now requires Craft CMS 3.7.63 or later.
- Fixed a bug where CKEditor 4 stopped working when used within a Matrix block, if the block was moved to a new position. ([#23](https://github.com/craftcms/ckeditor/issues/23))
- Fixed a bug where changes made in source mode weren’t saved unless additional changes were made in WYSIWYG mode afterward. ([#34](https://github.com/craftcms/ckeditor/pull/56))

## 1.4.0 - 2022-12-16
- Added RTL language support. ([#33](https://github.com/craftcms/ckeditor/issues/33), [#55](https://github.com/craftcms/ckeditor/pull/55))

## 1.3.0 - 2022-02-11

### Changed
- Static element URLs that contain query string parameters are no longer converted to reference tags.

### Deprecated
- Deprecated `craft\ckeditor\events\ModifyPurifierConfigEvent`. `craft\htmlfield\events\ModifyPurifierConfigEvent` should be used instead.

### Fixed
- Fixed a bug where reference tags weren’t getting parsed on the front end.

## 1.2.1 - 2022-02-10

### Fixed
- Fixed an error that occurred if Redactor wasn’t also installed.

## 1.2.0 - 2022-02-08

### Added
- Added support for CKEditor 4’s [file manager integration](https://ckeditor.com/docs/ckeditor4/latest/guide/dev_file_browse_upload.html). ([#11](https://github.com/craftcms/ckeditor/issues/11))
- Added the “Show unpermitted volumes” field setting (CKEditor 4 only).
- Added the “Available unpermitted files” field setting (CKEditor 4 only).
- Added the “Available Volumes” field setting (CKEditor 4 only).
- Added the “Available Transforms” field setting (CKEditor 4 only).
- Added the “Default Transform” field setting (CKEditor 4 only).
- CKEditor fields now convert static element URLs to reference tags on save.

### Changed
- CKEditor now requires Craft 3.7.31 or later.
- The “Initialization Code” field setting now auto-expands its height to fit the contents.
- Custom initialization code can now reference `language`, `filebrowserBrowseUrl`, and `filebrowserImageBrowseUrl` constants, which are predefined.
- It’s now possible to include SVG images within field values, without them being removed by HTML Purifier. They will be sanitized with SVG Sanitizer instead.
- CKEditor 5 32.0.0 is now used by default, if a custom CKEditor Build URL hasn’t been set.

## 1.1.2 - 2021-05-01

### Changed
- Fixed a bug where privacy-enhanced YouTube video embeds were getting stripped out by HTML Purifier. ([craftcms/redactor#312](https://github.com/craftcms/redactor/issues/312))

## 1.1.1 - 2021-04-16

### Changed
- Improved content styles.

## 1.1.0 - 2021-04-16

### Added
- Added support for the “Inline” and “Balloon” CKEditor 5 distributions.

### Changed
- Improved the focussed editor styling.

## 1.0.0.1 - 2021-04-16

### Fixed
- Fixed a PHP error that occurred when saving CKEditor fields.

## 1.0.0 - 2021-04-16

### Added
- Added partial support for CKEditor 4.
- Added the “CKEditor Build URL” plugin setting, making it possible to customize which CKEditor build is used.
- Added the “Initialization Code” field setting, making it possible to take control over the editor initialization and configuration.
- Added `craft\ckeditor\Field::EVENT_MODIFY_PURIFIER_CONFIG`, which makes it possible to modify the HTML Purifier config at runtime.

### Changed
- The plugin now requires Craft 3.6 or later.
- CKEditor 5 (27.0.0, “classic” build) is now used by default.
- The default HTML Purifier config now allows video embeds from YouTube and Vimeo.

## 1.0.0-beta.3 - 2020-03-27

### Changed
- CKEditor fields’ default HTML Purifier config now allows `id` attributes. ([craftcms/redactor#82](https://github.com/craftcms/redactor/issues/82)) 

### Fixed
- Fixed a bug where content changes weren’t getting saved in Craft 3.4. ([#22](https://github.com/craftcms/ckeditor/issues/22))
- Fixed a deprecation error. ([#17](https://github.com/craftcms/ckeditor/issues/17)) 
- Fixed a bug where an empty CKEditor field would return some HTML content.

## 1.0.0-beta.2 - 2018-01-15

### Changed
- Improved the field content legibility.

### Fixed
- Fixed a bug where lists were’t getting indented, and were missing their bullets/numerals. ([#1](https://github.com/craftcms/ckeditor/issues/1))

## 1.0.0-beta.1 - 2017-12-04

Initial release.
