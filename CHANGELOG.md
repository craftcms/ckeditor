# Release Notes for CKEditor for Craft CMS

## Unreleased

### Changed
- Improved content styles.

## 1.1.0 - 2021-04-14

### Added
- Added support for the “Inline” and “Balloon” CKEditor 5 distributions.

### Changed
- Improved the focussed editor styling.

## 1.0.0.1 - 2021-04-14

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
