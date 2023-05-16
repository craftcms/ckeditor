# Release Notes for CKEditor for Craft CMS

## Unreleased

- Added the ability to change an image’s transform. ([#94](https://github.com/craftcms/ckeditor/discussions/94))
- Added support for [registering additional CKEditor plugins](https://github.com/craftcms/ckeditor#adding-ckeditor-plugins). ([#97](https://github.com/craftcms/ckeditor/pull/97))
- CKEditor configs generated from Redactor fields no longer set `link.addTargetToExternalLinks = true` for Redactor fields that had `linkNewTab` enabled. ([#98](https://github.com/craftcms/ckeditor/issues/98))
- Image and media markup defined by Redactor fields now gets updated to be consistent with how CKEditor likes it. ([#96](https://github.com/craftcms/ckeditor/issues/96), [#100](https://github.com/craftcms/ckeditor/pull/100)) 
- Fixed a JavaScript error that occurred if there were no sections, category groups, or volumes.
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
