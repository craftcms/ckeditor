# Release Notes for CKEditor for Craft CMS

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
